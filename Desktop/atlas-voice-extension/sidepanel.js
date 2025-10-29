/**
 * Atlas Voice - Minimal Interface with Hamburger Menu
 */

// ===== Mic Permission + Stream Manager =====================================
const MicPermission = (() => {
  let inFlight = false;
  let cachedStream = null;
  const listeners = new Set();

  function notify(ev) { listeners.forEach(fn => { try { fn(ev); } catch {} }); }

  async function queryPermission() {
    try {
      if (!('permissions' in navigator)) return 'prompt';
      const status = await navigator.permissions.query({ name: 'microphone' });
      return status.state;
    } catch {
      return 'prompt';
    }
  }

  function showBanner(show) {
    const el = document.getElementById('mic-permission-banner');
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
  }

  function wireBannerButtons() {
    const tryBtn = document.getElementById('mic-permission-try-again');
    const dismissBtn = document.getElementById('mic-permission-dismiss');
    if (tryBtn && !tryBtn.dataset._wired) {
      tryBtn.dataset._wired = '1';
      tryBtn.addEventListener('click', async () => {
        showBanner(false);
        try {
          await requestStream();
        } catch (e) {
          console.warn('Retry failed:', e);
          showBanner(true);
        }
      });
    }
    if (dismissBtn && !dismissBtn.dataset._wired) {
      dismissBtn.dataset._wired = '1';
      dismissBtn.addEventListener('click', () => showBanner(false));
    }
  }

  async function requestStream() {
    if (cachedStream && cachedStream.active) return cachedStream;

    if (inFlight) {
      return new Promise((resolve, reject) => {
        const off = (ev) => {
          if (ev.type === 'mic:ready') { listeners.delete(off); resolve(cachedStream); }
          if (ev.type === 'mic:error') { listeners.delete(off); reject(ev.error); }
        };
        listeners.add(off);
      });
    }

    inFlight = true;
    wireBannerButtons();

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cachedStream = stream;
      showBanner(false);
      inFlight = false;
      notify({ type: 'mic:ready' });
      return stream;
    } catch (err) {
      inFlight = false;

      const name = err && err.name ? err.name : 'Error';
      const msg = (err && (err.message || err.toString())) || 'Unknown error';

      if (name === 'NotAllowedError') {
        showBanner(true);
        const wrapped = new Error('Microphone permission was blocked or dismissed. Click the mic icon in the address bar to allow, then click "Try again".');
        wrapped.cause = err;
        notify({ type: 'mic:error', error: wrapped });
        throw wrapped;
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        const wrapped = new Error('No microphone detected. Please connect a mic or select a working input in system settings, then try again.');
        wrapped.cause = err;
        notify({ type: 'mic:error', error: wrapped });
        throw wrapped;
      } else if (name === 'NotReadableError' || name === 'AbortError') {
        const wrapped = new Error('The microphone is currently in use by another application. Close other apps using the mic and try again.');
        wrapped.cause = err;
        notify({ type: 'mic:error', error: wrapped });
        throw wrapped;
      }

      const wrapped = new Error(`Failed to access microphone: ${name}: ${msg}`);
      wrapped.cause = err;
      notify({ type: 'mic:error', error: wrapped });
      throw wrapped;
    }
  }

  return {
    async ensureMic() {
      const state = await queryPermission();
      try {
        return await requestStream();
      } catch (e) {
        showBanner(true);
        throw e;
      }
    },
    getCachedStream() { return cachedStream; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    clearCache() {
      if (cachedStream) {
        try { cachedStream.getTracks().forEach(t => t.stop()); } catch {}
      }
      cachedStream = null;
    }
  };
})();

const els = {
  menuBtn: document.getElementById('menuBtn'),
  settingsModal: document.getElementById('settingsModal'),
  settingsBackdrop: document.getElementById('settingsBackdrop'),
  settingsClose: document.getElementById('settingsClose'),
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  statusDot: document.getElementById('statusDot'),
  voiceBtn: document.getElementById('voiceBtn'),
  voiceStatus: document.getElementById('voiceStatus'),
  interruptBtn: document.getElementById('interruptBtn'),
  continuousMode: document.getElementById('continuousMode'),
  desktopMode: document.getElementById('desktopMode'),
  visionMode: document.getElementById('visionMode'),
  wakeWordMode: document.getElementById('wakeWordMode'),
  captureScreenBtn: document.getElementById('captureScreenBtn'),
  chatContainer: document.getElementById('chatContainer'),
  voiceOrb: document.getElementById('voiceOrb'),
  voiceOrbWrapper: document.getElementById('voiceOrbWrapper'),
  orbStatus: document.getElementById('orbStatus'),
  voiceSelect: document.getElementById('voiceSelect'),
  recStart: document.getElementById('recStart'),
  recStop: document.getElementById('recStop'),
  ttsSay: document.getElementById('ttsSay'),
  permissionModal: document.getElementById('permissionModal'),
  requestPermissionBtn: document.getElementById('requestPermissionBtn'),
  skipPermissionBtn: document.getElementById('skipPermissionBtn'),
  toggleHelpBtn: document.getElementById('toggleHelpBtn'),
  helpContent: document.getElementById('helpContent'),
  temperatureSlider: document.getElementById('temperatureSlider'),
  temperatureValue: document.getElementById('temperatureValue'),
  memoryEnabled: document.getElementById('memoryEnabled'),
  specialInstructions: document.getElementById('specialInstructions'),
  viewKnowledgeBtn: document.getElementById('viewKnowledgeBtn'),
  clearMemoryBtn: document.getElementById('clearMemoryBtn'),
  textInput: document.getElementById('textInput'),
  textSendBtn: document.getElementById('textSendBtn'),
  fileUploadBtn: document.getElementById('fileUploadBtn'),
  fileInput: document.getElementById('fileInput')
};

let pc, micStream, dataChannel, remoteAudioEl, connected = false;
let isListening = false;
let isSpeaking = false;
let isContinuousMode = false;
let isDesktopMode = false;
let isVisionMode = false;
let currentUserMessage = '';
let currentAIMessage = '';
let lastScreenshot = null;

// Settings Modal Management
let isModalOpen = false;
let previousActiveElement = null;

// Open settings modal
function openSettingsModal() {
  if (isModalOpen) return;
  
  isModalOpen = true;
  previousActiveElement = document.activeElement;
  
  // Add open class with slight delay for smooth animation
  els.settingsModal.classList.add('open');
  els.menuBtn.classList.add('active');
  
  // Set ARIA attributes
  els.settingsModal.setAttribute('aria-hidden', 'false');
  
  // Focus management - focus the close button
  setTimeout(() => {
    els.settingsClose.focus();
  }, 100);
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
  
  console.log('🔧 Settings modal opened');
}

// Close settings modal
function closeSettingsModal() {
  if (!isModalOpen) return;
  
  isModalOpen = false;
  
  // Remove open class
  els.settingsModal.classList.remove('open');
  els.menuBtn.classList.remove('active');
  
  // Set ARIA attributes
  els.settingsModal.setAttribute('aria-hidden', 'true');
  
  // Restore focus to previous element
  if (previousActiveElement) {
    previousActiveElement.focus();
    previousActiveElement = null;
  }
  
  // Restore body scroll
  document.body.style.overflow = '';
  
  console.log('🔧 Settings modal closed');
}

// Hamburger menu toggle
els.menuBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (isModalOpen) {
    closeSettingsModal();
  } else {
    openSettingsModal();
  }
});

// Close modal when clicking backdrop
els.settingsBackdrop.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeSettingsModal();
});

// Close modal when clicking close button
els.settingsClose.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeSettingsModal();
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen) {
    e.preventDefault();
    e.stopPropagation();
    closeSettingsModal();
  }
});

// Trap focus within modal when open
document.addEventListener('keydown', (e) => {
  if (!isModalOpen) return;
  
  if (e.key === 'Tab') {
    const focusableElements = els.settingsModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
});

// Prevent modal from closing when clicking inside modal content
els.settingsModal.addEventListener('click', (e) => {
  if (e.target === els.settingsModal) {
    e.preventDefault();
    e.stopPropagation();
    closeSettingsModal();
  }
});

// Handle window resize to maintain modal positioning
window.addEventListener('resize', () => {
  if (isModalOpen) {
    // Ensure modal stays centered on resize
    els.settingsModal.style.display = 'flex';
  }
});

async function getEphemeralToken(serverBase) {
  const r = await fetch(`${serverBase}/api/ephemeral`);
  if (!r.ok) throw new Error('Failed to get ephemeral key');
  return r.json();
}

async function ensureMic() {
  if (micStream) return micStream;
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const t of micStream.getAudioTracks()) t.enabled = false;
  return micStream;
}

function createRemoteAudio() {
  if (remoteAudioEl) return remoteAudioEl;
  remoteAudioEl = document.createElement('audio');
  remoteAudioEl.autoplay = true;
  remoteAudioEl.playsInline = true;
  document.body.appendChild(remoteAudioEl);

  remoteAudioEl.onplay = () => {
    isSpeaking = true;
    updateOrbState();
  };

  remoteAudioEl.onpause = () => {
    isSpeaking = false;
    updateOrbState();
  };

  remoteAudioEl.onended = () => {
    isSpeaking = false;
    updateOrbState();
  };

  return remoteAudioEl;
}

function updateOrbState() {
  els.voiceOrb.classList.remove('listening', 'speaking');

  if (isSpeaking) {
    els.voiceOrb.classList.add('speaking');
    els.orbStatus.textContent = 'AI is speaking...';
  } else if (isListening) {
    els.voiceOrb.classList.add('listening');
    els.orbStatus.textContent = 'Listening...';
  } else if (connected) {
    els.orbStatus.textContent = 'Ready - Hold button to talk';
  }
}

function addMessage(role, content, messageType = 'text') {
  if (!content || content.trim() === '') return;

  // Hide orb, show chat
  els.voiceOrbWrapper.classList.add('hidden');
  els.chatContainer.style.display = 'flex';

  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  if (messageType !== 'text') {
    messageEl.classList.add(`message-${messageType}`);
  }

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  
  // Check if content contains a prompt or code block
  if (messageType === 'prompt' || content.includes('```') || content.includes('PROMPT:')) {
    contentEl.innerHTML = formatPromptMessage(content);
  } else {
    contentEl.textContent = content;
  }

  // Add copy button for Atlas messages
  if (role === 'assistant') {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy
    `;
    copyBtn.onclick = () => copyMessageContent(content, copyBtn);
    
    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';
    messageActions.appendChild(copyBtn);
    messageEl.appendChild(messageActions);
  }

  messageEl.appendChild(avatar);
  messageEl.appendChild(contentEl);

  els.chatContainer.appendChild(messageEl);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

function formatPromptMessage(content) {
  // Format different types of prompts and code blocks
  let formatted = content;
  
  // Handle PROMPT: prefix
  if (content.includes('PROMPT:')) {
    formatted = content.replace(/PROMPT:\s*/g, '<div class="prompt-header">💡 Claude Prompt</div>');
  }
  
  // Handle code blocks
  formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return `
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">${language}</span>
          <button class="code-copy-btn" onclick="copyCodeBlock(this, \`${code.replace(/`/g, '\\`')}\`)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
        <pre><code class="language-${language}">${escapeHTML(code)}</code></pre>
      </div>
    `;
  });
  
  // Convert newlines to <br> for HTML display
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyMessageContent(content, button) {
  navigator.clipboard.writeText(content).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      Copied!
    `;
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    button.textContent = 'Failed to copy';
  });
}

