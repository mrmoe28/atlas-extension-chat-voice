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
        ? `You are Atlas Voice, an AI assistant with desktop automation capabilities. You can help users control their computer through voice commands.

When users ask you to perform desktop tasks, respond naturally AND include a special command tag:

For opening folders: Say your response and include [CMD:OPEN_FOLDER:path/to/folder]
For creating files: Say your response and include [CMD:CREATE_FILE:path/to/file.txt]
For finding files: Say your response and include [CMD:FIND_FILE:filename]
For launching apps: Say your response and include [CMD:LAUNCH_APP:AppName]
For listing files: Say your response and include [CMD:LIST_FILES:directory/path]

Example:
User: "Can you open my Downloads folder?"
You: "Sure! I'll open your Downloads folder for you. [CMD:OPEN_FOLDER:~/Downloads]"

User: "Launch Chrome"
You: "Opening Google Chrome now. [CMD:LAUNCH_APP:Google Chrome]"

Be conversational and friendly while executing these commands.`
        : `You are Atlas Voice, a helpful AI assistant. Have natural conversations with users.`;

      // Send session update with instructions
      dataChannel.send(JSON.stringify({
        type: 'session.update',
        session: {
          instructions: instructions,
          voice: 'alloy',
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
      }));
    };

    dataChannel.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        console.log('Server event:', msg);

        if (msg.type === 'conversation.item.input_audio_transcription.completed') {
          if (msg.transcript && currentUserMessage !== msg.transcript) {
            currentUserMessage = msg.transcript;
            addMessage('user', msg.transcript);

            // Check for desktop commands if in desktop mode
            if (isDesktopMode) {
              const desktopCmd = parseDesktopCommand(msg.transcript);
              if (desktopCmd) {
                console.log('Desktop command detected:', desktopCmd);
                showTypingIndicator();
                const result = await executeDesktopCommand(desktopCmd);
                removeTypingIndicator();

                if (result.error) {
                  addMessage('assistant', `❌ Error: ${result.error}`);
                } else {
                  addMessage('assistant', `✅ ${result.message || 'Command executed successfully'}`);
                }
              }
            }
          }
        }

        if (msg.type === 'response.text.delta') {
          currentAIMessage += msg.delta || '';
        }

        if (msg.type === 'response.text.done' || msg.type === 'response.done') {
          if (currentAIMessage) {
            removeTypingIndicator();

            // Parse for desktop commands if in desktop mode
            let displayMessage = currentAIMessage;
            if (isDesktopMode) {
              const cmdMatch = currentAIMessage.match(/\[CMD:([A-Z_]+):(.+?)\]/);
              if (cmdMatch) {
                const [fullMatch, cmdType, cmdParam] = cmdMatch;
                displayMessage = currentAIMessage.replace(fullMatch, '').trim();

                // Execute the command
                const command = mapCommandType(cmdType, cmdParam);
                if (command) {
                  console.log('Executing desktop command:', command);
                  executeDesktopCommand(command).then(result => {
                    if (result.error) {
                      addMessage('assistant', `❌ Error: ${result.error}`);
                    } else {
                      addMessage('assistant', `✅ ${result.message || 'Command executed'}`);
                    }
                  });
                }
              }
            }

            addMessage('assistant', displayMessage);
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
      ? `You are Atlas Voice, an AI assistant with desktop automation capabilities. You can help users control their computer through voice commands.

When users ask you to perform desktop tasks, respond naturally AND include a special command tag:

For opening folders: Say your response and include [CMD:OPEN_FOLDER:path/to/folder]
For creating files: Say your response and include [CMD:CREATE_FILE:path/to/file.txt]
For finding files: Say your response and include [CMD:FIND_FILE:filename]
For launching apps: Say your response and include [CMD:LAUNCH_APP:AppName]
For listing files: Say your response and include [CMD:LIST_FILES:directory/path]

Example:
User: "Can you open my Downloads folder?"
You: "Sure! I'll open your Downloads folder for you. [CMD:OPEN_FOLDER:~/Downloads]"

User: "Launch Chrome"
You: "Opening Google Chrome now. [CMD:LAUNCH_APP:Google Chrome]"

Be conversational and friendly while executing these commands.`
      : `You are Atlas Voice, a helpful AI assistant. Have natural conversations with users.`;

    dataChannel.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: instructions
      }
    }));

    console.log('Updated session instructions:', isDesktopMode ? 'Desktop Commander enabled' : 'Standard mode');
  }
});

// Map command type from AI response to API format
function mapCommandType(cmdType, param) {
  const commandMap = {
    'OPEN_FOLDER': { type: 'openFolder', param },
    'CREATE_FILE': { type: 'createFile', param },
    'FIND_FILE': { type: 'findFile', param },
    'LAUNCH_APP': { type: 'runApp', param },
    'LIST_FILES': { type: 'listFiles', param }
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

// Execute desktop command via server
async function executeDesktopCommand(command) {
  try {
    const response = await fetch(`${els.serverUrl.value.trim()}/api/desktop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });

    if (!response.ok) {
      throw new Error(`Command failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
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

// Initialize
setupPressToTalk();
setupContinuousMode();
webSpeechFallbackSetup();
updateOrbState();
checkFirstTimeUse();
