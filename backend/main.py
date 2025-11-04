import os
import uuid
from typing import List, Optional
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .services.gemini_enhanced import GeminiClient
from .services.ocr import extract_text_from_file
from .services.export import make_pdf_from_text

# Load environment variables from .env file
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set. Please create a .env file with your API key.")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", ".uploads")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
MAX_FILE_BYTES = int(os.getenv("MAX_FILE_BYTES", str(15 * 1024 * 1024)))  # 15 MB
ALLOWED_EXTS = {".pdf", ".jpg", ".jpeg", ".png", ".docx"}

# Resolve project root (one level up from this file's directory)
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
STATIC_DIR = os.path.join(ROOT_DIR, "static")

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="NyayAI", version="0.1.0")

origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins == ["*"] else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static assets
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

_gemini = GeminiClient(api_key=GOOGLE_API_KEY, model=GEMINI_MODEL)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = None


@app.get("/health")
async def health() -> JSONResponse:
    """Health check endpoint with API validation."""
    api_valid = _gemini.validate_api_key()
    return JSONResponse({
        "status": "ok",
        "gemini_api": "connected" if api_valid else "error",
        "model": GEMINI_MODEL
    })


@app.get("/")
async def index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    return FileResponse(index_path, media_type="text/html")


@app.post("/api/chat")
async def chat(req: ChatRequest) -> JSONResponse:
    """Enhanced chat endpoint with legal verification."""
    # Get the last user message
    last_user_msg = None
    for msg in reversed(req.messages):
        if msg.role == "user":
            last_user_msg = msg.content
            break
    
    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found")
    
    # Verify if the question is legal-related
    verification = _gemini.classify_legal(last_user_msg)
    
    if verification.upper() != "LEGAL":
        return JSONResponse({
            "reply": "I appreciate your question, but I'm specifically designed to help with legal matters related to Indian law. 😊\n\n"
                    "**I can help you with:**\n\n"
                    "• Understanding your legal rights and obligations\n"
                    "• Court procedures and legal processes\n"
                    "• Filing FIR, RTI applications, and complaints\n"
                    "• Legal documents and contracts\n"
                    "• Consumer protection and disputes\n"
                    "• Property, family, and employment law\n"
                    "• Legal guidance and documentation\n\n"
                    "**For example, you can ask:**\n"
                    "- \"How do I file an RTI application?\"\n"
                    "- \"What are my rights as a tenant?\"\n"
                    "- \"How to file a consumer complaint?\"\n\n"
                    "Feel free to ask me anything related to Indian law! ⚖️"
        })
    
    # Proceed with legal response
    system_preamble = (
        "You are NyayAI, a friendly and helpful Indian legal assistant. Your purpose is to help citizens "
        "understand Indian law, legal procedures, and their rights in a simple and conversational way.\n\n"
        "**Your Personality:**\n"
        "- Warm, friendly, and approachable\n"
        "- Patient and understanding\n"
        "- Clear and easy to understand\n"
        "- Helpful and supportive\n\n"
        "**What You Do:**\n"
        "1. Greet users warmly and make them feel comfortable\n"
        "2. Answer questions about Indian law in simple language\n"
        "3. Explain legal processes, rights, and obligations clearly\n"
        "4. Help with legal documents (RTI, FIR, complaints, notices)\n"
        "5. Provide guidance on legal matters affecting common citizens\n"
        "6. Suggest next steps and actions when needed\n\n"
        "**What You Don't Do:**\n"
        "- Don't answer questions about resumes, CVs, or job applications\n"
        "- Don't discuss company CEOs, business leaders, or corporate matters\n"
        "- Don't provide recipes, movie reviews, or sports updates\n"
        "- Politely redirect to legal topics if asked about non-legal matters\n\n"
        "**Important:**\n"
        "- Be conversational and natural\n"
        "- Use examples to explain complex concepts\n"
        "- Always include a disclaimer for legal advice\n"
        "- Encourage users to consult lawyers for serious matters\n\n"
        "**Disclaimer to include:**\n"
        "'⚖️ Note: This is AI-generated guidance. For specific legal matters, please consult a qualified lawyer.'"
    )
    language_note = f"\n**CRITICAL: Respond ONLY in {req.language} language. Translate everything to {req.language}.**" if req.language and req.language != "English" else ""

    prompt = _gemini.build_chat_prompt(
        system_preamble=system_preamble,
        language_note=language_note,
        messages=[{"role": m.role, "content": m.content} for m in req.messages],
    )
    reply = _gemini.text(prompt, temperature=0.3)
    return JSONResponse({"reply": reply})


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)) -> JSONResponse:
    """Enhanced upload endpoint with better error handling."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTS)}"
        )

    saved_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")
    
    if len(content) > MAX_FILE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=400, 
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed: 15 MB."
        )

    with open(saved_path, "wb") as f:
        f.write(content)

    try:
        extracted_text = extract_text_from_file(saved_path)
        
        # Detect language if possible
        detected_lang = _gemini.detect_language(extracted_text)
        
        return JSONResponse({
            "file_id": file_id,
            "filename": file.filename,
            "text": extracted_text,
            "detected_language": detected_lang,
            "text_length": len(extracted_text)
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        try:
            os.remove(saved_path)
        except Exception:
            pass


class VerifyRequest(BaseModel):
    text: str


@app.post("/api/verify")
async def verify(req: VerifyRequest) -> JSONResponse:
    label = _gemini.classify_legal(req.text)
    return JSONResponse({"label": label})


class SummarizeRequest(BaseModel):
    text: str
    language: Optional[str] = None


@app.post("/api/summarize")
async def summarize(req: SummarizeRequest) -> JSONResponse:
    summary = _gemini.summarize_legal(req.text, language=req.language)
    return JSONResponse({"summary": summary})


class DraftRequest(BaseModel):
    text: str
    language: Optional[str] = None


@app.post("/api/draft")
async def draft(req: DraftRequest) -> JSONResponse:
    draft_text = _gemini.generate_legal_draft(req.text, language=req.language)
    return JSONResponse({"draft": draft_text})


class ExportPdfRequest(BaseModel):
    content: str
    filename: Optional[str] = None


@app.post("/api/export/pdf")
async def export_pdf(req: ExportPdfRequest):
    pdf_bytes = make_pdf_from_text(req.content)
    filename = (req.filename or "nyayai_output").replace("/", "_") + ".pdf"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(pdf_bytes.getvalue())
    return FileResponse(path, filename=filename, media_type="application/pdf")