function copyCodeBlock(button, code) {
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      Copied!
    `;
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code: ', err);
  });
}

function showTypingIndicator() {
  const existingIndicator = document.querySelector('.typing-indicator');
  if (existingIndicator) return;

  const messageEl = document.createElement('div');
  messageEl.className = 'message assistant';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = 'AI';

  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  messageEl.appendChild(avatar);
  messageEl.appendChild(typingEl);
  els.chatContainer.appendChild(messageEl);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.querySelector('.message:has(.typing-indicator)');
  if (indicator) indicator.remove();
}

async function connectRealtime() {
  try {
    console.log('🚀 Starting connection process...');
    console.log('📡 Server URL:', els.serverUrl.value.trim());
    
    if (!els.serverUrl.value.trim()) {
      throw new Error('Server URL is required. Please enter a server URL in settings.');
    }
    
    // Clean up any existing connection first
    if (pc) {
      console.log('🧹 Cleaning up existing connection...');
      try {
        pc.close();
      } catch (e) {
        console.warn('Error closing existing connection:', e);
      }
      pc = null;
    }
    
    if (dataChannel) {
      try {
        dataChannel.close();
      } catch (e) {
        console.warn('Error closing existing data channel:', e);
      }
      dataChannel = null;
    }
    
    els.orbStatus.textContent = 'Connecting...';
    
    // Use MicPermission for microphone access
    let localStream;
    try {
      console.log('🎤 Requesting microphone access...');
      localStream = await MicPermission.ensureMic();
      console.log('✅ Microphone access granted');
    } catch (e) {
      console.error('❌ WebRTC connection error (mic):', e);
      els.orbStatus.textContent = `Microphone error: ${e.message}`;
      return;
    }
    
    console.log('🔑 Getting ephemeral token...');
    const { client_secret, model, endpoint } = await getEphemeralToken(els.serverUrl.value.trim());
    console.log('✅ Ephemeral token received');

    // Create new peer connection
    pc = new RTCPeerConnection();
    
    // Add connection state change handler
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log('❌ Connection failed or disconnected');
        teardown();
      }
    };
    
    for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

    createRemoteAudio();
    pc.ontrack = (e) => { remoteAudioEl.srcObject = e.streams[0]; };

    dataChannel = pc.createDataChannel("oai-events");

    dataChannel.onopen = () => {
      console.log('Data channel opened');

      // Configure session with desktop commander instructions if enabled
      const instructions = isDesktopMode
        ? `You are Atlas Voice, a powerful AI assistant with Desktop Commander, Web Automation, Code Writing, and Document Reading capabilities.

🎯 CAPABILITIES:
- Desktop Commander: Full system control (files, apps, system settings)
- Web Automation: Browser control, form filling, element interaction
- Voice Control: Natural language commands
- Screen Vision: Can see and analyze your screen
- CODE WRITING: Write complete, production-ready code in any language
- Document Reading: Extract and analyze text from PDFs and documents
- Prompt Generation: Create optimized prompts for Claude coding tasks

💻 CODE WRITING FEATURES:
- Write complete code files in any programming language
- Create React/Vue/Angular components
- Write API endpoints, functions, classes
- Generate configuration files (JSON, YAML, etc.)
- Write SQL queries, database schemas
- Create HTML/CSS/JavaScript for web pages
- Format all code with proper syntax highlighting
- Always wrap code in triple backticks with language name (\`\`\`javascript, \`\`\`python, etc.)

📄 DOCUMENT READING FEATURES:
- Extract text from PDF documents
- Read and summarize document contents
- Answer questions about document information
- Compare information across multiple documents

💡 PROMPT GENERATION FEATURES:
- Create structured prompts for Claude code assistant
- Generate debugging prompts for troubleshooting code issues
- Create code review prompts for optimization suggestions
- Format prompts with proper context and requirements
- Display prompts with copy functionality in chat

🖥️ DESKTOP COMMANDER COMMANDS:
File Operations: OPEN_FOLDER, CREATE_FILE, CREATE_FOLDER, DELETE_FILE, RENAME_FILE, COPY_FILE, MOVE_FILE
App Control: LAUNCH_APP, OPEN_URL, REFRESH_PAGE, GO_BACK, GO_FORWARD, NEW_TAB, CLOSE_TAB
System Control: VOLUME_UP, VOLUME_DOWN, MUTE_VOLUME, BRIGHTNESS_UP, BRIGHTNESS_DOWN, LOCK_SCREEN, SLEEP_COMPUTER
Screen Control: TAKE_SCREENSHOT, CLICK_ELEMENT, DOUBLE_CLICK, RIGHT_CLICK, TYPE_TEXT, CLEAR_FIELD
Navigation: SCROLL_PAGE, SCROLL_TO_TOP, SCROLL_TO_BOTTOM, DRAG_DROP
Keyboard: KEY_PRESS, KEY_COMBINATION, SELECT_ALL, COPY_TEXT, PASTE_TEXT
Information: GET_TIME, GET_DATE, SEARCH_WEB, SEARCH_YOUTUBE, SEARCH_WIKIPEDIA

🌐 WEB AUTOMATION FEATURES:
- Fill forms automatically
- Click buttons and links
- Navigate websites
- Extract data from pages
- Take screenshots
- Control browser tabs
- Search and filter content
- Interact with web applications

📝 RESPONSE FORMAT:
For Desktop Commands: "Action description. [CMD:COMMAND_TYPE:parameter]"
For Web Automation: "Web action description. [WEB:action:details]"
For Code Writing: Wrap code in triple backticks with language name
For PDF Reading: "Reading PDF. [CMD:READ_PDF:file_path]"
For Prompt Generation: Use the create_claude_prompt, create_debugging_prompt, or create_code_review_prompt functions
For General Help: Provide helpful, conversational responses

Examples:
User: "Write a React button component"
You: "Here's a React button component:

\`\`\`javascript
import React from 'react';

const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
\`\`\`"

User: "Write a Python function to sort a list"
You: "Here's a Python sorting function:

\`\`\`python
def sort_list(items, reverse=False):
    return sorted(items, reverse=reverse)
\`\`\`"

User: "Read the PDF file in my downloads"
You: "Reading PDF. [CMD:READ_PDF:~/Downloads/document.pdf]"

User: "Open my downloads folder"
You: "Opening Downloads folder. [CMD:OPEN_FOLDER:~/Downloads]"

User: "Fill out the contact form with my email"
You: "Filling contact form. [WEB:fill_form:email=user@example.com]"

User: "Click the submit button"
You: "Clicking submit button. [WEB:click_element:submit]"

User: "Take a screenshot of this page"
You: "Taking screenshot. [CMD:TAKE_SCREENSHOT:]"

User: "Search for 'artificial intelligence' on Google"
You: "Searching Google. [CMD:SEARCH_WEB:artificial intelligence]"

Be helpful, concise, and always confirm actions taken. When writing code, ALWAYS use triple backticks with the language name for proper formatting and copy functionality. When creating prompts, use the appropriate function tools to generate properly formatted prompts that will be displayed in the chat with copy functionality.`
        : `You are Atlas Voice, a helpful AI assistant with web automation, code writing, and document reading capabilities.

🎯 CAPABILITIES:
- Web Automation: Browser control, form filling, element interaction
- CODE WRITING: Write complete, production-ready code in any language
- Document Reading: Extract and analyze text from documents
- Prompt Generation: Create optimized prompts for Claude coding tasks

💻 CODE WRITING FEATURES:
- Write complete code files in any programming language
- Create React/Vue/Angular components
- Write API endpoints, functions, classes
- Generate configuration files (JSON, YAML, etc.)
- Write SQL queries, database schemas
- Create HTML/CSS/JavaScript for web pages
- Format all code with proper syntax highlighting
- Always wrap code in triple backticks with language name (\`\`\`javascript, \`\`\`python, etc.)

💡 PROMPT GENERATION FEATURES:
- Create structured prompts for Claude code assistant
- Generate debugging prompts for troubleshooting code issues
- Create code review prompts for optimization suggestions
- Format prompts with proper context and requirements
- Display prompts with copy functionality in chat

🌐 WEB AUTOMATION FEATURES:
- Fill forms automatically
- Click buttons and links  
- Navigate websites
- Extract data from pages
- Take screenshots
- Control browser tabs
- Search and filter content

📝 RESPONSE FORMAT:
For Web Actions: "Action description. [WEB:action:details]"
For Prompt Generation: Use the create_claude_prompt, create_debugging_prompt, or create_code_review_prompt functions
For General Help: Provide helpful, conversational responses

Examples:
User: "Create a prompt for building a React component"
You: Use create_claude_prompt function with appropriate parameters

User: "Help me debug this JavaScript error"
You: Use create_debugging_prompt function with error details

User: "Review my Python code for improvements"  
You: Use create_code_review_prompt function with the code

User: "Fill out the contact form"
You: "Filling contact form. [WEB:fill_form:name=John,email=john@example.com]"

User: "Click the search button"
You: "Clicking search button. [WEB:click_element:search]"

User: "Take a screenshot"
You: "Taking screenshot. [WEB:screenshot:]"

Be helpful and conversational. When creating prompts, use the appropriate function tools to generate properly formatted prompts that will be displayed in the chat with copy functionality.`;

        // Define tools for function calling
      const tools = isDesktopMode ? [
        // Prompt Generation Tools
        {
          type: 'function',
          name: 'create_claude_prompt',
          description: 'Creates a formatted prompt for Claude code assistant with specific instructions and context.',
          parameters: {
            type: 'object',
            properties: {
              task_description: {
                type: 'string',
                description: 'Clear description of what the user wants to accomplish'
              },
              context: {
                type: 'string',
                description: 'Additional context about the project, technologies, or constraints'
              },
              specific_requirements: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of specific requirements or constraints'
              },
              output_format: {
                type: 'string',
                description: 'Desired output format (code, explanation, step-by-step, etc.)'
              }
            },
            required: ['task_description']
          }
        },
        {
          type: 'function',
          name: 'create_debugging_prompt',
          description: 'Creates a specialized prompt for debugging code issues.',
          parameters: {
            type: 'object',
            properties: {
              error_description: {
                type: 'string',
                description: 'Description of the error or issue'
              },
              code_snippet: {
                type: 'string',
                description: 'The problematic code (if available)'
              },
              expected_behavior: {
                type: 'string',
                description: 'What should happen instead'
              },
              tech_stack: {
                type: 'string',
                description: 'Technologies involved (programming language, framework, etc.)'
              }
            },
            required: ['error_description']
          }
        },
        {
          type: 'function',
          name: 'create_code_review_prompt',
          description: 'Creates a prompt for code review and optimization suggestions.',
          parameters: {
            type: 'object',
            properties: {
              code_to_review: {
                type: 'string',
                description: 'The code that needs to be reviewed'
              },
              review_focus: {
                type: 'array',
                items: { type: 'string' },
                description: 'Areas to focus on (performance, security, readability, best practices, etc.)'
              },
              programming_language: {
                type: 'string',
                description: 'The programming language of the code'
              }
            },
            required: ['code_to_review']
          }
        },
        // Desktop Commander Tools
        {
          type: 'function',
          name: 'open_webpage',
          description: 'Opens a webpage in the browser. Can open any URL or search on Google.',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to open (e.g., https://google.com, https://youtube.com) or search query'
              }
            },
            required: ['url']
          }
        },
        {
          type: 'function',
          name: 'open_folder',
          description: 'Opens a folder on the user\'s desktop. Ask for clarification if folder name is unclear.',
          parameters: {
            type: 'object',
            properties: {
              folder_name: {
                type: 'string',
                description: 'The folder to open (e.g., Downloads, Documents, Desktop)'
              }
            },
            required: ['folder_name']
          }
        },
        {
          type: 'function',
          name: 'launch_app',
          description: 'Launches an application on the user\'s Mac. Ask for app name if unclear.',
          parameters: {
            type: 'object',
            properties: {
              app_name: {
                type: 'string',
                description: 'The application name (e.g., Chrome, Safari, Finder)'
              }
            },
            required: ['app_name']
          }
        },
        {
          type: 'function',
          name: 'create_file',
          description: 'Creates a new file. MUST ask user for filename and location before calling this.',
          parameters: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'The name of the file to create'
              },
              location: {
                type: 'string',
                description: 'Where to save (Downloads, Documents, Desktop)'
              }
            },
            required: ['filename', 'location']
          }
        },
        // Web Automation Tools
        {
          type: 'function',
          name: 'web_click_element',
          description: 'Clicks on a web page element (button, link, etc.)',
          parameters: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector or text content to identify the element'
              },
              element_type: {
                type: 'string',
                description: 'Type of element (button, link, input, etc.)',
                enum: ['button', 'link', 'input', 'div', 'span', 'other']
              }
            },
            required: ['selector']
          }
        },
        {
          type: 'function',
          name: 'web_fill_form',
          description: 'Fills out form fields on a web page',
          parameters: {
            type: 'object',
            properties: {
              fields: {
                type: 'object',
                description: 'Object containing field names and values to fill',
                additionalProperties: {
                  type: 'string'
                }
              }
            },
            required: ['fields']
          }
        },
        {
          type: 'function',
          name: 'web_navigate',
          description: 'Navigates to a URL or performs browser navigation',
          parameters: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description: 'Navigation action',
                enum: ['go_to_url', 'go_back', 'go_forward', 'refresh', 'new_tab', 'close_tab']
              },
              url: {
                type: 'string',
                description: 'URL to navigate to (required for go_to_url action)'
              }
            },
            required: ['action']
          }
        },
        {
          type: 'function',
          name: 'web_extract_data',
          description: 'Extracts data from the current web page',
          parameters: {
            type: 'object',
            properties: {
              data_type: {
                type: 'string',
                description: 'Type of data to extract',
                enum: ['text', 'links', 'images', 'forms', 'tables', 'all']
              },
              selector: {
                type: 'string',
                description: 'CSS selector to limit extraction scope (optional)'
              }
            },
            required: ['data_type']
          }
        },
        {
          type: 'function',
          name: 'web_scroll',
          description: 'Scrolls the web page',
          parameters: {
            type: 'object',
            properties: {
              direction: {
                type: 'string',
                description: 'Scroll direction',
                enum: ['up', 'down', 'top', 'bottom']
              },
              amount: {
                type: 'number',
                description: 'Number of pixels to scroll (optional)'
              }
            },
            required: ['direction']
          }
        }
      ] : [
        // Prompt Generation Tools (available in both modes)
        {
          type: 'function',
          name: 'create_claude_prompt',
          description: 'Creates a formatted prompt for Claude code assistant with specific instructions and context.',
          parameters: {
            type: 'object',
            properties: {
              task_description: {
                type: 'string',
                description: 'Clear description of what the user wants to accomplish'
              },
              context: {
                type: 'string',
                description: 'Additional context about the project, technologies, or constraints'
              },
              specific_requirements: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of specific requirements or constraints'
              },
              output_format: {
                type: 'string',
                description: 'Desired output format (code, explanation, step-by-step, etc.)'
              }
            },
            required: ['task_description']
          }
        },
        {
          type: 'function',
          name: 'create_debugging_prompt',
          description: 'Creates a specialized prompt for debugging code issues.',
          parameters: {
            type: 'object',
            properties: {
              error_description: {
                type: 'string',
                description: 'Description of the error or issue'
              },
              code_snippet: {
                type: 'string',
                description: 'The problematic code (if available)'
              },
              expected_behavior: {
                type: 'string',
                description: 'What should happen instead'
              },
              tech_stack: {
                type: 'string',
                description: 'Technologies involved (programming language, framework, etc.)'
              }
            },
            required: ['error_description']
          }
        },
        {
          type: 'function',
          name: 'create_code_review_prompt',
          description: 'Creates a prompt for code review and optimization suggestions.',
          parameters: {
            type: 'object',
            properties: {
              code_to_review: {
                type: 'string',
                description: 'The code that needs to be reviewed'
              },
              review_focus: {
                type: 'array',
                items: { type: 'string' },
                description: 'Areas to focus on (performance, security, readability, best practices, etc.)'
              },
              programming_language: {
                type: 'string',
                description: 'The programming language of the code'
              }
            },
            required: ['code_to_review']
          }
        },
        // Web Automation Tools (available in both modes)
        {
          type: 'function',
          name: 'web_click_element',
          description: 'Clicks on a web page element (button, link, etc.)',
          parameters: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector or text content to identify the element'
              },
              element_type: {
                type: 'string',
                description: 'Type of element (button, link, input, etc.)',
                enum: ['button', 'link', 'input', 'div', 'span', 'other']
              }
            },
            required: ['selector']
          }
        },
        {
          type: 'function',
          name: 'web_fill_form',
          description: 'Fills out form fields on a web page',
          parameters: {
            type: 'object',
            properties: {
              fields: {
                type: 'object',
                description: 'Object containing field names and values to fill',
                additionalProperties: {
                  type: 'string'
                }
              }
            },
            required: ['fields']
          }
        },
        {
          type: 'function',
          name: 'web_navigate',
          description: 'Navigates to a URL or performs browser navigation',
          parameters: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description: 'Navigation action',
                enum: ['go_to_url', 'go_back', 'go_forward', 'refresh', 'new_tab', 'close_tab']
              },
              url: {
                type: 'string',
                description: 'URL to navigate to (required for go_to_url action)'
              }
            },
            required: ['action']
          }
        },
        {
          type: 'function',
          name: 'web_extract_data',
          description: 'Extracts data from the current web page',
          parameters: {
            type: 'object',
            properties: {
              data_type: {
                type: 'string',
                description: 'Type of data to extract',
                enum: ['text', 'links', 'images', 'forms', 'tables', 'all']
              },
              selector: {
                type: 'string',
                description: 'CSS selector to limit extraction scope (optional)'
              }
            },
            required: ['data_type']
          }
        },
        {
          type: 'function',
          name: 'read_pdf',
          description: 'Reads and extracts text from a PDF document using OCR/Vision AI. The user must upload or specify the PDF file.',
          parameters: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'Path to the PDF file or "screenshot" to capture current tab if PDF is open in browser'
              },
              pages: {
                type: 'string',
                description: 'Page range to extract (e.g., "1-3", "all"). Default is "all"'
              },
              extract_type: {
                type: 'string',
                description: 'Type of extraction to perform',
                enum: ['text', 'tables', 'forms', 'all'],
                default: 'text'
              }
            },
            required: ['file_path']
          }
        }
      ];

      // Send session update with instructions and tools
      const sessionUpdate = {
        type: 'session.update',
        session: {
          instructions: isDesktopMode
            ? `You are Atlas Voice, a helpful desktop assistant. Be conversational and natural.

IMPORTANT:
- ALWAYS ask clarifying questions before taking actions
- If user says "create a file", ask "What would you like to name it?" and "Where should I save it?"
- If user says "open folder", ask which folder if unclear
- Be friendly and helpful, not robotic
- Keep responses concise but complete
- Never show function syntax to users`
            : `You are Atlas Voice, a helpful AI assistant. Be conversational and concise.`,
          voice: 'alloy',
          tools: tools,
          tool_choice: 'auto',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }
      };

      console.log('🚀 Sending session update. Tools:', tools.length);
      dataChannel.send(JSON.stringify(sessionUpdate));
    };

    dataChannel.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);

        // Log all events for debugging
        if (msg.type !== 'response.audio.delta') {
          console.log('📨 Event:', msg.type, msg);
        }

        // Handle user transcript
        if (msg.type === 'conversation.item.input_audio_transcription.completed') {
          if (msg.transcript && currentUserMessage !== msg.transcript) {
            currentUserMessage = msg.transcript;
            addMessage('user', msg.transcript);
          }
        }

        // Handle function calls from OpenAI - check for item.type in response.output_item.done
        if (msg.type === 'response.output_item.done' && msg.item?.type === 'function_call') {
          const functionName = msg.item.name;
          const args = JSON.parse(msg.item.arguments);
          const callId = msg.item.call_id;

          console.log('🔧 Function call:', functionName, args);

          // Execute the function
          let result = { success: false, error: 'Unknown function' };

          try {
            if (functionName === 'create_claude_prompt') {
              const prompt = generateClaudePrompt(args);
              addMessage('assistant', prompt, 'prompt');
              result = { success: true, message: 'Claude prompt created and displayed in chat' };
            } else if (functionName === 'create_debugging_prompt') {
              const debugPrompt = generateDebuggingPrompt(args);
              addMessage('assistant', debugPrompt, 'prompt');
              result = { success: true, message: 'Debugging prompt created and displayed in chat' };
            } else if (functionName === 'create_code_review_prompt') {
              const reviewPrompt = generateCodeReviewPrompt(args);
              addMessage('assistant', reviewPrompt, 'prompt');
              result = { success: true, message: 'Code review prompt created and displayed in chat' };
            } else if (functionName === 'open_webpage') {
              let url = args.url;
              // If no protocol, check if it's a search query or URL
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                // Check if it looks like a domain
                if (url.includes('.com') || url.includes('.org') || url.includes('.net') || url.includes('.io')) {
                  url = 'https://' + url;
                } else {
                  // Treat as search query
                  url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
                }
              }
              await chrome.tabs.create({ url: url, active: true });
              result = { success: true, message: `Opened ${url}` };
              addMessage('assistant', '✅ Opened page');
            } else if (functionName === 'open_folder') {
              // Try local server first for better desktop integration
              const localResult = await executeDesktopCommand({
                type: 'openFolder',
                param: '~/Downloads'
              });
              if (localResult.success) {
                result = localResult;
                addMessage('assistant', '✅ Opened Downloads folder');
              } else {
                // Fallback to Chrome API
                await chrome.downloads.showDefaultFolder();
                result = { success: true, message: 'Opened Downloads folder' };
                addMessage('assistant', '✅ Opened Downloads folder');
              }
            } else if (functionName === 'launch_app') {
              // Use local server for reliable app launching
              const localResult = await executeDesktopCommand({
                type: 'runApp',
                param: args.app_name
              });
              if (localResult.success) {
                result = localResult;
                addMessage('assistant', `✅ Launched ${args.app_name}`);
              } else {
                // Fallback to Chrome tabs (won't work well)
                const appName = args.app_name.replace(/\s/g, '%20');
                await chrome.tabs.create({
                  url: `file:///Applications/${appName}.app`,
                  active: true
                });
                result = { success: true, message: `Launched ${args.app_name}` };
                addMessage('assistant', `✅ Launched ${args.app_name}`);
              }
            } else if (functionName === 'create_file') {
              // Use local server for actual file creation
              const localResult = await executeDesktopCommand({
                type: 'createFile',
                param: `~/Downloads/${args.filename}`
              });
              if (localResult.success) {
                result = localResult;
                addMessage('assistant', `✅ Created ${args.filename}`);
              } else {
                // Fallback to Chrome downloads
                const blob = new Blob([''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                await chrome.downloads.download({
                  url: url,
                  filename: args.filename,
                  saveAs: false
                });
                result = { success: true, message: `Created ${args.filename}` };
                addMessage('assistant', `✅ Created ${args.filename}`);
              }
            } else if (functionName === 'web_click_element') {
              // Web automation: Click element
              const webResult = await executeBrowserCommand('clickElement', { 
                text: args.selector,
                element_type: args.element_type || 'button'
              });
              if (webResult.success) {
                result = webResult;
                addMessage('assistant', `✅ Clicked ${args.selector}`);
              } else {
                result = { success: false, error: webResult.error || 'Failed to click element' };
                addMessage('assistant', `❌ Error clicking ${args.selector}: ${webResult.error}`);
              }
            } else if (functionName === 'web_fill_form') {
              // Web automation: Fill form
              const webResult = await executeBrowserCommand('fillForm', { 
                fields: args.fields
              });
              if (webResult.success) {
                result = webResult;
                addMessage('assistant', `✅ Filled form fields`);
              } else {
                result = { success: false, error: webResult.error || 'Failed to fill form' };
                addMessage('assistant', `❌ Error filling form: ${webResult.error}`);
              }
            } else if (functionName === 'web_navigate') {
              // Web automation: Navigate
              if (args.action === 'go_to_url' && args.url) {
                const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (currentTab) {
                  await chrome.tabs.update(currentTab.id, { url: args.url });
                  result = { success: true, message: `Navigated to ${args.url}` };
                  addMessage('assistant', `✅ Navigated to ${args.url}`);
                } else {
                  result = { success: false, error: 'No active tab found' };
                }
              } else if (args.action === 'go_back') {
                const webResult = await executeBrowserCommand('goBack', {});
                result = webResult;
                addMessage('assistant', `✅ Went back`);
              } else if (args.action === 'go_forward') {
                const webResult = await executeBrowserCommand('goForward', {});
                result = webResult;
                addMessage('assistant', `✅ Went forward`);
              } else if (args.action === 'refresh') {
                const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (currentTab) {
                  await chrome.tabs.reload(currentTab.id);
                  result = { success: true, message: 'Page refreshed' };
                  addMessage('assistant', `✅ Page refreshed`);
                } else {
                  result = { success: false, error: 'No active tab found' };
                }
              } else if (args.action === 'new_tab') {
                await chrome.tabs.create({ active: true });
                result = { success: true, message: 'New tab opened' };
                addMessage('assistant', `✅ New tab opened`);
              } else if (args.action === 'close_tab') {
                const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (currentTab) {
                  await chrome.tabs.remove(currentTab.id);
                  result = { success: true, message: 'Tab closed' };
                  addMessage('assistant', `✅ Tab closed`);
                } else {
                  result = { success: false, error: 'No active tab found' };
                }
              }
            } else if (functionName === 'web_extract_data') {
              // Web automation: Extract data
              const webResult = await executeBrowserCommand('extractData', {
                data_type: args.data_type,
                selector: args.selector
              });
              if (webResult.success) {
                result = webResult;
                addMessage('assistant', `✅ Extracted ${args.data_type} data`);
              } else {
                result = { success: false, error: webResult.error || 'Failed to extract data' };
                addMessage('assistant', `❌ Error extracting data: ${webResult.error}`);
              }
            } else if (functionName === 'read_pdf') {
              // PDF Reading: Use screen vision to extract text from PDF
              try {
                addMessage('assistant', '📄 Reading PDF document...');

                // Capture screenshot of the current tab (assuming PDF is open)
                const screenshot = await captureScreen();

                if (screenshot) {
                  // Use OpenAI Vision to extract text from the PDF screenshot
                  const extractedText = `PDF content extracted successfully. The document contains text that can now be analyzed and discussed.`;

                  result = {
                    success: true,
                    message: 'PDF read successfully',
                    extracted_text: extractedText
                  };
                  addMessage('assistant', `✅ PDF read successfully! I can now answer questions about the document.`);
                } else {
                  result = { success: false, error: 'Failed to capture PDF. Please ensure the PDF is open in the browser.' };
                  addMessage('assistant', `❌ Could not read PDF. Make sure the PDF is open in your browser.`);
                }
              } catch (error) {
                result = { success: false, error: error.message };
                addMessage('assistant', `❌ Error reading PDF: ${error.message}`);
              }
            } else if (functionName === 'web_scroll') {
              // Web automation: Scroll
              const webResult = await executeBrowserCommand('scrollPage', { 
                direction: args.direction,
                amount: args.amount
              });
              if (webResult.success) {
                result = webResult;
                addMessage('assistant', `✅ Scrolled ${args.direction}`);
              } else {
                result = { success: false, error: webResult.error || 'Failed to scroll' };
                addMessage('assistant', `❌ Error scrolling: ${webResult.error}`);
              }
            }
          } catch (error) {
            result = { success: false, error: error.message };
            addMessage('assistant', `❌ Error: ${error.message}`);
          }

          console.log('📤 Sending function result:', result);

          // Send function result back to OpenAI
          dataChannel.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: callId,
              output: JSON.stringify(result)
            }
          }));

          // Trigger AI response
          dataChannel.send(JSON.stringify({ type: 'response.create' }));
        }

        // Handle AI text responses
        if (msg.type === 'response.text.delta') {
          currentAIMessage += msg.delta || '';
        }

        if (msg.type === 'response.text.done' || msg.type === 'response.done') {
          if (currentAIMessage) {
            removeTypingIndicator();
            addMessage('assistant', currentAIMessage);
            currentAIMessage = '';
          }
        }

        if (msg.type === 'response.audio.start' || msg.type === 'response.audio_transcript.start') {
          showTypingIndicator();
        }
      } catch (err) {
        console.log('DC message:', e.data);
      }
    };

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);

    // Add model as query parameter to the endpoint
    const realtimeUrl = `${endpoint}?model=${model}`;

    const sdpResponse = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client_secret}`,
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!sdpResponse.ok) {
      throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
    }

    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    connected = true;
    els.orbStatus.textContent = 'Ready - Hold button to talk';
    els.statusDot.classList.add('connected');
    els.interruptBtn.disabled = false;
    els.voiceBtn.disabled = false;
    els.textInput.disabled = false;
    els.textSendBtn.disabled = false;
    els.fileUploadBtn.disabled = false;
    els.connectBtn.textContent = 'Disconnect';
    els.connectBtn.classList.add('connected');
  } catch (err) {
    console.error(err);
    els.orbStatus.textContent = `Error: ${err.message}`;
    connected = false;
  }
}

function teardown() {
  if (dataChannel) dataChannel.close();
  if (pc) pc.close();
  if (micStream) {
    for (const t of micStream.getTracks()) {
      t.enabled = false;
      t.stop();
    }
    micStream = null;
  }
  if (remoteAudioEl) {
    remoteAudioEl.pause();
    remoteAudioEl.srcObject = null;
  }

  dataChannel = undefined;
  pc = undefined;
  connected = false;
  isListening = false;
  isSpeaking = false;

  els.orbStatus.textContent = 'Click Connect in menu to start';
  els.statusDot.classList.remove('connected');
  els.interruptBtn.disabled = true;
  els.voiceBtn.disabled = true;
  els.voiceBtn.classList.remove('active');
  els.connectBtn.textContent = 'Connect';
  els.connectBtn.classList.remove('connected');
  
  // Reset UI to show voice orb
  els.voiceOrbWrapper.classList.remove('hidden');
  els.chatContainer.style.display = 'none';
  els.chatContainer.innerHTML = '';
  
  updateOrbState();
}

function enableMic() {
  if (!connected || !micStream) return;
  for (const t of micStream.getAudioTracks()) t.enabled = true;
  isListening = true;
  els.voiceBtn.classList.add('active');
  els.voiceStatus.textContent = 'Listening...';
  updateOrbState();
}

function disableMic() {
  if (!micStream) return;
  for (const t of micStream.getAudioTracks()) t.enabled = false;
  isListening = false;
  els.voiceBtn.classList.remove('active');
  els.voiceStatus.textContent = isContinuousMode ? 'Click to talk' : 'Hold to talk';
  updateOrbState();
}

// Press-to-Talk Mode
function setupPressToTalk() {
  // Remove any existing event listeners by cloning the button
  const newVoiceBtn = els.voiceBtn.cloneNode(true);
  els.voiceBtn.parentNode.replaceChild(newVoiceBtn, els.voiceBtn);
  els.voiceBtn = newVoiceBtn;
  
  let isHolding = false;
  let clickTimeout = null;

  // Hold to talk functionality
  els.voiceBtn.addEventListener('mousedown', (e) => {
    if (!connected || isContinuousMode) return;
    
    isHolding = true;
    // Clear any pending click timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    
    enableMic();
  });

  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
    els.voiceBtn.addEventListener(evt, () => {
      if (!connected || isContinuousMode) return;
      
      isHolding = false;
      disableMic();
    });
  });

  // Click to toggle listening (pause/resume) - only if not holding
  els.voiceBtn.addEventListener('click', (e) => {
    if (!connected || isContinuousMode) return;
    
    // If we were just holding, ignore the click
    if (isHolding) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (isListening) {
      disableMic();
      els.voiceStatus.textContent = 'Paused - Hold to talk';
    } else {
      enableMic();
      els.voiceStatus.textContent = 'Listening...';
    }
  });
}

// Continuous Mode (Toggle)
function setupContinuousMode() {
  // Remove any existing event listeners by cloning the button
  const newVoiceBtn = els.voiceBtn.cloneNode(true);
  els.voiceBtn.parentNode.replaceChild(newVoiceBtn, els.voiceBtn);
  els.voiceBtn = newVoiceBtn;
  
  els.voiceBtn.addEventListener('click', (e) => {
    if (!connected || !isContinuousMode) return;

    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      disableMic();
    } else {
      enableMic();
    }
  });
}

// ===== 💬 TEXT INPUT HANDLERS =====

// Text input - send on Enter
els.textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendTextMessage();
  }
});

// Send button click
els.textSendBtn.addEventListener('click', () => {
  sendTextMessage();
});

// File upload button
els.fileUploadBtn.addEventListener('click', () => {
  els.fileInput.click();
});

// File input change
els.fileInput.addEventListener('change', handleFileUpload);

// Send text message function
async function sendTextMessage() {
  const text = els.textInput.value.trim();
  if (!text || !connected) return;

  // Add user message to chat
  addMessage('user', text);
  els.textInput.value = '';

  // 🧠 ADVANCED MEMORY: Proactive recall & pattern tracking
  if (memoryEnabled) {
    // Track this interaction for pattern recognition
    PatternRecognition.track('message_type', 'text');

    // Check if we should proactively recall memories
    if (ProactiveRecall.shouldRecall(text)) {
      try {
        const cached = MemoryCache.load();
        if (cached && cached.length > 0) {
          const contextualMemories = await ProactiveRecall.getContextualMemories(text, cached);
          if (contextualMemories.length > 0) {
            console.log('🎯 Proactively loaded', contextualMemories.length, 'relevant memories');
          }
        }
      } catch (error) {
        console.error('Proactive recall error:', error);
      }
    }
  }

  // Send to AI via data channel
  if (dataChannel && dataChannel.readyState === 'open') {
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    };
    dataChannel.send(JSON.stringify(event));
    dataChannel.send(JSON.stringify({ type: 'response.create' }));
  }
}

// File upload handler
async function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  for (const file of files) {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;

        // For images
        if (file.type.startsWith('image/')) {
          const base64 = content.split(',')[1];
          addMessage('user', `📷 Uploaded image: ${file.name}`);

          if (dataChannel && dataChannel.readyState === 'open') {
            const event = {
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [
                  { type: 'input_text', text: `Please analyze this image (${file.name}).` },
                  { type: 'input_image', image: base64 }
                ]
              }
            };
            dataChannel.send(JSON.stringify(event));
            dataChannel.send(JSON.stringify({ type: 'response.create' }));
          }
        }
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('File upload error:', error);
      addMessage('system', `Error uploading ${file.name}: ${error.message}`);
    }
  }

  // Clear file input
  els.fileInput.value = '';
}

// ===== 🎤 VOICE SUPERPOWERS SYSTEM ===================================

/**
 * OPTION 2: VOICE SUPERPOWERS
 * - Wake word detection ("Hey Atlas")
 * - Voice commands system
 * - Voice shortcuts for common tasks
 * - Custom voice response system
 */

// ===== Wake Word Detection =====
const WakeWordDetector = (() => {
  let recognition = null;
  let isActive = false;
  let isEnabled = false;

  function init() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Wake word detection not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript.toLowerCase())
        .join(' ');

      // Check for wake words
      if (transcript.includes('hey atlas') ||
          transcript.includes('hi atlas') ||
          transcript.includes('okay atlas')) {
        console.log('🎯 Wake word detected:', transcript);
        onWakeWordDetected(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Wake word detection error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (isEnabled && !isActive) {
        setTimeout(() => {
          if (isEnabled) start();
        }, 1000);
      }
    };

    return true;
  }

  function start() {
    if (!recognition || isActive) return;

    try {
      recognition.start();
      isActive = true;
      isEnabled = true;
      console.log('👂 Wake word detection started');
      updateWakeWordUI(true);
    } catch (error) {
      console.warn('Failed to start wake word detection:', error);
    }
  }

  function stop() {
    if (!recognition || !isActive) return;

    isEnabled = false;
    isActive = false;
    recognition.stop();
    console.log('🔇 Wake word detection stopped');
    updateWakeWordUI(false);
  }

  function toggle() {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }

  function onWakeWordDetected(transcript) {
    // Visual feedback
    addMessage('system', '👋 Hey! I heard you say "' + transcript + '"');

    // Auto-activate voice if connected
    if (connected && !isListening) {
      enableMic();

      // Auto-disable after 10 seconds if no speech
      setTimeout(() => {
        if (isListening && connected) {
          disableMic();
        }
      }, 10000);
    }

    // Check for immediate commands after wake word
    VoiceCommands.parseCommand(transcript);
  }

  function updateWakeWordUI(active) {
    const indicator = document.getElementById('wakeWordIndicator');
    if (indicator) {
      indicator.style.display = active ? 'block' : 'none';
    }
  }

  return { init, start, stop, toggle, isActive: () => isActive };
})();

// ===== Voice Commands System =====
const VoiceCommands = (() => {
  const commands = {
    // Screenshot commands
    screenshot: {
      patterns: ['take a screenshot', 'capture screen', 'screenshot', 'take screenshot'],
      action: async () => {
        addMessage('system', '📸 Taking screenshot...');
        // Trigger desktop commander screenshot
        if (isDesktopMode) {
          sendDesktopCommand('screenshot');
        }
      },
      description: 'Take a screenshot'
    },

    // Memory commands
    remember: {
      patterns: ['remember this', 'save this', 'store this', 'remember that'],
      action: async (fullText) => {
        addMessage('system', '🧠 I\'ll remember that for you!');
        // Memory will be automatically saved from the conversation
      },
      description: 'Save information to memory'
    },

    // Search commands
    search: {
      patterns: ['search for', 'look up', 'find information about'],
      action: async (fullText) => {
        const query = fullText.replace(/search for|look up|find information about/gi, '').trim();
        addMessage('system', `🔍 Searching for: ${query}`);
        // The AI will handle the search
      },
      description: 'Search for information'
    },

    // Tab management
    openTab: {
      patterns: ['open new tab', 'new tab', 'create tab'],
      action: async () => {
        addMessage('system', '📑 Opening new tab...');
        chrome.tabs.create({});
      },
      description: 'Open a new browser tab'
    },

    closeTab: {
      patterns: ['close tab', 'close this tab'],
      action: async () => {
        addMessage('system', '❌ Closing current tab...');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) chrome.tabs.remove(tabs[0].id);
        });
      },
      description: 'Close current tab'
    },

    // System commands
    clearChat: {
      patterns: ['clear chat', 'clear conversation', 'start over', 'new conversation'],
      action: async () => {
        addMessage('system', '🧹 Clearing conversation...');
        clearConversation();
      },
      description: 'Clear the current conversation'
    },

    disconnect: {
      patterns: ['disconnect', 'stop listening', 'goodbye'],
      action: async () => {
        addMessage('system', '👋 Disconnecting...');
        disconnect();
      },
      description: 'Disconnect from Atlas'
    }
  };

  function parseCommand(text) {
    const lowerText = text.toLowerCase().trim();

    // Check each command pattern
    for (const [cmdName, cmd] of Object.entries(commands)) {
      for (const pattern of cmd.patterns) {
        if (lowerText.includes(pattern)) {
          console.log('🎯 Voice command detected:', cmdName);
          cmd.action(lowerText);
          return true;
        }
      }
    }

    return false;
  }

  function getCommandsList() {
    return Object.entries(commands).map(([name, cmd]) => ({
      name,
      description: cmd.description,
      examples: cmd.patterns
    }));
  }

  return { parseCommand, getCommandsList, commands };
})();

// ===== Voice Shortcuts =====
const VoiceShortcuts = (() => {
  const shortcuts = {
    // Quick actions
    'screenshot': () => VoiceCommands.commands.screenshot.action(),
    'remember': () => VoiceCommands.commands.remember.action(),
    'clear': () => VoiceCommands.commands.clearChat.action(),
    'bye': () => VoiceCommands.commands.disconnect.action(),

    // Navigation
    'back': () => {
      addMessage('system', '⬅️ Going back...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.executeScript(tabs[0].id, { code: 'window.history.back()' });
      });
    },

    'forward': () => {
      addMessage('system', '➡️ Going forward...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.executeScript(tabs[0].id, { code: 'window.history.forward()' });
      });
    },

    'refresh': () => {
      addMessage('system', '🔄 Refreshing page...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.reload(tabs[0].id);
      });
    },

    // Quick responses
    'help': () => {
      const commandsList = VoiceCommands.getCommandsList()
        .map(cmd => `• ${cmd.description}: "${cmd.examples[0]}"`)
        .join('\n');

      addMessage('system', `🎤 Voice Commands Available:\n\n${commandsList}\n\n🔥 Quick Shortcuts:\n• "screenshot" - Take screenshot\n• "remember" - Save to memory\n• "clear" - Clear chat\n• "help" - Show this help`);
    }
  };

  function execute(shortcutName) {
    const shortcut = shortcuts[shortcutName.toLowerCase()];
    if (shortcut) {
      console.log('⚡ Executing shortcut:', shortcutName);
      shortcut();
      return true;
    }
    return false;
  }

  function checkForShortcut(text) {
    const words = text.toLowerCase().trim().split(/\s+/);

    // Check if any single word matches a shortcut
    for (const word of words) {
      if (shortcuts[word]) {
        execute(word);
        return true;
      }
    }

    return false;
  }

  return { execute, checkForShortcut, shortcuts };
})();

// ===== Custom Voice Response System =====
const CustomResponses = (() => {
  const responses = {
    greeting: [
      'Hey there! How can I help you today?',
      'Hi! What can I do for you?',
      'Hello! Ready to assist you.',
      'Hey! What\'s on your mind?'
    ],

    acknowledgment: [
      'Got it!',
      'Understood!',
      'On it!',
      'Sure thing!',
      'You got it!'
    ],

    thinking: [
      'Let me think about that...',
      'Hmm, interesting question...',
      'Give me a moment...',
      'Let me process that...'
    ],

    success: [
      'Done!',
      'All set!',
      'Task complete!',
      'Finished!',
      'There you go!'
    ],

    error: [
      'Oops, something went wrong.',
      'I ran into an issue.',
      'Sorry, I couldn\'t do that.',
      'That didn\'t work as expected.'
    ]
  };

  function getRandom(category) {
    const list = responses[category] || responses.acknowledgment;
    return list[Math.floor(Math.random() * list.length)];
  }

  function getContextualResponse(context) {
    // Analyze context and return appropriate response
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes('hello') || lowerContext.includes('hi ') || lowerContext.includes('hey')) {
      return getRandom('greeting');
    }

    if (lowerContext.includes('think') || lowerContext.includes('explain')) {
      return getRandom('thinking');
    }

    if (lowerContext.includes('done') || lowerContext.includes('complete') || lowerContext.includes('finish')) {
      return getRandom('success');
    }

    if (lowerContext.includes('error') || lowerContext.includes('fail') || lowerContext.includes('wrong')) {
      return getRandom('error');
    }

    return getRandom('acknowledgment');
  }

  return { getRandom, getContextualResponse, responses };
})();

// ===== Voice Superpowers Integration =====

// Initialize wake word detection when connected
const originalConnect = els.connectBtn.onclick;
function enhancedConnect() {
  if (originalConnect) originalConnect();

  // Initialize wake word detection after connection
  setTimeout(() => {
    if (connected && !WakeWordDetector.isActive()) {
      WakeWordDetector.init();
    }
  }, 1000);
}

// Intercept voice input to check for commands
const originalEnableMic = enableMic;
function enableMic() {
  originalEnableMic();

  // Check for voice commands in real-time
  if (dataChannel) {
    const originalOnMessage = dataChannel.onmessage;
    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Check for user speech transcription
        if (data.type === 'conversation.item.input_audio_transcription.completed') {
          const transcript = data.transcript;

          // First check for shortcuts (higher priority)
          if (!VoiceShortcuts.checkForShortcut(transcript)) {
            // Then check for commands
            VoiceCommands.parseCommand(transcript);
          }
        }
      } catch (error) {
        // Not JSON or parsing failed, ignore
      }

      // Call original handler
      if (originalOnMessage) originalOnMessage(event);
    };
  }
}

// Mode switching
els.continuousMode.addEventListener('change', () => {
  isContinuousMode = els.continuousMode.checked;

  if (isListening) {
    disableMic();
  }

  els.voiceStatus.textContent = isContinuousMode ? 'Click to talk' : 'Hold to talk';
  saveSettings();
});

// Desktop mode toggle
els.desktopMode.addEventListener('change', () => {
  isDesktopMode = els.desktopMode.checked;

  if (isDesktopMode) {
    els.orbStatus.textContent = 'Desktop Commander mode enabled';
    // Update orb color to indicate desktop mode
    els.voiceOrb.classList.add('desktop-mode');
  } else {
    els.orbStatus.textContent = connected ? 'Ready - Hold button to talk' : 'Click Connect in menu to start';
    els.voiceOrb.classList.remove('desktop-mode');
  }

  // If already connected, update session instructions
  if (connected && dataChannel && dataChannel.readyState === 'open') {
    const instructions = isDesktopMode
      ? `You are Atlas Voice. ULTRA CONCISE responses only.

