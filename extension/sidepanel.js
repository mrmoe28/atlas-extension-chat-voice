/**
 * Atlas Voice - Minimal Interface with Hamburger Menu
 */

const els = {
  menuBtn: document.getElementById('menuBtn'),
  settingsDropdown: document.getElementById('settingsDropdown'),
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  statusDot: document.getElementById('statusDot'),
  voiceBtn: document.getElementById('voiceBtn'),
  voiceStatus: document.getElementById('voiceStatus'),
  interruptBtn: document.getElementById('interruptBtn'),
  continuousMode: document.getElementById('continuousMode'),
  desktopMode: document.getElementById('desktopMode'),
  visionMode: document.getElementById('visionMode'),
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
  skipPermissionBtn: document.getElementById('skipPermissionBtn')
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

// Hamburger menu toggle
els.menuBtn.addEventListener('click', () => {
  els.settingsDropdown.classList.toggle('open');
  els.menuBtn.classList.toggle('active');
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

function addMessage(role, content) {
  if (!content || content.trim() === '') return;

  // Hide orb, show chat
  els.voiceOrbWrapper.classList.add('hidden');
  els.chatContainer.style.display = 'flex';

  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'AI';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  contentEl.textContent = content;

  messageEl.appendChild(avatar);
  messageEl.appendChild(contentEl);

  els.chatContainer.appendChild(messageEl);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
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
    els.orbStatus.textContent = 'Connecting...';
    const { client_secret, model, endpoint } = await getEphemeralToken(els.serverUrl.value.trim());
    await ensureMic();

    pc = new RTCPeerConnection();
    for (const track of micStream.getTracks()) pc.addTrack(track, micStream);

    createRemoteAudio();
    pc.ontrack = (e) => { remoteAudioEl.srcObject = e.streams[0]; };

    dataChannel = pc.createDataChannel("oai-events");

    dataChannel.onopen = () => {
      console.log('Data channel opened');

      // Configure session with desktop commander instructions if enabled
      const instructions = isDesktopMode
        ? `You are Atlas Voice. ULTRA CONCISE responses only.

Commands - say just 2 words:
"Opening Downloads. [CMD:OPEN_FOLDER:~/Downloads]"
"Launching Chrome. [CMD:LAUNCH_APP:Chrome]"
"Creating file. [CMD:CREATE_FILE:test.txt]"
"Opening website. [CMD:OPEN_URL:google.com]"

Examples:
User: "Open my downloads folder"
You: "Opening Downloads. [CMD:OPEN_FOLDER:~/Downloads]"

User: "Launch Chrome"
You: "Launching Chrome. [CMD:LAUNCH_APP:Chrome]"

User: "Open Google"
You: "Opening website. [CMD:OPEN_URL:google.com]"

User: "Go to YouTube"
You: "Opening website. [CMD:OPEN_URL:youtube.com]"

User: "What's the weather?"
You: "Can't check weather."

MAX 3 words per response.`
        : `You are Atlas Voice. Keep responses under 5 words.`;

      // Define tools for function calling
      const tools = isDesktopMode ? [
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
        }
      ] : [];

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
            if (functionName === 'open_webpage') {
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
  els.voiceBtn.addEventListener('mousedown', () => {
    if (!connected || isContinuousMode) return;
    enableMic();
  });

  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
    els.voiceBtn.addEventListener(evt, () => {
      if (!connected || isContinuousMode) return;
      disableMic();
    });
  });
}

// Continuous Mode (Toggle)
function setupContinuousMode() {
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
"Opening website. [CMD:OPEN_URL:google.com]"

Examples:
User: "Open my downloads folder"
You: "Opening Downloads. [CMD:OPEN_FOLDER:~/Downloads]"

User: "Launch Chrome"
You: "Launching Chrome. [CMD:LAUNCH_APP:Chrome]"

User: "Open Google"
You: "Opening website. [CMD:OPEN_URL:google.com]"

User: "Go to YouTube"
You: "Opening website. [CMD:OPEN_URL:youtube.com]"

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

// Map command type from AI response to API format
function mapCommandType(cmdType, param) {
  const commandMap = {
    'OPEN_FOLDER': { type: 'openFolder', param },
    'CREATE_FILE': { type: 'createFile', param },
    'FIND_FILE': { type: 'findFile', param },
    'LAUNCH_APP': { type: 'runApp', param },
    'LIST_FILES': { type: 'listFiles', param },
    'OPEN_URL': { type: 'openUrl', param }
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

      default:
        return { error: 'Unknown command' };
    }
  } catch (err) {
    console.error('Desktop command error:', err);
    return { error: err.message };
  }
}

// Connection button
els.connectBtn.addEventListener('click', async () => {
  if (!connected) {
    await connectRealtime();
    // Close menu after connecting
    els.settingsDropdown.classList.remove('open');
    els.menuBtn.classList.remove('active');
  } else {
    teardown();
  }
});

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

  if (!hasSeenModal) {
    // Show the modal on first use
    els.permissionModal.classList.add('show');
  }
}

els.requestPermissionBtn.addEventListener('click', async () => {
  try {
    // Request microphone permission
    await navigator.mediaDevices.getUserMedia({ audio: true });

    // Mark as seen
    localStorage.setItem('atlasVoice_hasSeenPermissionModal', 'true');

    // Hide modal
    els.permissionModal.classList.remove('show');

    // Update status
    els.orbStatus.textContent = 'Microphone access granted! Click Connect in menu to start';
  } catch (err) {
    console.error('Permission denied:', err);
    els.orbStatus.textContent = 'Microphone permission denied. Please enable in browser settings';

    // Still mark as seen so it doesn't show every time
    localStorage.setItem('atlasVoice_hasSeenPermissionModal', 'true');
    els.permissionModal.classList.remove('show');
  }
});

els.skipPermissionBtn.addEventListener('click', () => {
  // Mark as seen
  localStorage.setItem('atlasVoice_hasSeenPermissionModal', 'true');

  // Hide modal
  els.permissionModal.classList.remove('show');

  // Update status
  els.orbStatus.textContent = 'Click Connect in menu to start (microphone permission needed)';
});

// Load saved settings from localStorage
function loadSettings() {
  console.log('💾 Loading saved settings...');
  const savedServerUrl = localStorage.getItem('atlasVoice_serverUrl');
  const savedDesktopMode = localStorage.getItem('atlasVoice_desktopMode');
  const savedContinuousMode = localStorage.getItem('atlasVoice_continuousMode');
  const savedVisionMode = localStorage.getItem('atlasVoice_visionMode');

  console.log('Settings:', { savedServerUrl, savedDesktopMode, savedContinuousMode, savedVisionMode });

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
}

// Save settings to localStorage
function saveSettings() {
  const settings = {
    serverUrl: els.serverUrl.value,
    desktopMode: els.desktopMode.checked,
    continuousMode: els.continuousMode.checked,
    visionMode: els.visionMode.checked
  };

  console.log('💾 Saving settings:', settings);

  localStorage.setItem('atlasVoice_serverUrl', settings.serverUrl);
  localStorage.setItem('atlasVoice_desktopMode', String(settings.desktopMode));
  localStorage.setItem('atlasVoice_continuousMode', String(settings.continuousMode));
  localStorage.setItem('atlasVoice_visionMode', String(settings.visionMode));

  console.log('✅ Settings saved');
}

// Initialize
loadSettings();
setupPressToTalk();
setupContinuousMode();
webSpeechFallbackSetup();
updateOrbState();
checkFirstTimeUse();
