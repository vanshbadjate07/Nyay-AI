const API_BASE = "http://127.0.0.1:8000";

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const languageSelect = document.getElementById("language");
const newChatBtn = document.getElementById("newChatBtn");

let messages = [];
let isProcessing = false;
let voicesLoaded = false;

// Load voices on page load
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
    const voices = speechSynthesis.getVoices();
    console.log('✅ Voices loaded:', voices.length);
    
    // Log available voices for debugging
    console.log('📢 Available voices:');
    voices.forEach((voice, i) => {
      if (voice.lang.startsWith('en') || voice.lang.startsWith('hi')) {
        console.log(`${i}. ${voice.name} (${voice.lang}) ${voice.default ? '⭐ DEFAULT' : ''}`);
      }
    });
  };
  // Trigger voice loading
  speechSynthesis.getVoices();
  
  // Try again after a delay (some browsers need this)
  setTimeout(() => {
    if (!voicesLoaded) {
      speechSynthesis.getVoices();
    }
  }, 100);
}

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
  
  // Enable/disable send button
  sendBtn.disabled = !inputEl.value.trim() || isProcessing;
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  showWelcomeScreen();
  checkApiHealth();
});

async function checkApiHealth() {
  try {
    const r = await fetch(`${API_BASE}/health`);
    const data = await r.json();
    if (data.gemini_api !== 'connected') {
      addAssistantMessage('⚠️ Warning: Gemini API connection issue. Some features may not work properly.');
    }
  } catch (e) {
    addAssistantMessage('⚠️ Warning: Cannot connect to backend server. Please ensure the server is running.');
  }
}

function showWelcomeScreen() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome-screen';
  welcome.innerHTML = `
    <div class="welcome-logo">⚖️</div>
    <h1 class="welcome-title">Welcome to NyayAI</h1>
    <p class="welcome-subtitle">Your AI-powered legal assistant for Indian law. Get help understanding legal documents, answering legal questions, and generating legal drafts.</p>
    
    <div class="welcome-features">
      <div class="feature-card">
        <div class="feature-icon">📄</div>
        <div class="feature-title">Document Analysis</div>
        <div class="feature-desc">Upload legal documents in PDF, DOCX, or image format for instant analysis and summarization.</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">💬</div>
        <div class="feature-title">Legal Questions</div>
        <div class="feature-desc">Ask any legal question in your preferred language and get clear, simple answers.</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📝</div>
        <div class="feature-title">Draft Generation</div>
        <div class="feature-desc">Generate professional legal drafts like RTI applications, FIR, complaints, and notices.</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🌐</div>
        <div class="feature-title">10+ Languages</div>
        <div class="feature-desc">Get responses in English, Hindi, Marathi, Tamil, Telugu, Bengali, and more Indian languages.</div>
      </div>
    </div>
  `;
  chatEl.appendChild(welcome);
}

function clearWelcomeScreen() {
  const welcome = chatEl.querySelector('.welcome-screen');
  if (welcome) welcome.remove();
}

function addUserMessage(content) {
  clearWelcomeScreen();
  
  const group = document.createElement('div');
  group.className = 'message-group user-message';
  
  group.innerHTML = `
    <div class="message-avatar user">👤</div>
    <div class="message-content">${escapeHtml(content)}</div>
  `;
  
  chatEl.appendChild(group);
  scrollToBottom();
  return group;
}

function addAssistantMessage(content, actions = [], animate = false) {
  clearWelcomeScreen();
  
  const group = document.createElement('div');
  group.className = 'message-group assistant-message';
  
  group.innerHTML = `
    <div class="message-avatar assistant">⚖️</div>
    <div class="message-content">
      <div class="message-text"></div>
    </div>
  `;
  
  chatEl.appendChild(group);
  
  const textEl = group.querySelector('.message-text');
  
  // Store content for copy function
  group.dataset.messageContent = content;
  
  if (animate) {
    // Smooth typing animation
    animateText(textEl, content, () => {
      // Add actions after animation
      addMessageActions(group, content, actions);
    });
  } else {
    // Instant display
    const formattedContent = formatMessage(content);
    textEl.innerHTML = formattedContent;
    
    // Add actions
    addMessageActions(group, content, actions);
    
    scrollToBottom();
  }
  
  return group;
}

