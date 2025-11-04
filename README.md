# ⚖️ NyayAI - AI Legal Assistant for Indian Law

**NyayAI** is an AI-powered legal assistant that helps Indian citizens understand legal documents, get answers to legal questions, and generate legal drafts in 10+ Indian languages.

🚀 **Powered by Google Gemini 2.0 Flash AI**

---

## 🎯 What Can NyayAI Do?

- 📄 **Analyze Legal Documents** - Upload PDFs, images, or Word documents and get simple summaries
- 💬 **Answer Legal Questions** - Ask anything about Indian law in your language
- 📝 **Generate Legal Drafts** - Create RTI applications, FIR complaints, legal notices
- 🎙️ **Listen to Responses** - Text-to-speech in multiple Indian languages
- 🌐 **Multi-Language** - Works in English, Hindi, Marathi, Tamil, Telugu, and 6 more languages

---

## ✨ Features

### 📄 **Document Analysis**
- Upload legal documents (PDF, DOCX, JPG, PNG)
- Automatic text extraction using OCR (Tesseract)
- AI-powered summaries in plain language
- Extract key points and legal obligations
- Multi-language support (10+ Indian languages)

### 💬 **Legal Q&A Chat**
- Ask legal questions in simple language
- Strict legal verification (rejects non-legal questions)
- Context-aware responses with conversation history
- Instant AI-powered answers

### 📝 **Legal Draft Generation**
- Generate RTI (Right to Information) applications
- Create FIR (First Information Report) drafts
- Prepare legal notices and complaints
- Professional formatting ready for submission

### 🎙️ **Text-to-Speech**
- Listen to responses in natural voice
- Multi-language voice support
- Adjustable speed (1.2x) and pitch (1.05)
- Smart voice selection (prefers Google/Premium voices)

### 🌐 **Multi-Language Support**
- English, Hindi (हिन्दी), Marathi (मराठी)
- Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা)
- Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ)

### 📥 **Export Options**
- Download responses as PDF
- Copy to clipboard (one-click)
- Professional PDF formatting

---

## 🛠️ Technology Stack

### **Backend**
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Python web framework for REST API |
| **Google Gemini 2.0 Flash** | AI model for legal analysis |
| **pdfplumber** | Extract text from PDF documents |
| **pytesseract** | OCR for scanned documents and images |
| **python-docx** | Process Word documents |
| **reportlab** | Generate PDF exports |
| **langdetect** | Automatic language detection |
| **requests** | HTTP client for Gemini API |

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic markup |
| **CSS3** | Modern responsive design (ChatGPT-inspired UI) |
| **Vanilla JavaScript** | No framework dependencies |
| **Web Speech API** | Text-to-speech functionality |
| **Clipboard API** | Copy to clipboard |
| **File API** | Document uploads |

### **AI Integration**
- **Model**: `gemini-2.0-flash-exp`
- **Temperature**: 0.3 (focused responses)
- **Classification Temperature**: 0.05 (strict legal verification)
- **Rate Limiting**: Exponential backoff with 3 retries
- **Max Tokens**: 8192 per response

---

## 📁 Project Structure

```
Final/
├── backend/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application & API endpoints
│   └── services/
│       ├── gemini_enhanced.py       # Gemini AI client with legal verification
│       ├── ocr.py                   # Document text extraction (PDF, OCR, DOCX)
│       └── export.py                # PDF generation for exports
│
├── frontend/
│   └── index.html                   # Main UI (ChatGPT-style interface)
│
├── static/
│   ├── styles.css                   # Application styles (dark theme)
│   └── script.js                    # Frontend logic (chat, upload, voice)
│
├── .uploads/                        # Temporary file storage (auto-created)
├── venv/                            # Python virtual environment
├── requirements.txt                 # Python dependencies
├── install.sh                       # Installation script
└── README.md                        # This file
```

---

## 🚀 Installation

### **Prerequisites**
- **Python 3.8+** (Python 3.9 or 3.10 recommended)
- **pip** (Python package manager)
- **Tesseract OCR** (for image text extraction)
- **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/yourusername/nyayai.git
cd nyayai
```

### **Step 2: Install Tesseract OCR**

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Windows:**
1. Download installer from [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install and add to PATH

**Verify installation:**
```bash
tesseract --version
```

### **Step 3: Set Up Python Environment**

**Option A: Using install.sh (Recommended)**
```bash
chmod +x install.sh
./install.sh
```

**Option B: Manual Installation**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### **Step 4: Configure Environment Variables**

Create a `.env` file in the project root:
```bash
GOOGLE_API_KEY=your_gemini_api_key_here
```

**Optional environment variables:**
```bash
GEMINI_MODEL=gemini-2.0-flash-exp
UPLOAD_DIR=.uploads
MAX_FILE_BYTES=15728640  # 15 MB
CORS_ORIGINS=*
```

---

## ▶️ How to Run

### **Start the Application**

1. **Activate virtual environment:**
```bash
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows
```

2. **Start the server:**
```bash
uvicorn backend.main:app --reload
```

3. **Open in browser:**
```
http://localhost:8000
```

### **Production Deployment**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🔍 How It Works

### **1. Document Upload Flow**
```
User uploads document
    ↓
