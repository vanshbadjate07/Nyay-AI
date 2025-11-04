# 🚀 How to Run NyayAI

## Quick Start (3 Steps)

### Step 1: Open Terminal
- Open Terminal app on your Mac
- Navigate to project folder:
```bash
cd /Users/vanshbadjate/Desktop/IPR/Nyay-AI
```

### Step 2: Configure API Key (First Time Only)
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Google Gemini API key
# GOOGLE_API_KEY=your_actual_api_key_here
```

### Step 3: Start the Server
```bash
venv/bin/uvicorn backend.main:app --reload
```

### Step 4: Open Browser
- Open your browser (Chrome, Safari, etc.)
- Go to: **http://localhost:8000**

**That's it! NyayAI is now running!** 🎉

---

## 🛑 How to Stop the Server

In the terminal where server is running:
- Press `Ctrl + C`

---

## 🔄 If You Get Errors

### Error: "No module named uvicorn"
**Solution:** Reinstall dependencies
```bash
cd /Users/vanshbadjate/Desktop/Nyay-AI
rm -rf venv
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

### Error: "Address already in use"
**Solution:** Kill existing server
```bash
pkill -f "uvicorn backend.main:app"
```
Then start again.

### Error: "GOOGLE_API_KEY not found"
**Solution:** Create `.env` file
```bash
cp .env.example .env
# Edit .env and add your API key
```

---

## 📝 Full Setup (First Time Only)

If you're setting up for the first time:

### 1. Install Python (if not installed)
```bash
# Check if Python is installed
python3 --version
```

### 2. Install Tesseract OCR
```bash
brew install tesseract
```

### 3. Create Virtual Environment
```bash
cd /Users/vanshbadjate/Desktop/Nyay-AI
python3 -m venv venv
```

### 4. Install Dependencies
```bash
venv/bin/pip install -r requirements.txt
```

### 5. Configure API Key
```bash
# Copy example file
cp .env.example .env

# Edit .env file and add your Google Gemini API key
# GOOGLE_API_KEY=your_actual_api_key_here
```

### 6. Run the Server
```bash
venv/bin/uvicorn backend.main:app --reload
```

### 7. Open Browser
Go to: **http://localhost:8000**

---

## 🎯 Simple Commands Reference

| Task | Command |
|------|---------|
| **Start Server** | `venv/bin/uvicorn backend.main:app --reload` |
| **Stop Server** | Press `Ctrl + C` in terminal |
| **Kill Server** | `pkill -f "uvicorn backend.main:app"` |
| **Reinstall** | `venv/bin/pip install -r requirements.txt` |
| **Check Health** | Open `http://localhost:8000/health` |

---

## 🌐 Access URLs

- **Main App**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs (FastAPI auto-generated)

---

## 💡 Tips

1. **Keep Terminal Open**: Don't close the terminal while using the app
2. **Use `--reload`**: Auto-restarts when you change code
3. **Check Logs**: Terminal shows all requests and errors
4. **Test API**: Use `/health` endpoint to verify server is running

---

## 🐛 Common Issues

### Port 8000 Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### Virtual Environment Not Working
```bash
# Delete and recreate
rm -rf venv
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

### Import Errors
```bash
# Make sure you're in the right directory
pwd
# Should show: /Users/vanshbadjate/Desktop/Nyay-AI

# Run from project root
venv/bin/uvicorn backend.main:app --reload
```

---

## 📱 For Production Deployment

If you want to deploy to a server:

```bash
# Without auto-reload (more stable)
venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000

# With multiple workers
venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## ✅ Checklist Before Running

- [ ] Terminal is open
- [ ] In correct directory (`/Users/vanshbadjate/Desktop/Nyay-AI`)
- [ ] Virtual environment exists (`venv/` folder)
- [ ] Dependencies installed
- [ ] `.env` file with API key exists
- [ ] Port 8000 is free

---

**Need Help?** Check the main `README.md` for detailed documentation.