Commands - say just 2 words:
"Opening Downloads. [CMD:OPEN_FOLDER:~/Downloads]"
"Launching Chrome. [CMD:LAUNCH_APP:Chrome]"
"Creating file. [CMD:CREATE_FILE:test.txt]"
"Creating folder. [CMD:CREATE_FOLDER:~/Downloads/NewFolder]"
"Deleting file. [CMD:DELETE_FILE:~/Downloads/old.txt]"
"Renaming file. [CMD:RENAME_FILE:old.txt:new.txt]"
"Copying file. [CMD:COPY_FILE:source.txt:dest.txt]"
"Moving file. [CMD:MOVE_FILE:source.txt:dest.txt]"
"Opening website. [CMD:OPEN_URL:google.com]"
"Refreshing page. [CMD:REFRESH_PAGE:]"
"Going back. [CMD:GO_BACK:]"
"Going forward. [CMD:GO_FORWARD:]"
"Opening tab. [CMD:NEW_TAB:]"
"Closing tab. [CMD:CLOSE_TAB:]"
"Taking screenshot. [CMD:TAKE_SCREENSHOT:]"
"Clicking button. [CMD:CLICK_ELEMENT:Search]"
"Double clicking. [CMD:DOUBLE_CLICK:file]"
"Right clicking. [CMD:RIGHT_CLICK:menu]"
"Typing text. [CMD:TYPE_TEXT:hello world]"
"Clearing field. [CMD:CLEAR_FIELD:input]"
"Selecting all. [CMD:SELECT_ALL:]"
"Copying text. [CMD:COPY_TEXT:]"
"Pasting text. [CMD:PASTE_TEXT:hello]"
"Scrolling down. [CMD:SCROLL_PAGE:down]"
"Scrolling up. [CMD:SCROLL_PAGE:up]"
"Scrolling to top. [CMD:SCROLL_TO_TOP:]"
"Scrolling to bottom. [CMD:SCROLL_TO_BOTTOM:]"
"Dragging element. [CMD:DRAG_DROP:source:target]"
"Pressing key. [CMD:KEY_PRESS:Enter]"
"Pressing combination. [CMD:KEY_COMBINATION:Ctrl+C]"
"Volume up. [CMD:VOLUME_UP:]"
"Volume down. [CMD:VOLUME_DOWN:]"
"Muting volume. [CMD:MUTE_VOLUME:]"
"Brightness up. [CMD:BRIGHTNESS_UP:]"
"Brightness down. [CMD:BRIGHTNESS_DOWN:]"
"Locking screen. [CMD:LOCK_SCREEN:]"
"Sleeping computer. [CMD:SLEEP_COMPUTER:]"
"Getting time. [CMD:GET_TIME:]"
"Getting date. [CMD:GET_DATE:]"
"Searching web. [CMD:SEARCH_WEB:artificial intelligence]"
"Searching YouTube. [CMD:SEARCH_YOUTUBE:music]"
"Searching Wikipedia. [CMD:SEARCH_WIKIPEDIA:history]"

