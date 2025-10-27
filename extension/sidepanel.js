/**
 * Side panel client: WebRTC to OpenAI Realtime with fallback to Web Speech.
 * Notes:
 * - In GA, OpenAI commonly uses /v1/realtime/calls for WebRTC SDP exchange.
 * - Get an ephemeral key from your server first; never ship your real API key.
 */
const els = {
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  status: document.getElementById('status'),
  pttBtn: document.getElementById('pttBtn'),
  interruptBtn: document.getElementById('interruptBtn'),
  youText: document.getElementById('youText'),
  aiText: document.getElementById('aiText'),
  voiceSelect: document.getElementById('voiceSelect'),
  recStart: document.getElementById('recStart'),
  recStop: document.getElementById('recStop'),
  ttsSay: document.getElementById('ttsSay')
};

let pc, micStream, dataChannel, remoteAudioEl, connected = false;

async function getEphemeralToken(serverBase) {
  const r = await fetch(`${serverBase}/api/ephemeral`);
  if (!r.ok) throw new Error('Failed to get ephemeral key');
  return r.json(); // { client_secret, model, endpoint }
}

async function ensureMic() {
  if (micStream) return micStream;
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      // Helpful for debugging textual events if enabled from server
      // console.log('DC message', e.data);
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
    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    connected = true;
    els.status.textContent = `connected (${model})`;
    els.interruptBtn.disabled = false;
  } catch (err) {
    console.error(err);
    els.status.textContent = `error: ${err.message}`;
    connected = false;
  }
}

function teardown() {
  if (dataChannel) dataChannel.close();
  if (pc) pc.close();
  dataChannel = undefined; pc = undefined; connected = false;
  els.status.textContent = 'disconnected';
  els.interruptBtn.disabled = true;
}

function pressToTalkSetup() {
  let mediaSender;
  els.pttBtn.addEventListener('mousedown', async () => {
    els.pttBtn.classList.add('active');
    if (!connected) return;
    // Unmute local mic track(s)
    for (const t of micStream.getAudioTracks()) t.enabled = true;
  });
  ['mouseup','mouseleave','touchend','touchcancel'].forEach(evt => {
    els.pttBtn.addEventListener(evt, () => {
      els.pttBtn.classList.remove('active');
      if (!connected) return;
      // Optional: you can send a turn-ending hint over DataChannel if your server enables it.
      // dataChannel?.send(JSON.stringify({ type: 'input_audio.end' }));
      for (const t of micStream.getAudioTracks()) t.enabled = false;
    });
  });
}

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
      await navigator.mediaDevices.getUserMedia({ audio: true }); // nudge permission
      rec?.start();
    } catch {}
  });
  els.recStop.addEventListener('click', () => rec?.stop());

  // TTS
  function populateVoices() {
    const voices = speechSynthesis.getVoices();
    els.voiceSelect.innerHTML = voices.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join('');
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
  if (!connected) await connectRealtime(); else teardown();
});
pressToTalkSetup();
webSpeechFallbackSetup();

// Example hooks to display text (if you additionally stream transcripts over DC):
// function setUserText(t) { els.youText.textContent = t; }
// function setAiText(t) { els.aiText.textContent = t; }

// Interrupt button sends a cancel event (if your server relays it)
els.interruptBtn.addEventListener('click', () => {
  try { dataChannel?.send(JSON.stringify({ type: 'response.cancel' })); } catch {}
});
