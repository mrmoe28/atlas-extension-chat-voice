/**
 * Atlas Voice - Chat Interface with Animated Voice Orb
 */

const els = {
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  status: document.getElementById('status'),
  statusDot: document.getElementById('statusDot'),
  voiceBtn: document.getElementById('voiceBtn'),
  voiceBtnText: document.getElementById('voiceBtnText'),
  interruptBtn: document.getElementById('interruptBtn'),
  continuousMode: document.getElementById('continuousMode'),
  chatContainer: document.getElementById('chatContainer'),
  voiceOrb: document.getElementById('voiceOrb'),
  welcomeMessage: document.querySelector('.welcome-message'),
  voiceSelect: document.getElementById('voiceSelect'),
  recStart: document.getElementById('recStart'),
  recStop: document.getElementById('recStop'),
  ttsSay: document.getElementById('ttsSay')
};

let pc, micStream, dataChannel, remoteAudioEl, connected = false;
let isListening = false;
let isSpeaking = false;
let isContinuousMode = false;
let currentUserMessage = '';
let currentAIMessage = '';

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

  // Detect when AI is speaking
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
  } else if (isListening) {
    els.voiceOrb.classList.add('listening');
  }
}

function addMessage(role, content) {
  if (!content || content.trim() === '') return;

  // Hide welcome message
  els.welcomeMessage.classList.add('hidden');

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
    els.status.textContent = 'connecting…';
    const { client_secret, model, endpoint } = await getEphemeralToken(els.serverUrl.value.trim());
    await ensureMic();

    pc = new RTCPeerConnection();
    for (const track of micStream.getTracks()) pc.addTrack(track, micStream);

    createRemoteAudio();
    pc.ontrack = (e) => { remoteAudioEl.srcObject = e.streams[0]; };

    dataChannel = pc.createDataChannel("oai-events");
    dataChannel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        console.log('Server event:', msg);

        // Handle different event types
        if (msg.type === 'conversation.item.input_audio_transcription.completed') {
          if (msg.transcript && currentUserMessage !== msg.transcript) {
            currentUserMessage = msg.transcript;
            addMessage('user', msg.transcript);
          }
        }

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

    const sdpResponse = await fetch(endpoint, {
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
    els.status.textContent = 'connected';
    els.statusDot.classList.add('connected');
    els.interruptBtn.disabled = false;
    els.voiceBtn.disabled = false;
    els.connectBtn.textContent = 'Disconnect';
    els.connectBtn.classList.add('connected');
  } catch (err) {
    console.error(err);
    els.status.textContent = `error: ${err.message}`;
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

  els.status.textContent = 'disconnected';
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
  updateOrbState();
}

function disableMic() {
  if (!micStream) return;
  for (const t of micStream.getAudioTracks()) t.enabled = false;
  isListening = false;
  els.voiceBtn.classList.remove('active');
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
      els.voiceBtnText.textContent = 'Click to talk';
    } else {
      enableMic();
      els.voiceBtnText.textContent = 'Listening...';
    }
  });
}

// Mode switching
els.continuousMode.addEventListener('change', () => {
  isContinuousMode = els.continuousMode.checked;

  if (isListening) {
    disableMic();
  }

  if (isContinuousMode) {
    els.voiceBtnText.textContent = 'Click to talk';
  } else {
    els.voiceBtnText.textContent = 'Hold to talk';
  }
});

// Connection button
els.connectBtn.addEventListener('click', async () => {
  if (!connected) {
    await connectRealtime();
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

// Initialize
setupPressToTalk();
setupContinuousMode();
webSpeechFallbackSetup();
updateOrbState();