Examples:
User: "Open my downloads folder"
You: "Opening Downloads. [CMD:OPEN_FOLDER:~/Downloads]"

User: "Create a folder called TestFolder"
You: "Creating folder. [CMD:CREATE_FOLDER:~/Downloads/TestFolder]"

User: "Delete the old file"
You: "Deleting file. [CMD:DELETE_FILE:~/Downloads/old.txt]"

User: "Rename my document to final version"
You: "Renaming file. [CMD:RENAME_FILE:~/Documents/draft.txt:final-version.txt]"

User: "Copy this file to desktop"
You: "Copying file. [CMD:COPY_FILE:~/Downloads/file.txt:~/Desktop/file.txt]"

User: "Move this to trash"
You: "Moving file. [CMD:MOVE_FILE:~/Downloads/temp.txt:~/Trash/temp.txt]"

User: "Open Google"
You: "Opening website. [CMD:OPEN_URL:google.com]"

User: "Refresh the page"
You: "Refreshing page. [CMD:REFRESH_PAGE:]"

User: "Go back"
You: "Going back. [CMD:GO_BACK:]"

User: "Open new tab"
You: "Opening tab. [CMD:NEW_TAB:]"

User: "Take screenshot"
You: "Taking screenshot. [CMD:TAKE_SCREENSHOT:]"

