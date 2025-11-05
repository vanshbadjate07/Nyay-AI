import os
import requests
import time
from typing import List, Dict, Optional
from langdetect import detect, LangDetectException

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiClient:
    """Enhanced Gemini client with fine-tuned prompts for legal document processing."""
    
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash-exp") -> None:
        self.api_key = api_key
        self.model = model

    def _generate(self, prompt: str, temperature: float = 0.3, max_retries: int = 3) -> str:
        """Generate content with retry logic and better error handling."""
        if not self.api_key:
            return "[Gemini API key not configured. Set GOOGLE_API_KEY in .env]"
        
        url = f"{GEMINI_API_BASE}/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 8192,
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }
        
        for attempt in range(max_retries):
            try:
                resp = requests.post(url, json=payload, timeout=90)
                
                # Handle rate limiting specifically
                if resp.status_code == 429:
                    wait_time = (2 ** attempt) * 2  # Longer wait for rate limits
                    if attempt < max_retries - 1:
                        time.sleep(wait_time)
                        continue
                    return "[Rate limit exceeded. Please wait a moment and try again.]"
                
                resp.raise_for_status()
                data = resp.json()
                
                # Parse text
                candidates = data.get("candidates", [])
                if not candidates:
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    return "[No response from Gemini. Please try again.]"
                
                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    return "[No text content from Gemini. Please try again.]"
                
                return parts[0].get("text", "").strip()
                
            except requests.exceptions.Timeout:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return "[Request timeout. Please try again with a shorter document.]"
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep((2 ** attempt) * 2)  # Longer wait
                    continue
                # Don't expose full error URL with API key
                error_msg = str(e).split('?')[0] if '?' in str(e) else str(e)
                return f"[Network error. Please wait a moment and try again.]"
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return f"[Error: {str(e)}. Please try again.]"
        
        return "[Failed after multiple attempts. Please wait a few minutes and try again.]"

    def text(self, prompt: str, temperature: float = 0.3) -> str:
        """Generate text with specified temperature."""
        return self._generate(prompt, temperature=temperature)
    
    def detect_language(self, text: str) -> str:
        """Detect the language of input text."""
        try:
            if not text or len(text.strip()) < 10:
                return "English"
            
            lang_code = detect(text[:500])  # Use first 500 chars for detection
            
            # Map language codes to full names
            lang_map = {
                "en": "English",
                "hi": "Hindi",
                "mr": "Marathi",
                "ta": "Tamil",
                "te": "Telugu",
                "bn": "Bengali",
                "gu": "Gujarati",
                "kn": "Kannada",
                "ml": "Malayalam",
                "pa": "Punjabi",
            }
            
            return lang_map.get(lang_code, "English")
        except (LangDetectException, Exception):
            return "English"

    def build_chat_prompt(
        self,
        system_preamble: str,
        language_note: str,
        messages: List[Dict[str, str]],
    ) -> str:
        """Build chat prompt from conversation history."""
        convo_lines: List[str] = []
        if system_preamble:
            convo_lines.append(f"System: {system_preamble}")
        if language_note:
            convo_lines.append(f"System: {language_note}")
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            prefix = "User" if role == "user" else "Assistant"
            convo_lines.append(f"{prefix}: {content}")
        convo_lines.append("Assistant:")
        return "\n".join(convo_lines)

    def classify_legal(self, text: str) -> str:
        """Classify if text is legal/conversational or completely off-topic."""
        text_lower = text.lower().strip()
        
        # Allow greetings and conversational phrases
        greetings = ["hi", "hello", "hey", "namaste", "good morning", "good evening", 
                     "good afternoon", "how are you", "thanks", "thank you", "bye"]
        
        if any(greeting in text_lower for greeting in greetings):
            return "LEGAL"  # Allow friendly conversation
        
        # Check for obviously non-legal topics
        non_legal_topics = [
            "resume", "cv", "curriculum vitae", "job application",
            "ceo of", "founder of", "who is the ceo",
            "recipe", "cooking", "food preparation",
            "movie", "film", "entertainment",
            "sports", "cricket", "football", "match",
            "weather", "temperature", "climate today"
        ]
        
        if any(topic in text_lower for topic in non_legal_topics):
            return "NOT_LEGAL"
        
        # For everything else, allow it (let Gemini handle the context)
        return "LEGAL"

    def summarize_legal(self, text: str, language: Optional[str] = None) -> str:
        """Generate comprehensive legal summary with optimized prompt."""
        lang_instruction = ""
        if language and language != "English":
            lang_instruction = f"""
**CRITICAL INSTRUCTION - MUST FOLLOW:**
You MUST respond ENTIRELY in {language} language. Every single word, heading, and explanation must be in {language}.
Do NOT use English. Translate everything to {language}.
This is MANDATORY.
"""
        
        prompt = f"""You are "Nyay-AI," an AI Legal Assistant specialized in understanding Indian legal documents and explaining them in plain, natural language.
{lang_instruction}
### **Your Task:**
Carefully read and summarize the following legal document, covering all key elements below:

1. **Document Type** – Identify what kind of document it is (e.g., Court Order, FIR, RTI Application, Agreement, Notice, Affidavit, Judgment, Petition, etc.)

2. **Key Parties Involved** – List the main individuals, organizations, or authorities mentioned (plaintiff, defendant, petitioner, respondent, etc.)

3. **Main Issue / Purpose** – What is this document about? What problem or legal matter does it describe?

4. **Important Details:**
   - Dates, deadlines, or time limits
   - Any monetary values, fines, compensations, or penalties
   - Obligations, permissions, or restrictions
   - Rights being used, claimed, or violated
   - Case numbers, sections, or legal provisions cited

5. **Legal Implications** – What legal meaning or consequence does this document carry for each party involved? What happens next?

6. **Required Actions** – What should the reader do next? Include any deadlines, authorities to contact, or documents to prepare.

7. **Risk / Concern** – Mention any possible legal risks, penalties, time-sensitive matters, or points of caution.

---

### **Guidelines for Writing:**
- Use **very simple and natural language**, understandable to a 10th-grade student
- **Avoid legal jargon**. If a legal term is necessary, explain it in plain words immediately
- Use **bullet points** or short paragraphs for clarity
- Focus on **what the document means for the common person**
- Be **neutral, factual, and concise**, but ensure completeness
- **Highlight urgent actions or legal deadlines** clearly with ⚠️ or 🔴
- Use emojis sparingly for emphasis (⚖️ for legal, 📅 for dates, 💰 for money, ⚠️ for warnings)

---

### **Legal Document:**
{text}

---

### **Simplified Legal Explanation:**"""
        
        return self._generate(prompt, temperature=0.4)

    def generate_legal_draft(self, issue_text: str, language: Optional[str] = None) -> str:
        """Generate legal draft with optimized prompt."""
        lang_instruction = ""
        if language and language != "English":
            lang_instruction = f"""
**CRITICAL INSTRUCTION - MUST FOLLOW:**
You MUST write the ENTIRE draft in {language} language. Every word, every section, every heading must be in {language}.
Do NOT use English. This is MANDATORY.
"""
        
        prompt = f"""You are "Nyay-AI Draft Writer," an experienced Indian legal expert with over 20 years of practice.
Your role is to draft accurate, professional, and submission-ready legal documents for Indian users.
{lang_instruction}
---

### **Your Task:**
Generate a formal legal draft based on the issue or summary provided below.
The document should be written in proper Indian legal format and ready for official submission.

---

### **Draft Requirements:**
1. **Document Type Identification** – Choose the most appropriate format (RTI Application, Legal Notice, FIR, Complaint, Appeal, Affidavit, or Petition)
2. **Professional Structure** – Follow standard Indian legal formatting, tone, and language
3. **Completeness** – Include all necessary sections, fields, legal provisions, and closing statements
4. **Ready to Print/Submit** – The document should look final and usable as-is
5. **Context Awareness** – Ensure the draft fits naturally with the user's legal issue
6. **Proper Formatting** – Use clear headings, proper spacing, and professional layout

---

### **Reference Structures:**

**For RTI Application:**
- To: [Public Information Officer Details]
- Subject: Application under the Right to Information Act, 2005
- Body: Clear and direct questions/information sought
- Applicant details (name, address, contact)
- Date and signature line

**For Legal Notice:**
- Notice Header and Subject Line
- To: [Recipient Details with full address]
- Facts of the Case (chronological order)
- Legal Provisions & Claims (cite relevant sections/acts)
- Demands or Actions Expected
- Response Deadline (typically 15-30 days)
- Consequences of Non-Compliance
- From: [Sender Details with address]
- Date and signature

**For Complaint/FIR:**
- To: [Authority/Police Station with full address]
- Subject: Complaint regarding [specific issue]
- Incident Details (date, time, place, parties involved)
- Description of Events (clear, factual, chronological)
- Evidence/Witnesses (if any)
- Relief Sought (specific action requested)
- Complainant Details (name, address, contact)
- Date and signature

**For General Complaint:**
- To: [Authority/Department]
- Subject: [Clear, specific subject line]
- Background/Context
- Issue Description (detailed, factual)
- Supporting Facts/Evidence
- Relief/Action Requested
- Complainant Details
- Date and signature

---

### **Issue/Summary:**
{issue_text}

---

### **Final Legal Draft:**
(Generate a complete, professional, and submission-ready draft below)"""
        
        return self._generate(prompt, temperature=0.5)

    def validate_api_key(self) -> bool:
        """Validate if the API key is working."""
        try:
            test_prompt = "Respond with just the word 'OK' if you can read this."
            result = self._generate(test_prompt, temperature=0.1)
            return "OK" in result.upper() or len(result) > 0
        except Exception:
            return False
