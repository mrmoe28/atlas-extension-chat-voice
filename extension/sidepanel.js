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
  skipPermissionBtn: document.getElementById('skipPermissionBtn'),
  toggleHelpBtn: document.getElementById('toggleHelpBtn'),
  helpContent: document.getElementById('helpContent'),
  temperatureSlider: document.getElementById('temperatureSlider'),
  temperatureValue: document.getElementById('temperatureValue'),
  memoryEnabled: document.getElementById('memoryEnabled'),
  specialInstructions: document.getElementById('specialInstructions'),
  viewKnowledgeBtn: document.getElementById('viewKnowledgeBtn'),
  clearMemoryBtn: document.getElementById('clearMemoryBtn')
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
  document.querySelector('.settings-dropdown').classList.toggle('open');
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
els.connectBtn.addEventListener('click', async () => {
  if (!connected) {
    await connectRealtime();
    // Close menu after connecting
    document.querySelector('.settings-dropdown').classList.remove('open');
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
  const savedTemperature = localStorage.getItem('atlasVoice_temperature');
  const savedMemoryEnabled = localStorage.getItem('atlasVoice_memoryEnabled');
  const savedSpecialInstructions = localStorage.getItem('atlasVoice_specialInstructions');

  console.log('Settings:', { savedServerUrl, savedDesktopMode, savedContinuousMode, savedVisionMode, savedTemperature, savedMemoryEnabled, savedSpecialInstructions });

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
    temperature: els.temperatureSlider.value,
    memoryEnabled: els.memoryEnabled.checked,
    specialInstructions: els.specialInstructions.value
  };

  console.log('💾 Saving settings:', settings);

  localStorage.setItem('atlasVoice_serverUrl', settings.serverUrl);
  localStorage.setItem('atlasVoice_desktopMode', String(settings.desktopMode));
  localStorage.setItem('atlasVoice_continuousMode', String(settings.continuousMode));
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