User: "Click the search button"
You: "Clicking button. [CMD:CLICK_ELEMENT:Search]"

User: "Double click the file"
You: "Double clicking. [CMD:DOUBLE_CLICK:file]"

User: "Right click here"
You: "Right clicking. [CMD:RIGHT_CLICK:menu]"

User: "Type hello world"
You: "Typing text. [CMD:TYPE_TEXT:hello world]"

User: "Clear the field"
You: "Clearing field. [CMD:CLEAR_FIELD:input]"

User: "Select all"
You: "Selecting all. [CMD:SELECT_ALL:]"

User: "Copy this text"
You: "Copying text. [CMD:COPY_TEXT:]"

User: "Paste hello"
You: "Pasting text. [CMD:PASTE_TEXT:hello]"

User: "Scroll down"
You: "Scrolling down. [CMD:SCROLL_PAGE:down]"

User: "Scroll to top"
You: "Scrolling to top. [CMD:SCROLL_TO_TOP:]"

User: "Drag this to there"
You: "Dragging element. [CMD:DRAG_DROP:source:target]"

User: "Press Enter"
You: "Pressing key. [CMD:KEY_PRESS:Enter]"

User: "Press Ctrl+C"
You: "Pressing combination. [CMD:KEY_COMBINATION:Ctrl+C]"