Backend receives file → Validates file type & size
    ↓
Extract text:
  - PDF: pdfplumber extracts text
  - Images: pytesseract OCR
  - DOCX: python-docx extracts text
    ↓
Gemini AI verifies if legal content
    ↓
If legal → Generate summary + key points
    ↓
Return to frontend → Display with action buttons
```

### **2. Chat Flow**
```
User asks question
    ↓
Frontend sends to /api/chat
    ↓
Gemini classifies: Legal or Not Legal?
    ↓
If legal → Generate detailed response
If not legal → Polite rejection message
    ↓
Return response → Display in chat
```

### **3. Draft Generation Flow**
```
User requests draft (RTI/FIR/Notice)
    ↓
Gemini generates professional draft
    ↓
Format with proper structure
    ↓
User can download as PDF or copy
```

---

## 🎨 Frontend Features

### **ChatGPT-Inspired UI**
- Dark theme (#343541 background)
- Sidebar with "New Chat" button
- Message bubbles with avatars (👤 User, ⚖️ Assistant)
- Alternating message backgrounds
- Smooth animations and transitions

### **Input Field**
- Auto-expanding textarea
- Upload button (📎) for documents
- Send button (enabled when text entered)
- Placeholder: "Ask a legal question or upload a document..."

### **Action Buttons**
Every response includes:
- **📋 Copy** - Copy to clipboard
- **🔊 Listen** - Text-to-speech
- **⏹ Stop** - Stop playback
- **⬇️ Download** - Export as PDF
- **📝 Generate Draft** - Create legal draft

### **Responsive Design**
- Works on mobile, tablet, desktop
- Touch-optimized buttons
- Auto-scroll to latest message

---

## 🔒 Security & Privacy

### **Data Handling**
- ✅ Uploaded files stored temporarily in `.uploads/`
- ✅ No permanent storage or database
- ✅ API keys in environment variables (never in code)
- ✅ File validation (type, size, content)

### **API Security**
- ✅ Rate limiting with exponential backoff
- ✅ Error messages don't expose API keys
- ✅ CORS configured for security
- ✅ Input sanitization

---

## 📝 Development Notes

### **Backend Architecture**
- **main.py**: FastAPI app, routes, middleware
- **gemini_enhanced.py**: AI client with retry logic, legal classification
- **ocr.py**: Document processing (PDF, OCR, DOCX)
- **export.py**: PDF generation using reportlab

### **Frontend Architecture**
- **index.html**: Structure, welcome screen, chat area
- **styles.css**: Dark theme, responsive design
- **script.js**: Chat logic, file upload, voice synthesis

### **Key Functions**

**Backend:**
- `classify_legal()` - Strict legal content verification
- `summarize_legal()` - Generate plain-language summaries
- `generate_legal_draft()` - Create legal documents
- `extract_text_from_file()` - Multi-format text extraction

**Frontend:**
- `sendMessage()` - Send chat messages
- `handleFileUpload()` - Process document uploads
- `speak()` - Text-to-speech with voice selection
- `copyToClipboard()` - Copy with markdown removal

---

## 📊 Performance

### **Response Times**
- Chat: 2-5 seconds
- Document upload: 5-15 seconds (depends on file size)
- PDF export: 1-2 seconds
- Voice synthesis: Instant start

### **Limits**
- Max file size: 15 MB
- Supported formats: PDF, DOCX, JPG, PNG
- Max output tokens: 8192
- Rate limiting: 3 retries with exponential backoff

---

## ⚠️ Disclaimer

**NyayAI is an AI-powered tool designed to assist with legal information. It is NOT a substitute for professional legal advice.**

- ⚠️ Always consult a qualified lawyer for specific legal matters
- ⚠️ AI-generated content may contain errors or inaccuracies
- ⚠️ Legal information is general and may not apply to your situation
- ⚠️ Use at your own discretion and verify important information

---
