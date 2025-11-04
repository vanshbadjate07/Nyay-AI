#!/bin/bash

echo "🚀 NyayAI Installation Script"
echo "=============================="
echo ""

# Check Python version
echo "📋 Checking Python version..."
python3 --version
if [ $? -ne 0 ]; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

# Check Tesseract
echo ""
echo "📋 Checking Tesseract OCR..."
tesseract --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Tesseract not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install tesseract
    else
        echo "❌ Homebrew not found. Please install Tesseract manually:"
        echo "   brew install tesseract"
        exit 1
    fi
else
    echo "✅ Tesseract is installed"
fi

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi
echo "✅ Virtual environment created"

# Activate virtual environment
echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    echo "💡 Trying alternative installation without PyMuPDF..."
    pip install fastapi uvicorn[standard] python-multipart pydantic requests python-dotenv pytesseract Pillow pdfplumber python-docx reportlab langdetect google-generativeai
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 To start the application:"
echo "   1. Activate virtual environment: source venv/bin/activate"
echo "   2. Run the server: uvicorn backend.main:app --reload"
echo "   3. Open browser: http://127.0.0.1:8000"
echo ""
echo "📚 For more information, see README.md"