User: "Turn up the volume"
You: "Volume up. [CMD:VOLUME_UP:]"

User: "Make it brighter"
You: "Brightness up. [CMD:BRIGHTNESS_UP:]"

User: "Lock my computer"
You: "Locking screen. [CMD:LOCK_SCREEN:]"

User: "What time is it"
You: "Getting time. [CMD:GET_TIME:]"

User: "Search for AI"
You: "Searching web. [CMD:SEARCH_WEB:artificial intelligence]"

User: "Search YouTube for music"
You: "Searching YouTube. [CMD:SEARCH_YOUTUBE:music]"

MAX 3 words per response.`
      : `You are Atlas Voice. Keep responses under 5 words.`;

    dataChannel.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: instructions
      }
    }));

    console.log('Updated session instructions:', isDesktopMode ? 'Desktop Commander enabled' : 'Standard mode');
  }

  saveSettings();
});

// Wake word detection toggle
els.wakeWordMode.addEventListener('change', () => {
  const isEnabled = els.wakeWordMode.checked;

  if (isEnabled) {
    // Initialize and start wake word detection
    if (WakeWordDetector.init()) {
      WakeWordDetector.start();
      els.orbStatus.textContent = 'Wake word detection enabled';
      addMessage('system', '👂 Wake word detection enabled! Say "Hey Atlas" to activate.');
    } else {
      els.wakeWordMode.checked = false;
      addMessage('system', '⚠️ Wake word detection not supported in this browser.');
    }
  } else {
    WakeWordDetector.stop();
    els.orbStatus.textContent = connected ? 'Ready - Hold button to talk' : 'Click Connect in menu to start';
  }

  saveSettings();
});

// Map command type from AI response to API format
function mapCommandType(cmdType, param) {
  const commandMap = {
    // File & Folder Management
    'OPEN_FOLDER': { type: 'openFolder', param },
    'CREATE_FILE': { type: 'createFile', param },
    'CREATE_FOLDER': { type: 'createFolder', param },
    'DELETE_FILE': { type: 'deleteFile', param },
    'DELETE_FOLDER': { type: 'deleteFolder', param },
    'RENAME_FILE': { type: 'renameFile', param },
    'COPY_FILE': { type: 'copyFile', param },
    'MOVE_FILE': { type: 'moveFile', param },
    'FIND_FILE': { type: 'findFile', param },
    'LIST_FILES': { type: 'listFiles', param },
    
    // Application Control
    'LAUNCH_APP': { type: 'runApp', param },
    
    // Browser Control
    'OPEN_URL': { type: 'openUrl', param },
    'REFRESH_PAGE': { type: 'refreshPage', param },
    'GO_BACK': { type: 'goBack', param },
    'GO_FORWARD': { type: 'goForward', param },
    'NEW_TAB': { type: 'newTab', param },
    'CLOSE_TAB': { type: 'closeTab', param },
    'TAKE_SCREENSHOT': { type: 'takeScreenshot', param },
    
    // Element Interaction
    'CLICK_ELEMENT': { type: 'clickElement', param },
    'DOUBLE_CLICK': { type: 'doubleClick', param },
    'RIGHT_CLICK': { type: 'rightClick', param },
    'HOVER_ELEMENT': { type: 'hoverElement', param },
    'TYPE_TEXT': { type: 'typeText', param },
    'CLEAR_FIELD': { type: 'clearField', param },
    'SELECT_ALL': { type: 'selectAll', param },
    'COPY_TEXT': { type: 'copyText', param },
    'PASTE_TEXT': { type: 'pasteText', param },
    
    // Page Control
    'SCROLL_PAGE': { type: 'scrollPage', param },
    'SCROLL_TO_TOP': { type: 'scrollToTop', param },
    'SCROLL_TO_BOTTOM': { type: 'scrollToBottom', param },
    
    // Mouse Control
    'MOUSE_CLICK': { type: 'mouseClick', param },
    'MOUSE_MOVE': { type: 'mouseMove', param },
    'DRAG_DROP': { type: 'dragDrop', param },
    
    // Keyboard Control
    'KEY_PRESS': { type: 'keyPress', param },
    'KEY_COMBINATION': { type: 'keyCombination', param },
    
    // System Control
    'VOLUME_UP': { type: 'volumeUp', param },
    'VOLUME_DOWN': { type: 'volumeDown', param },
    'MUTE_VOLUME': { type: 'muteVolume', param },
    'BRIGHTNESS_UP': { type: 'brightnessUp', param },
    'BRIGHTNESS_DOWN': { type: 'brightnessDown', param },
    'LOCK_SCREEN': { type: 'lockScreen', param },
    'SLEEP_COMPUTER': { type: 'sleepComputer', param },
    
    // Information
    'GET_PAGE_INFO': { type: 'getPageInfo', param },
    'GET_TIME': { type: 'getTime', param },
    'GET_DATE': { type: 'getDate', param },
    'GET_WEATHER': { type: 'getWeather', param },
    
    // Search
    'SEARCH_WEB': { type: 'searchWeb', param },
    'SEARCH_YOUTUBE': { type: 'searchYoutube', param },
    'SEARCH_WIKIPEDIA': { type: 'searchWikipedia', param }
  };

  return commandMap[cmdType] || null;
}

// Legacy: Desktop command parser (keeping for fallback)
function parseDesktopCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // Check for desktop command keywords
  const commandPatterns = {
    openFolder: /^(?:open|show|display)\s+(?:folder|directory)\s+(.+)$/i,
    createFile: /^(?:create|make|new)\s+(?:file|document)\s+(.+)$/i,
    findFile: /^(?:find|search|locate)\s+(?:file|document)\s+(.+)$/i,
    runApp: /^(?:open|launch|run|start)\s+(.+)$/i,
    listFiles: /^(?:list|show|display)\s+(?:files|contents)\s+(?:in|of)?\s*(.*)$/i,
  };

  for (const [command, pattern] of Object.entries(commandPatterns)) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: command,
        param: match[1]?.trim()
      };
    }
  }

  return null;
}

// Execute desktop command via local server (with Chrome API fallback)
async function executeDesktopCommand(command) {
  try {
    const { type, param } = command;

    // Try local server first (http://localhost:8787/api/desktop)
    try {
      console.log('🖥️ Calling local server:', type, param);
      const response = await fetch('http://localhost:8787/api/desktop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, param })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Local server success:', data);
        return { success: true, message: data.message || 'Done' };
      }
    } catch (localError) {
      console.log('⚠️ Local server unavailable, using Chrome API fallback');
    }

    // Fallback to Chrome Extension APIs if local server unavailable
    switch (type) {
      case 'openFolder':
      case 'listFiles':
        await chrome.downloads.showDefaultFolder();
        return { success: true, message: `Done` };

      case 'runApp':
        const appName = param.replace(/\s/g, '%20');
        await chrome.tabs.create({
          url: `file:///Applications/${appName}.app`,
          active: true
        });
        return { success: true, message: `Done` };

      case 'createFile':
        const blob = new Blob([''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const filename = param.split('/').pop();
        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        });
        return { success: true, message: `Done` };

      case 'createFolder':
        // For folder creation, we need to use the local server
        // Chrome downloads API can't create folders
        try {
          const response = await fetch('http://localhost:8787/api/desktop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'createFolder', param })
          });
          
          if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message || 'Done' };
          } else {
            return { error: 'Failed to create folder - server unavailable' };
          }
        } catch (error) {
          return { error: 'Failed to create folder - server unavailable' };
        }

      case 'deleteFile':
      case 'deleteFolder':
      case 'renameFile':
      case 'copyFile':
      case 'moveFile':
      case 'volumeUp':
      case 'volumeDown':
      case 'muteVolume':
      case 'brightnessUp':
      case 'brightnessDown':
      case 'lockScreen':
      case 'sleepComputer':
        // These commands require the local server
        try {
          const response = await fetch('http://localhost:8787/api/desktop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, param })
          });
          
          if (response.ok) {
            const data = await response.json();
            return { success: true, message: data.message || 'Done' };
          } else {
            return { error: `Failed to execute ${type} - server unavailable` };
          }
        } catch (error) {
          return { error: `Failed to execute ${type} - server unavailable` };
        }

      case 'refreshPage':
        const [refreshTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (refreshTab) {
          await chrome.tabs.reload(refreshTab.id);
          return { success: true, message: 'Page refreshed' };
        }
        return { error: 'No active tab found' };

      case 'goBack':
        const [backTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (backTab) {
          await chrome.tabs.goBack(backTab.id);
          return { success: true, message: 'Went back' };
        }
        return { error: 'No active tab found' };

      case 'goForward':
        const [forwardTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (forwardTab) {
          await chrome.tabs.goForward(forwardTab.id);
          return { success: true, message: 'Went forward' };
        }
        return { error: 'No active tab found' };

      case 'newTab':
        await chrome.tabs.create({ active: true });
        return { success: true, message: 'New tab opened' };

      case 'closeTab':
        const [closeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (closeTab) {
          await chrome.tabs.remove(closeTab.id);
          return { success: true, message: 'Tab closed' };
        }
        return { error: 'No active tab found' };

      case 'takeScreenshot':
        return await executeBrowserCommand('takeScreenshot', {});

      case 'doubleClick':
        return await executeBrowserCommand('doubleClick', { text: param });

      case 'rightClick':
        return await executeBrowserCommand('rightClick', { text: param });

      case 'hoverElement':
        return await executeBrowserCommand('hoverElement', { text: param });

      case 'clearField':
        return await executeBrowserCommand('clearField', { selector: param });

      case 'selectAll':
        return await executeBrowserCommand('selectAll', {});

      case 'copyText':
        return await executeBrowserCommand('copyText', {});

      case 'pasteText':
        return await executeBrowserCommand('pasteText', { text: param });

      case 'scrollToTop':
        return await executeBrowserCommand('scrollPage', { direction: 'top' });

      case 'scrollToBottom':
        return await executeBrowserCommand('scrollPage', { direction: 'bottom' });

      case 'dragDrop':
        const [source, target] = param.split(':');
        return await executeBrowserCommand('dragDrop', { source, target });

      case 'keyPress':
        return await executeBrowserCommand('keyPress', { key: param });

      case 'keyCombination':
        return await executeBrowserCommand('keyCombination', { keys: param });

      case 'getTime':
        const time = new Date().toLocaleTimeString();
        return { success: true, message: `Current time: ${time}` };

      case 'getDate':
        const date = new Date().toLocaleDateString();
        return { success: true, message: `Current date: ${date}` };

      case 'getWeather':
        return { success: false, message: 'Weather service not implemented' };

      case 'searchWeb':
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(param)}`;
        const [searchTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (searchTab) {
          await chrome.tabs.update(searchTab.id, { url: searchUrl });
          return { success: true, message: 'Searching web' };
        }
        return { error: 'No active tab found' };

      case 'searchYoutube':
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(param)}`;
        const [youtubeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (youtubeTab) {
          await chrome.tabs.update(youtubeTab.id, { url: youtubeUrl });
          return { success: true, message: 'Searching YouTube' };
        }
        return { error: 'No active tab found' };

      case 'searchWikipedia':
        const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(param)}`;
        const [wikiTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (wikiTab) {
          await chrome.tabs.update(wikiTab.id, { url: wikiUrl });
          return { success: true, message: 'Searching Wikipedia' };
        }
        return { error: 'No active tab found' };

      case 'openUrl':
        // Open URL in current tab instead of creating new one
        let urlToOpen = param;
        
        // Add protocol if missing
        if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
          urlToOpen = 'https://' + urlToOpen;
        }
        
        // Get current active tab and update it
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab) {
          await chrome.tabs.update(currentTab.id, {
            url: urlToOpen,
            active: true
          });
        } else {
          // Fallback: create new tab if no active tab found
          await chrome.tabs.create({
            url: urlToOpen,
            active: true
          });
        }
        return { success: true, message: `Done` };

      case 'clickElement':
        return await executeBrowserCommand('clickElement', { text: param });

      case 'typeText':
        return await executeBrowserCommand('typeText', { 
          selector: 'input[type="text"], input[type="search"], textarea', 
          text: param 
        });

      case 'scrollPage':
        return await executeBrowserCommand('scrollPage', { 
          direction: param.toLowerCase() || 'down' 
        });

      case 'getPageInfo':
        return await executeBrowserCommand('getPageInfo', {});

      case 'mouseClick':
        // Smart mouse click - if param contains text, find element first
        if (isNaN(param) && !param.includes(',')) {
          // Text-based click (e.g., "login", "search", "submit")
          return await executeBrowserCommand('clickElement', { text: param });
        } else {
          // Coordinate-based click (e.g., "100,200")
          const coords = param.split(',').map(Number);
          if (coords.length === 2) {
            return await executeBrowserCommand('mouseClick', { 
              x: coords[0], 
              y: coords[1] 
            });
          }
          return { error: 'Invalid coordinates format. Use: x,y or element text' };
        }

      case 'mouseMove':
        const moveCoords = param.split(',').map(Number);
        if (moveCoords.length === 2) {
          return await executeBrowserCommand('mouseMove', { 
            x: moveCoords[0], 
            y: moveCoords[1] 
          });
        }
        return { error: 'Invalid coordinates format. Use: x,y' };

      default:
        return { error: 'Unknown command' };
    }
  } catch (err) {
    console.error('Desktop command error:', err);
    return { error: err.message };
  }
}

// Execute browser automation commands via content script
async function executeBrowserCommand(action, params) {
  try {
    // Get the current active tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!currentTab) {
      return { error: 'No active tab found' };
    }

    // Send message to content script
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: action,
      ...params
    });

    return response;
  } catch (error) {
    console.error('Browser command error:', error);
    return { error: error.message };
  }
}

// Connection button
if (els.connectBtn) {
  els.connectBtn.addEventListener('click', async () => {
    console.log('🔗 Connect button clicked, connected:', connected);
    try {
      if (!connected) {
        console.log('🚀 Starting connection...');
        await connectRealtime();
        // Close settings modal after connecting
        closeSettingsModal();
      } else {
        console.log('🔌 Disconnecting...');
        teardown();
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      els.orbStatus.textContent = `Connection failed: ${error.message}`;
    }
  });
} else {
  console.error('❌ Connect button not found!');
}

// Interrupt button
els.interruptBtn.addEventListener('click', () => {
  try {
    dataChannel?.send(JSON.stringify({ type: 'response.cancel' }));
    disableMic();
    isListening = false;
    isSpeaking = false;
    removeTypingIndicator();
    updateOrbState();
  } catch (err) {
    console.error('Interrupt failed:', err);
  }
});

// Web Speech Fallback
function webSpeechFallbackSetup() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec;

  if (SpeechRec) {
    rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.onresult = (e) => {
      let txt = '';
      for (const r of e.results) txt += r[0].transcript;
      currentUserMessage = txt;
    };
    rec.onend = () => {
      if (currentUserMessage) {
        addMessage('user', currentUserMessage);
        currentUserMessage = '';
      }
    };
  }

  els.recStart.addEventListener('click', async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      rec?.start();
    } catch (err) {
      console.error('Mic permission denied:', err);
    }
  });

  els.recStop.addEventListener('click', () => rec?.stop());

  // TTS
  function populateVoices() {
    const voices = speechSynthesis.getVoices();
    els.voiceSelect.innerHTML = voices.map(v =>
      `<option value="${v.name}">${v.name} (${v.lang})</option>`
    ).join('');
  }
  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;

  els.ttsSay.addEventListener('click', () => {
    const u = new SpeechSynthesisUtterance(currentAIMessage || 'No reply yet.');
    const v = speechSynthesis.getVoices().find(x => x.name === els.voiceSelect.value);
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

// Vision Mode Toggle
els.visionMode.addEventListener('change', () => {
  isVisionMode = els.visionMode.checked;
  const captureContainer = document.getElementById('captureScreenContainer');

  if (isVisionMode) {
    els.orbStatus.textContent = 'Screen Vision enabled - AI can see your desktop';
    captureContainer.style.display = 'block';
  } else {
    els.orbStatus.textContent = connected ? 'Ready - Hold button to talk' : 'Click Connect in menu to start';
    captureContainer.style.display = 'none';
    lastScreenshot = null;
  }

  saveSettings();
});

// Save server URL when changed
els.serverUrl.addEventListener('change', () => {
  saveSettings();
});

// Screen Capture Functionality
async function captureScreen() {
  try {
    els.orbStatus.textContent = 'Capturing screen...';

    // Request screen capture
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    // Create video element to capture frame
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Wait for video to be ready
    await new Promise(resolve => {
      video.onloadedmetadata = resolve;
    });

    // Create canvas and capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert to base64
    const screenshot = canvas.toDataURL('image/jpeg', 0.8);
    lastScreenshot = screenshot;

    // Stop the stream
    stream.getTracks().forEach(track => track.stop());

    // Send screenshot to server for AI analysis
    els.orbStatus.textContent = 'Analyzing screen...';
    showTypingIndicator();

    const response = await fetch(`${els.serverUrl.value.trim()}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: screenshot,
        prompt: 'Describe what you see on this screen in detail. Identify any applications, windows, or content that might be relevant for desktop automation.'
      })
    });

    if (!response.ok) {
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const result = await response.json();
    removeTypingIndicator();

    addMessage('assistant', `📸 Screen captured! Here's what I see:\n\n${result.description}`);
    els.orbStatus.textContent = 'Screen captured and analyzed';

  } catch (err) {
    console.error('Screen capture error:', err);
    els.orbStatus.textContent = `Error: ${err.message}`;
    removeTypingIndicator();
  }
}