function addMessageActions(group, content, customActions = []) {
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions';
  
  // Always add copy button first
  const copyBtn = document.createElement('button');
  copyBtn.className = 'action-btn copy-btn';
  copyBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    Copy
  `;
  copyBtn.onclick = () => copyToClipboard(content, copyBtn);
  actionsDiv.appendChild(copyBtn);
  
  // Add custom actions
  customActions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.setAttribute('data-action', action.id);
    btn.textContent = action.label;
    btn.onclick = action.onClick;
    actionsDiv.appendChild(btn);
  });
  
  group.querySelector('.message-content').appendChild(actionsDiv);
}

function copyToClipboard(text, button) {
  // Remove markdown formatting for plain text copy
  const plainText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
    .replace(/\n/g, '\n');  // Keep line breaks
  
  navigator.clipboard.writeText(plainText).then(() => {
    // Show feedback
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Copied!
    `;
    button.style.background = '#19c37d';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    button.textContent = '❌ Failed';
    setTimeout(() => {
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy
      `;
    }, 2000);
  });
}

function animateText(element, text, callback) {
  const formattedText = formatMessage(text);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = formattedText;
  const plainText = tempDiv.textContent || tempDiv.innerText;
  
  let index = 0;
  const speed = 15; // milliseconds per character
  
  function typeChar() {
    if (index < plainText.length) {
      const currentText = plainText.substring(0, index + 1);
      element.innerHTML = formatMessage(currentText);
      index++;
      
      // Smooth auto-scroll
      scrollToBottom();
      
      setTimeout(typeChar, speed);
    } else {
      // Animation complete - show full formatted text
      element.innerHTML = formattedText;
      scrollToBottom();
      if (callback) callback();
    }
  }
  
  typeChar();
}

function addTypingIndicator() {
  clearWelcomeScreen();
  
  const group = document.createElement('div');
  group.className = 'message-group assistant-message typing-group';
  
  group.innerHTML = `
    <div class="message-avatar assistant">⚖️</div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  
  chatEl.appendChild(group);
  scrollToBottom();
  return group;
}

function addProgressIndicator(text = 'Processing...') {
  clearWelcomeScreen();
  
  const group = document.createElement('div');
  group.className = 'message-group assistant-message progress-group';
  
  group.innerHTML = `
    <div class="message-avatar assistant">⚖️</div>
    <div class="message-content">
      <div class="progress-container">
        <div class="progress-label">${text}</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  `;
  
  chatEl.appendChild(group);
  scrollToBottom();
  return group;
}

function updateMessage(group, content, actions = []) {
  const contentEl = group.querySelector('.message-content');
  const formattedContent = formatMessage(content);
  
  let actionsHtml = '';
  if (actions.length > 0) {
    actionsHtml = '<div class="message-actions">';
    actions.forEach(action => {
      actionsHtml += `<button class="action-btn" data-action="${action.id}">${action.label}</button>`;
    });
    actionsHtml += '</div>';
  }
  
  contentEl.innerHTML = formattedContent + actionsHtml;
  
  // Attach event listeners
  if (actions.length > 0) {
    actions.forEach(action => {
      const btn = contentEl.querySelector(`[data-action="${action.id}"]`);
      if (btn) btn.onclick = action.onClick;
    });
  }
  
  scrollToBottom();
}

function updateProgress(group, text) {
  const label = group.querySelector('.progress-label');
  if (label) label.textContent = text;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessage(text) {
  let html = escapeHtml(text);
  
  // Bold text **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  
  // Bullet points
  html = html.replace(/^- (.*?)$/gm, '• $1');
  html = html.replace(/^• /gm, '&nbsp;&nbsp;• ');
  
  return html;
}

function scrollToBottom() {
  // Smooth scroll to bottom
  chatEl.scrollTo({
    top: chatEl.scrollHeight,
    behavior: 'smooth'
  });
}

async function callApi(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    let errorMsg;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson.detail || errorText;
    } catch {
      errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }
  
  return r.json();
}

async function handleSend() {
  if (isProcessing) return;
  
  const text = inputEl.value.trim();
  if (!text) return;
  
  inputEl.value = "";
  inputEl.style.height = 'auto';
  isProcessing = true;
  sendBtn.disabled = true;
  uploadBtn.disabled = true;

  messages.push({ role: "user", content: text });
  addUserMessage(text);

  const language = languageSelect.value;
  const typing = addTypingIndicator();
  
  try {
    const res = await callApi("/api/chat", { messages, language });
    const reply = res.reply || "(no reply)";
    messages.push({ role: "assistant", content: reply });
    
    typing.remove();
    
    // Check if it's a legal response (not a rejection message)
    const isLegalResponse = !reply.includes("⚠️ **Not a Legal Question**");
    
    // Add action buttons for legal responses
    const actions = isLegalResponse ? [
      { id: 'listen', label: '🔊 Listen', onClick: () => speak(reply, language) },
      { id: 'stop', label: '⏹ Stop', onClick: () => stopSpeak() },
      { id: 'download', label: '⬇️ Download PDF', onClick: () => exportPdf(reply, 'chat_response') }
    ] : [];
    
    // Show response instantly (no animation)
    addAssistantMessage(reply, actions, false);
  } catch (e) {
    typing.remove();
    addAssistantMessage(`❌ Error: ${e.message}\n\nPlease try again or rephrase your question.`, [], false);
  } finally {
    isProcessing = false;
    sendBtn.disabled = !inputEl.value.trim();
    uploadBtn.disabled = false;
  }
}

sendBtn.addEventListener("click", handleSend);

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// New Chat
newChatBtn.addEventListener("click", () => {
  if (messages.length === 0) return;
  
  if (confirm("Start a new chat? This will clear the current conversation.")) {
    messages = [];
    chatEl.innerHTML = '';
    showWelcomeScreen();
    inputEl.value = '';
    inputEl.style.height = 'auto';
    stopSpeak();
  }
});

// File Upload
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (e) => {
  if (isProcessing) return;
  
  const f = e.target.files?.[0];
  if (!f) return;

  isProcessing = true;
  sendBtn.disabled = true;
  uploadBtn.disabled = true;

  addUserMessage(`📄 Uploaded: ${f.name}`);
  const progress = addProgressIndicator('📤 Uploading and extracting text...');

  const fd = new FormData();
  fd.append("file", f);
  
  try {
    // Upload and extract
    updateProgress(progress, '📤 Uploading file...');
    const r = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
    
    if (!r.ok) {
      const errorText = await r.text();
      let errorMsg;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.detail || errorText;
      } catch {
        errorMsg = errorText;
      }
      throw new Error(errorMsg);
    }
    
    const js = await r.json();
    const extracted = js.text || "";
    const detectedLang = js.detected_language || null;
    
    // Auto-set language if detected
    if (detectedLang && detectedLang !== languageSelect.value) {
      updateProgress(progress, `🌐 Detected language: ${detectedLang}`);
      languageSelect.value = detectedLang;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verify legal document
    updateProgress(progress, '🔍 Verifying document...');
    const verify = await callApi('/api/verify', { text: extracted });
    
    if ((verify.label || '').toUpperCase() !== 'LEGAL') {
      progress.remove();
      addAssistantMessage('❌ **Not a Legal Document**\n\nThe uploaded document does not appear to be related to legal matters. NyayAI is designed to help with legal documents and questions only.\n\n**Please upload:**\n• Court orders or judgments\n• FIR or police complaints\n• RTI applications\n• Legal notices or agreements\n• Government documents\n• Other official legal documents');
      return;
    }

    // Summarize
    updateProgress(progress, '📝 Generating comprehensive summary...');
    const language = languageSelect.value;
    const sum = await callApi('/api/summarize', { text: extracted, language });
    const summary = sum.summary || '(no summary)';

    progress.remove();
    addAssistantMessage(`✅ **Legal Document Verified & Summarized**\n\n${summary}`, [
      { id: 'listen', label: '🔊 Listen', onClick: () => speak(summary, language) },
      { id: 'stop', label: '⏹ Stop', onClick: () => stopSpeak() },
      { id: 'draft', label: '📝 Generate Draft', onClick: () => askDraft(summary, language) },
      { id: 'download', label: '⬇️ Download PDF', onClick: () => exportPdf(summary, 'summary') }
    ]);
    
  } catch (e) {
    progress.remove();
    addAssistantMessage(`❌ **Error Processing File**\n\n${e.message}\n\n**Troubleshooting:**\n• Ensure the file is not corrupted\n• For images, make sure text is clear and readable\n• Check file size (max 15 MB)\n• If rate limited, wait a moment and try again`);
  } finally {
    fileInput.value = '';
    isProcessing = false;
    sendBtn.disabled = !inputEl.value.trim();
    uploadBtn.disabled = false;
  }
});

function speak(text, language) {
  const synth = window.speechSynthesis;
  
  // Cancel any ongoing speech
  synth.cancel();
  
  // Clean text for better speech (remove markdown, emojis, special chars)
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')  // Remove italic
    .replace(/⚖️|⚠️|❌|✅|📄|📝|🔊|⏹|⬇️|📋|•|🎯|⚡|🎙️|✨/g, '')  // Remove emojis
    .replace(/#{1,6}\s/g, '')  // Remove markdown headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links
    .replace(/`([^`]+)`/g, '$1')  // Remove code blocks
    .replace(/\n{3,}/g, '. ')  // Multiple newlines to period
    .replace(/\n{2}/g, '. ')  // Double newlines to period
    .replace(/\n/g, ' ')  // Single newlines to space
    .replace(/\s{2,}/g, ' ')  // Multiple spaces to single
    .replace(/Disclaimer:.*$/i, '')  // Remove disclaimer
    .trim();
  
  if (!cleanText) {
    console.log('No text to speak');
    return;
  }
  
  // Get available voices
  const voices = synth.getVoices();
  const langCode = langToBCP47(language);
  const langPrefix = langCode.split('-')[0];
  
  console.log('Available voices:', voices.length);
  console.log('Looking for language:', langCode, langPrefix);
  
  // Advanced voice selection with multiple fallbacks
  let selectedVoice = null;
  
  // Priority 1: Google voices (best quality)
  selectedVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith(langPrefix) && 
    v.name.toLowerCase().includes('google')
  );
  
  // Priority 2: Premium/Enhanced voices
  if (!selectedVoice) {
    selectedVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(langPrefix) && 
      (v.name.toLowerCase().includes('premium') || 
       v.name.toLowerCase().includes('enhanced') ||
       v.name.toLowerCase().includes('natural'))
    );
  }
  
  // Priority 3: Female voices (usually clearer)
  if (!selectedVoice) {
    selectedVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(langPrefix) && 
      (v.name.toLowerCase().includes('female') ||
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('karen') ||
       v.name.toLowerCase().includes('victoria'))
    );
  }
  
  // Priority 4: Any voice for the language
  if (!selectedVoice) {
    selectedVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(langPrefix)
    );
  }
  
  // Priority 5: Default voice
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices.find(v => v.default) || voices[0];
  }
  
  console.log('Selected voice:', selectedVoice ? selectedVoice.name : 'default');
  
  // Split text into chunks for better quality (avoid long utterances)
  const chunks = splitTextIntoChunks(cleanText, 200);
  
  // Speak each chunk
  chunks.forEach((chunk, index) => {
    const utter = new SpeechSynthesisUtterance(chunk);
    
    // Set language
    utter.lang = langCode;
    
    // Set voice
    if (selectedVoice) {
      utter.voice = selectedVoice;
    }
    
    // ENHANCED SETTINGS for natural human-like speech
    utter.rate = 1.2;      // Even faster - more natural (ChatGPT speed)
    utter.pitch = 1.05;    // Slightly higher pitch - more engaging
    utter.volume = 1.0;    // Full volume
    
    // Event listeners
    if (index === 0) {
      utter.onstart = () => {
        console.log('Speech started with voice:', selectedVoice ? selectedVoice.name : 'default');
      };
    }
    
    if (index === chunks.length - 1) {
      utter.onend = () => {
        console.log('Speech completed');
      };
    }
    
    utter.onerror = (event) => {
      console.error('Speech error:', event);
    };
    
    // Queue the utterance
    synth.speak(utter);
  });
}

function splitTextIntoChunks(text, maxLength) {
  // Split by sentences first
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  });
  
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks.length > 0 ? chunks : [text];
}

function stopSpeak() {
  window.speechSynthesis.cancel();
}

function langToBCP47(lang) {
  const map = {
    English: 'en-US',      // US English for better voice quality
    Hindi: 'hi-IN',
    Marathi: 'mr-IN',
    Tamil: 'ta-IN',
    Telugu: 'te-IN',
    Bengali: 'bn-IN',
    Gujarati: 'gu-IN',
    Kannada: 'kn-IN',
    Malayalam: 'ml-IN',
    Punjabi: 'pa-IN',
  };
  return map[lang] || 'en-US';
}

async function askDraft(context, language) {
  const msg = addAssistantMessage('📝 **Generate Legal Draft?**\n\nWould you like me to generate a professional legal draft based on this document?\n\nThe draft will be formatted and ready for submission (RTI, FIR, complaint, notice, etc.)', [
    { 
      id: 'yes', 
      label: '✅ Yes, Generate Draft',
      onClick: async () => {
        const progress = addProgressIndicator('📝 Generating professional legal draft...');
        try {
          const res = await callApi('/api/draft', { text: context, language });
          const draft = res.draft || '(no draft)';
          
          progress.remove();
          addAssistantMessage(`📄 **Legal Draft Generated**\n\n${draft}`, [
            { id: 'listen2', label: '🔊 Listen', onClick: () => speak(draft, language) },
            { id: 'stop2', label: '⏹ Stop', onClick: () => stopSpeak() },
            { id: 'download2', label: '⬇️ Download PDF', onClick: () => exportPdf(draft, 'legal_draft') }
          ]);
        } catch (e) {
          progress.remove();
          addAssistantMessage(`❌ Error generating draft: ${e.message}`);
        }
      }
    },
    {
      id: 'no',
      label: '❌ No, Thanks',
      onClick: () => {
        addAssistantMessage('✅ **Summary Complete**\n\nThank you for using NyayAI! If you need any more help:\n• Upload another document\n• Ask a legal question\n• Start a new chat\n\n⚖️ Remember: This is AI guidance, not legal advice. Consult a lawyer for your specific situation.');
      }
    }
  ]);
}

async function exportPdf(content, name) {
  try {
    const r = await fetch(`${API_BASE}/api/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, filename: `nyayai_${name}` })
    });
    
    if (!r.ok) throw new Error(await r.text());
    
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyayai_${name}_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    
    addAssistantMessage(`✅ PDF downloaded successfully: ${a.download}`);
  } catch (e) {
    addAssistantMessage(`❌ Export error: ${e.message}`);
  }
}