/**
 * Side panel client: WebRTC to OpenAI Realtime with fallback to Web Speech.
 * Supports both press-to-talk and continuous conversation modes.
 */
const els = {
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  status: document.getElementById('status'),
  pttBtn: document.getElementById('pttBtn'),
  toggleBtn: document.getElementById('toggleBtn'),
  interruptBtn: document.getElementById('interruptBtn'),
  continuousMode: document.getElementById('continuousMode'),
  youText: document.getElementById('youText'),
  aiText: document.getElementById('aiText'),
  voiceSelect: document.getElementById('voiceSelect'),
  recStart: document.getElementById('recStart'),
  recStop: document.getElementById('recStop'),
  ttsSay: document.getElementById('ttsSay')
};

let pc, micStream, dataChannel, remoteAudioEl, connected = false;
let isListening = false;

async function getEphemeralToken(serverBase) {
  const r = await fetch(`${serverBase}/api/ephemeral`);
  if (!r.ok) throw new Error('Failed to get ephemeral key');
  return r.json(); // { client_secret, model, endpoint }
}

async function ensureMic() {
  if (micStream) return micStream;
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // Start with mic muted
  for (const t of micStream.getAudioTracks()) t.enabled = false;
  return micStream;
}

function createRemoteAudio() {
  if (remoteAudioEl) return remoteAudioEl;
  remoteAudioEl = document.createElement('audio');
  remoteAudioEl.autoplay = true;
  remoteAudioEl.playsInline = true;
  document.body.appendChild(remoteAudioEl);
  return remoteAudioEl;
}

async function connectRealtime() {
  try {
    els.status.textContent = 'connecting…';
    const { client_secret, model, endpoint } = await getEphemeralToken(els.serverUrl.value.trim());
    await ensureMic();

    pc = new RTCPeerConnection();
    // Local mic to PC
    for (const track of micStream.getTracks()) pc.addTrack(track, micStream);
    // Remote audio sink
    createRemoteAudio();
    pc.ontrack = (e) => { remoteAudioEl.srcObject = e.streams[0]; };

    // DataChannel for control (interrupts, messages)
    dataChannel = pc.createDataChannel("oai-events");
    dataChannel.onmessage = (e) => {
      // Handle server events if needed
      try {
        const msg = JSON.parse(e.data);
        console.log('Server message:', msg);

        // Update transcripts if available
        if (msg.type === 'conversation.item.input_audio_transcription.completed') {
          els.youText.textContent = msg.transcript || '';
        }
        if (msg.type === 'response.text.delta' || msg.type === 'response.text.done') {
          els.aiText.textContent += msg.delta || msg.text || '';
        }
      } catch (err) {
        console.log('DC message:', e.data);
      }
    };

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);

    // Exchange SDP with OpenAI
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
    els.status.textContent = `connected (${model})`;
    els.interruptBtn.disabled = false;
    els.pttBtn.disabled = false;
    els.toggleBtn.disabled = false;
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
  dataChannel = undefined;
  pc = undefined;
  connected = false;
  isListening = false;
  els.status.textContent = 'disconnected';
  els.interruptBtn.disabled = true;
  els.pttBtn.disabled = true;
  els.toggleBtn.disabled = true;
  els.pttBtn.classList.remove('active');
  els.toggleBtn.classList.remove('active');
}

function enableMic() {
  if (!connected || !micStream) return;
  for (const t of micStream.getAudioTracks()) t.enabled = true;
  isListening = true;
}

function disableMic() {
  if (!micStream) return;
  for (const t of micStream.getAudioTracks()) t.enabled = false;
  isListening = false;
}

// Press-to-Talk Mode
function pressToTalkSetup() {
  els.pttBtn.addEventListener('mousedown', () => {
    if (!connected) return;
    els.pttBtn.classList.add('active');
    enableMic();
  });

  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
    els.pttBtn.addEventListener(evt, () => {
      if (!connected) return;
      els.pttBtn.classList.remove('active');
      disableMic();
    });
  });
}

// Continuous Mode (Toggle)
function continuousModeSetup() {
  els.toggleBtn.addEventListener('click', () => {
    if (!connected) return;

    if (isListening) {
      // Stop listening
      els.toggleBtn.classList.remove('active');
      els.toggleBtn.textContent = 'Click to talk';
      disableMic();
    } else {
      // Start listening
      els.toggleBtn.classList.add('active');
      els.toggleBtn.innerHTML = '<img src="assets/mic.svg" alt="" /> Listening...';
      enableMic();
    }
  });
}

// Mode switching
els.continuousMode.addEventListener('change', () => {
  if (els.continuousMode.checked) {
    // Switch to continuous mode
    els.pttBtn.style.display = 'none';
    els.toggleBtn.style.display = 'inline-block';
    if (isListening) {
      disableMic();
      els.pttBtn.classList.remove('active');
    }
  } else {
    // Switch to press-to-talk mode
    els.pttBtn.style.display = 'inline-block';
    els.toggleBtn.style.display = 'none';
    if (isListening) {
      disableMic();
      els.toggleBtn.classList.remove('active');
    }
  }
});

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
      els.youText.textContent = txt;
    };
    rec.onend = () => {};
    rec.onerror = (e) => console.warn('STT error', e.error);
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
    const u = new SpeechSynthesisUtterance(els.aiText.textContent || 'No reply yet.');
    const v = speechSynthesis.getVoices().find(x => x.name === els.voiceSelect.value);
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

els.connectBtn.addEventListener('click', async () => {
  if (!connected) {
    await connectRealtime();
  } else {
    teardown();
    els.connectBtn.textContent = 'Connect';
  }

  if (connected) {
    els.connectBtn.textContent = 'Disconnect';
  }
});

// Interrupt button sends a cancel event
els.interruptBtn.addEventListener('click', () => {
  try {
    dataChannel?.send(JSON.stringify({ type: 'response.cancel' }));
    disableMic();
    els.pttBtn.classList.remove('active');
    els.toggleBtn.classList.remove('active');
    isListening = false;
  } catch (err) {
    console.error('Interrupt failed:', err);
  }
});

// Initialize
pressToTalkSetup();
continuousModeSetup();
webSpeechFallbackSetup();

// Disable buttons initially
els.pttBtn.disabled = true;
els.toggleBtn.disabled = true;