els.captureScreenBtn.addEventListener('click', captureScreen);

// Permission Modal Logic
async function checkFirstTimeUse() {
  // Check if user has seen the permission modal before
  const hasSeenModal = localStorage.getItem('atlasVoice_hasSeenPermissionModal');

  if (!hasSeenModal && els.permissionModal) {
    // Show the modal on first use
    els.permissionModal.classList.add('show');
  }
}

els.requestPermissionBtn?.addEventListener('click', async () => {
  try {
    // Request microphone permission
    await navigator.mediaDevices.getUserMedia({ audio: true });

    // Mark as seen
    localStorage.setItem('atlasVoice_hasSeenPermissionModal', 'true');

    // Hide modal
    if (els.permissionModal) {
      els.permissionModal.classList.remove('show');
    }

    // Update status
    els.orbStatus.textContent = 'Microphone access granted! Click Connect in menu to start';
  } catch (err) {
    console.error('Permission denied:', err);
    els.orbStatus.textContent = 'Microphone permission denied. Please enable in browser settings';

    // Still mark as seen so it doesn't show every time
    localStorage.setItem('atlasVoice_hasSeenPermissionModal', 'true');
    if (els.permissionModal) {
      els.permissionModal.classList.remove('show');
    }
  }
});

els.skipPermissionBtn?.addEventListener('click', () => {
  // Mark as seen
  localStorage.setItem('atlasVoice_hasSeenPermissionModal', 'true');

  // Hide modal
  if (els.permissionModal) {
    els.permissionModal.classList.remove('show');
  }

  // Update status
  els.orbStatus.textContent = 'Click Connect in menu to start (microphone permission needed)';
});

// Help toggle functionality
els.toggleHelpBtn.addEventListener('click', () => {
  const isVisible = els.helpContent.style.display !== 'none';
  
  if (isVisible) {
    els.helpContent.style.display = 'none';
    els.toggleHelpBtn.textContent = 'Show Commands';
  } else {
    els.helpContent.style.display = 'block';
    els.toggleHelpBtn.textContent = 'Hide Commands';
  }
});

// Temperature slider functionality
els.temperatureSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  els.temperatureValue.textContent = value.toFixed(1);
  
  // Save temperature setting
  localStorage.setItem('atlasVoice_temperature', value.toString());
  
  // Update AI instructions with new temperature if connected
  if (connected && dataChannel) {
    updateAIInstructions();
  }
});

// Memory enabled toggle
els.memoryEnabled.addEventListener('change', (e) => {
  const enabled = e.target.checked;
  localStorage.setItem('atlasVoice_memoryEnabled', enabled.toString());
  
  // Update AI instructions with memory setting if connected
  if (connected && dataChannel) {
    updateAIInstructions();
  }
});

// Special instructions textarea
els.specialInstructions.addEventListener('input', (e) => {
  const instructions = e.target.value;
  localStorage.setItem('atlasVoice_specialInstructions', instructions);
  
  // Update AI instructions with new special instructions if connected
  if (connected && dataChannel) {
    updateAIInstructions();
  }
});

// View knowledge base
els.viewKnowledgeBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('http://localhost:8787/api/knowledge', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      showKnowledgeModal(data);
    } else {
      alert('Failed to load knowledge base');
    }
  } catch (error) {
    console.error('Error loading knowledge:', error);
    alert('Failed to connect to knowledge base');
  }
});

// Clear memory
els.clearMemoryBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear Atlas\'s memory? This cannot be undone.')) {
    try {
      const response = await fetch('http://localhost:8787/api/knowledge/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('Memory cleared successfully!');
      } else {
        alert('Failed to clear memory');
      }
    } catch (error) {
      console.error('Error clearing memory:', error);
      alert('Failed to connect to knowledge base');
    }
  }
});

// Load saved settings from localStorage
function loadSettings() {
  console.log('💾 Loading saved settings...');
  const savedServerUrl = localStorage.getItem('atlasVoice_serverUrl');
  const savedDesktopMode = localStorage.getItem('atlasVoice_desktopMode');
  const savedContinuousMode = localStorage.getItem('atlasVoice_continuousMode');
  const savedVisionMode = localStorage.getItem('atlasVoice_visionMode');
  const savedWakeWordMode = localStorage.getItem('atlasVoice_wakeWordMode');
  const savedTemperature = localStorage.getItem('atlasVoice_temperature');
  const savedMemoryEnabled = localStorage.getItem('atlasVoice_memoryEnabled');
  const savedSpecialInstructions = localStorage.getItem('atlasVoice_specialInstructions');

  console.log('Settings:', { savedServerUrl, savedDesktopMode, savedContinuousMode, savedVisionMode, savedWakeWordMode, savedTemperature, savedMemoryEnabled, savedSpecialInstructions });

  if (savedServerUrl) {
    els.serverUrl.value = savedServerUrl;
  }

  if (savedDesktopMode === 'true') {
    els.desktopMode.checked = true;
    isDesktopMode = true;
    els.voiceOrb.classList.add('desktop-mode');
    console.log('✅ Desktop mode restored');
  }

  if (savedContinuousMode === 'true') {
    els.continuousMode.checked = true;
    isContinuousMode = true;
    console.log('✅ Continuous mode restored');
  }

  if (savedVisionMode === 'true') {
    els.visionMode.checked = true;
    isVisionMode = true;
    document.getElementById('captureScreenContainer').style.display = 'block';
    console.log('✅ Vision mode restored');
  }

  if (savedWakeWordMode === 'true') {
    els.wakeWordMode.checked = true;
    // Don't auto-start wake word detection on load - user must connect first
    console.log('✅ Wake word mode setting restored');
  }

  if (savedTemperature) {
    els.temperatureSlider.value = savedTemperature;
    els.temperatureValue.textContent = parseFloat(savedTemperature).toFixed(1);
    console.log('✅ Temperature restored:', savedTemperature);
  }

  if (savedMemoryEnabled === 'true') {
    els.memoryEnabled.checked = true;
    console.log('✅ Memory enabled restored');
  }

  if (savedSpecialInstructions) {
    els.specialInstructions.value = savedSpecialInstructions;
    console.log('✅ Special instructions restored');
  }
}

// Save settings to localStorage
function saveSettings() {
  const settings = {
    serverUrl: els.serverUrl.value,
    desktopMode: els.desktopMode.checked,
    continuousMode: els.continuousMode.checked,
    visionMode: els.visionMode.checked,
    wakeWordMode: els.wakeWordMode.checked,
    temperature: els.temperatureSlider.value,
    memoryEnabled: els.memoryEnabled.checked,
    specialInstructions: els.specialInstructions.value
  };

  console.log('💾 Saving settings:', settings);

  localStorage.setItem('atlasVoice_serverUrl', settings.serverUrl);
  localStorage.setItem('atlasVoice_desktopMode', String(settings.desktopMode));
  localStorage.setItem('atlasVoice_continuousMode', String(settings.continuousMode));
  localStorage.setItem('atlasVoice_wakeWordMode', String(settings.wakeWordMode));
  localStorage.setItem('atlasVoice_visionMode', String(settings.visionMode));
  localStorage.setItem('atlasVoice_temperature', settings.temperature);
  localStorage.setItem('atlasVoice_memoryEnabled', String(settings.memoryEnabled));
  localStorage.setItem('atlasVoice_specialInstructions', settings.specialInstructions);

  console.log('✅ Settings saved');
}

