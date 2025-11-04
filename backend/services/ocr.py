import os
from typing import Optional

import pdfplumber
from PIL import Image
import pytesseract
from docx import Document


def _extract_pdf_text(pdf_path: str) -> str:
    """Extract text from PDF using pdfplumber with OCR fallback."""
    # Try vector text extraction first
    try:
        text_parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text(x_tolerance=1, y_tolerance=1)
                if page_text:
                    text_parts.append(page_text)
                else:
                    # If no text, try OCR on the page image
                    try:
                        img = page.to_image(resolution=300).original
                        ocr_text = pytesseract.image_to_string(img)
                        if ocr_text.strip():
                            text_parts.append(ocr_text)
                    except Exception:
                        pass
        
        text = "\n".join(text_parts).strip()
        return text if text else ""
    except Exception as e:
        # If pdfplumber fails completely, return empty
        return ""


def _extract_docx_text(path: str) -> str:
    try:
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs).strip()
    except Exception:
        return ""


def _extract_image_text(path: str) -> str:
    try:
        img = Image.open(path)
        return pytesseract.image_to_string(img).strip()
    except Exception:
        return ""


def extract_text_from_file(path: str) -> str:
    """Extract text from various file formats with error handling."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    
    if os.path.getsize(path) == 0:
        raise ValueError("File is empty")
    
    ext = os.path.splitext(path)[1].lower()
    
    if ext in {".pdf"}:
        text = _extract_pdf_text(path)
        if not text or len(text.strip()) < 10:
            raise ValueError("Could not extract text from PDF. The file may be corrupted or contain only images without OCR.")
        return text
    
    if ext in {".jpg", ".jpeg", ".png"}:
        text = _extract_image_text(path)
        if not text or len(text.strip()) < 10:
            raise ValueError("Could not extract text from image. Please ensure the image contains clear, readable text.")
        return text
    
    if ext in {".docx"}:
        text = _extract_docx_text(path)
        if not text or len(text.strip()) < 10:
            raise ValueError("Could not extract text from DOCX file. The file may be empty or corrupted.")
        return text
    
    # Try as plain text
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
            if not text or len(text.strip()) < 10:
                raise ValueError("File appears to be empty or contains insufficient text.")
            return text
    except Exception as e:
        raise ValueError(f"Could not read file: {str(e)}")