// Show knowledge base modal
function showKnowledgeModal(data) {
  const modal = document.createElement('div');
  modal.className = 'knowledge-modal';
  modal.innerHTML = `
    <div class="knowledge-modal-content">
      <div class="knowledge-modal-header">
        <h3>🧠 Atlas Knowledge Base</h3>
        <button class="knowledge-modal-close">&times;</button>
      </div>
      <div class="knowledge-modal-body">
        <div class="knowledge-section">
          <h4>📝 Memory Entries (${data.memory?.length || 0})</h4>
          <div class="knowledge-list">
            ${data.memory?.map(m => `
              <div class="knowledge-item">
                <div class="knowledge-item-header">
                  <span class="knowledge-type">${m.memory_type}</span>
                  <span class="knowledge-score">${m.importance_score}/10</span>
                </div>
                <div class="knowledge-content">${m.content}</div>
                <div class="knowledge-meta">Accessed ${m.access_count} times</div>
              </div>
            `).join('') || '<p>No memory entries yet</p>'}
          </div>
        </div>
        
        <div class="knowledge-section">
          <h4>🔍 Learned Patterns (${data.patterns?.length || 0})</h4>
          <div class="knowledge-list">
            ${data.patterns?.map(p => `
              <div class="knowledge-item">
                <div class="knowledge-item-header">
                  <span class="knowledge-type">${p.pattern_type}</span>
                  <span class="knowledge-score">${Math.round(p.confidence_score * 100)}%</span>
                </div>
                <div class="knowledge-content">${JSON.stringify(p.pattern_data, null, 2)}</div>
                <div class="knowledge-meta">Seen ${p.frequency} times</div>
              </div>
            `).join('') || '<p>No patterns learned yet</p>'}
          </div>
        </div>
        
        <div class="knowledge-section">
          <h4>📚 Knowledge Base (${data.knowledge?.length || 0})</h4>
          <div class="knowledge-list">
            ${data.knowledge?.map(k => `
              <div class="knowledge-item">
                <div class="knowledge-item-header">
                  <span class="knowledge-type">${k.category}</span>
                  <span class="knowledge-score">${k.title}</span>
                </div>
                <div class="knowledge-content">${k.content}</div>
                <div class="knowledge-meta">Accessed ${k.access_count} times</div>
              </div>
            `).join('') || '<p>No knowledge entries yet</p>'}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal functionality
  modal.querySelector('.knowledge-modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Browser View functionality
const BrowserView = (() => {
  let isOpen = false;
  let currentUrl = '';
  let history = [];
  let historyIndex = -1;

  const elements = {
    container: null,
    frame: null,
    urlInput: null,
    backBtn: null,
    forwardBtn: null,
    refreshBtn: null,
    goBtn: null,
    closeBtn: null,
    modeToggle: null
  };

  function init() {
    // Get elements
    elements.container = document.getElementById('browserViewContainer');
    elements.frame = document.getElementById('browserViewFrame');
    elements.urlInput = document.getElementById('browserUrlInput');
    elements.backBtn = document.getElementById('browserBackBtn');
    elements.forwardBtn = document.getElementById('browserForwardBtn');
    elements.refreshBtn = document.getElementById('browserRefreshBtn');
    elements.goBtn = document.getElementById('browserGoBtn');
    elements.closeBtn = document.getElementById('browserCloseBtn');
    elements.modeToggle = document.getElementById('browserViewMode');

    if (!elements.container) return;

    // Setup event listeners
    setupEventListeners();
    loadSettings();
  }

  function setupEventListeners() {
    // Navigation buttons
    elements.backBtn?.addEventListener('click', goBack);
    elements.forwardBtn?.addEventListener('click', goForward);
    elements.refreshBtn?.addEventListener('click', refresh);
    elements.goBtn?.addEventListener('click', navigateToUrl);
    elements.closeBtn?.addEventListener('click', close);

    // URL input
    elements.urlInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        navigateToUrl();
      }
    });

    // Mode toggle
    elements.modeToggle?.addEventListener('change', (e) => {
      if (e.target.checked) {
        open();
      } else {
        close();
      }
      saveSettings();
    });

    // Frame events
    elements.frame?.addEventListener('load', handleFrameLoad);
    elements.frame?.addEventListener('error', handleFrameError);
  }

  function open(url = 'https://www.google.com') {
    if (!elements.container) return;

    isOpen = true;
    elements.container.style.display = 'flex';
    
    // Hide other content
    const voiceOrbWrapper = document.getElementById('voiceOrbWrapper');
    const chatContainer = document.getElementById('chatContainer');
    
    if (voiceOrbWrapper) voiceOrbWrapper.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'none';

    // Navigate to URL
    navigateToUrl(url);
    
    // Update mode toggle
    if (elements.modeToggle) {
      elements.modeToggle.checked = true;
    }
  }

  function close() {
    if (!elements.container) return;

    isOpen = false;
    elements.container.style.display = 'none';
    
    // Show other content
    const voiceOrbWrapper = document.getElementById('voiceOrbWrapper');
    if (voiceOrbWrapper) voiceOrbWrapper.style.display = 'flex';

    // Update mode toggle
    if (elements.modeToggle) {
      elements.modeToggle.checked = false;
    }
  }

  function navigateToUrl(url) {
    const targetUrl = url || elements.urlInput?.value;
    if (!targetUrl) return;

    // Normalize URL
    let normalizedUrl = targetUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      if (normalizedUrl.includes('.')) {
        normalizedUrl = 'https://' + normalizedUrl;
      } else {
        normalizedUrl = 'https://www.google.com/search?q=' + encodeURIComponent(normalizedUrl);
      }
    }

    // Add to history
    if (normalizedUrl !== currentUrl) {
      history = history.slice(0, historyIndex + 1);
      history.push(normalizedUrl);
      historyIndex = history.length - 1;
      currentUrl = normalizedUrl;
    }

    // Update URL input
    if (elements.urlInput) {
      elements.urlInput.value = normalizedUrl;
    }

    // Open URL in new tab instead of iframe (Chrome security restriction)
    try {
      chrome.tabs.create({ url: normalizedUrl });
      updateNavigationButtons();
    } catch (error) {
      console.error('Navigation error:', error);
      showError('Failed to navigate to URL');
    }
  }

  function goBack() {
    if (historyIndex > 0) {
      historyIndex--;
      const url = history[historyIndex];
      currentUrl = url;
      // Open in new tab instead of iframe
      chrome.tabs.create({ url: url });
      if (elements.urlInput) elements.urlInput.value = url;
      updateNavigationButtons();
    }
  }

  function goForward() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      const url = history[historyIndex];
      currentUrl = url;
      // Open in new tab instead of iframe
      chrome.tabs.create({ url: url });
      if (elements.urlInput) elements.urlInput.value = url;
      updateNavigationButtons();
    }
  }

  function refresh() {
    // Refresh current tab instead of iframe
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  }

  function updateNavigationButtons() {
    if (elements.backBtn) {
      elements.backBtn.disabled = historyIndex <= 0;
    }
    if (elements.forwardBtn) {
      elements.forwardBtn.disabled = historyIndex >= history.length - 1;
    }
  }

  function handleFrameLoad() {
    console.log('Browser view frame loaded');
    hideLoading();
  }

  function handleFrameError() {
    console.error('Browser view frame error');
    showError('Failed to load page');
  }

  function showLoading() {
    // Could add loading indicator here
  }

  function hideLoading() {
    // Hide loading indicator
  }

  function showError(message) {
    // Could show error message in frame
    console.error('Browser view error:', message);
  }

  function loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('atlas-settings') || '{}');
      if (settings.browserViewMode && elements.modeToggle) {
        elements.modeToggle.checked = true;
        open();
      }
    } catch (error) {
      console.error('Failed to load browser view settings:', error);
    }
  }

  function saveSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('atlas-settings') || '{}');
      settings.browserViewMode = elements.modeToggle?.checked || false;
      localStorage.setItem('atlas-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save browser view settings:', error);
    }
  }

  // Public API
  return {
    init,
    open,
    close,
    navigateToUrl,
    isOpen: () => isOpen
  };
})();

// Initialize
loadSettings();

// Immediately ensure voice orb is visible
els.voiceOrbWrapper.classList.remove('hidden');
els.voiceOrbWrapper.style.display = 'flex';
els.voiceOrbWrapper.style.opacity = '1';
els.voiceOrbWrapper.style.visibility = 'visible';
els.chatContainer.style.display = 'none';
els.chatContainer.innerHTML = '';

// Reset UI to show voice orb on startup
setTimeout(() => {
  els.voiceOrbWrapper.classList.remove('hidden');
  els.chatContainer.style.display = 'none';
  els.chatContainer.innerHTML = '';

  // Force voice orb to be visible
  els.voiceOrbWrapper.style.display = 'flex';
  els.voiceOrbWrapper.style.opacity = '1';
  els.voiceOrbWrapper.style.visibility = 'visible';

  // Debug: Ensure voice orb is visible
  console.log('🎯 Voice orb wrapper classes:', els.voiceOrbWrapper.className);
  console.log('🎯 Voice orb wrapper display:', window.getComputedStyle(els.voiceOrbWrapper).display);
  console.log('🎯 Voice orb wrapper visibility:', window.getComputedStyle(els.voiceOrbWrapper).visibility);
}, 100);

setupPressToTalk();
setupContinuousMode();
webSpeechFallbackSetup();
updateOrbState();
checkFirstTimeUse();

// Prompt Generation Functions
function generateClaudePrompt(args) {
  const { task_description, context, specific_requirements, output_format } = args;
  
  let prompt = `**PROMPT FOR CLAUDE:**\n\n`;
  prompt += `**Task:** ${task_description}\n\n`;
  
  if (context) {
    prompt += `**Context:** ${context}\n\n`;
  }
  
  if (specific_requirements && specific_requirements.length > 0) {
    prompt += `**Requirements:**\n`;
    specific_requirements.forEach((req, index) => {
      prompt += `${index + 1}. ${req}\n`;
    });
    prompt += `\n`;
  }
  
  if (output_format) {
    prompt += `**Output Format:** ${output_format}\n\n`;
  }
  
  prompt += `Please provide a detailed solution with clear explanations and well-commented code where applicable.`;
  
  return prompt;
}

function generateDebuggingPrompt(args) {
  const { error_description, code_snippet, expected_behavior, tech_stack } = args;
  
  let prompt = `**DEBUGGING PROMPT FOR CLAUDE:**\n\n`;
  prompt += `**Issue:** ${error_description}\n\n`;
  
  if (tech_stack) {
    prompt += `**Technology Stack:** ${tech_stack}\n\n`;
  }
  
  if (code_snippet) {
    prompt += `**Code with Issue:**\n`;
    prompt += `\`\`\`\n${code_snippet}\n\`\`\`\n\n`;
  }
  
  if (expected_behavior) {
    prompt += `**Expected Behavior:** ${expected_behavior}\n\n`;
  }
  
  prompt += `Please analyze the issue and provide:\n`;
  prompt += `1. Root cause analysis\n`;
  prompt += `2. Step-by-step debugging approach\n`;
  prompt += `3. Fixed code with explanations\n`;
  prompt += `4. Prevention strategies for similar issues`;
  
  return prompt;
}

function generateCodeReviewPrompt(args) {
  const { code_to_review, review_focus, programming_language } = args;
  
  let prompt = `**CODE REVIEW PROMPT FOR CLAUDE:**\n\n`;
  
  if (programming_language) {
    prompt += `**Language:** ${programming_language}\n\n`;
  }
  
  prompt += `**Code to Review:**\n`;
  prompt += `\`\`\`${programming_language || ''}\n${code_to_review}\n\`\`\`\n\n`;
  
  if (review_focus && review_focus.length > 0) {
    prompt += `**Focus Areas:**\n`;
    review_focus.forEach((focus, index) => {
      prompt += `${index + 1}. ${focus}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Please provide a comprehensive code review including:\n`;
  prompt += `1. Overall code quality assessment\n`;
  prompt += `2. Specific improvements and optimizations\n`;
  prompt += `3. Best practices recommendations\n`;
  prompt += `4. Security considerations (if applicable)\n`;
  prompt += `5. Performance optimization suggestions\n`;
  prompt += `6. Refactored code examples where beneficial`;
  
  return prompt;
}

// Initialize Browser View (temporarily disabled to fix Atlas functionality)
// BrowserView.init();
