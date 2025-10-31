/**
 * AI Connector - Handles connections to AI services (OpenAI, Groq)
 */

export class AIConnector {
  constructor(els, state, updateOrbState, addMessage) {
    this.els = els;
    this.state = state;
    this.updateOrbState = updateOrbState;
    this.addMessage = addMessage;
    this.pc = null;
    this.dataChannel = null;
    this.remoteAudioEl = null;
    this.micStream = null;
  }

  async getEphemeralToken(serverBase) {
    // Check if user has provided a local API key
    const localApiKey = this.els.apiKey.value.trim();

    if (localApiKey) {
      console.log('🔑 Using local API key');
      return {
        client_secret: localApiKey,
        model: 'gpt-4o-realtime-preview-2024-12-17',
        endpoint: 'https://api.openai.com/v1/realtime'
      };
    }

    // Fall back to server endpoint if no local key
    if (!serverBase) {
      throw new Error('Please provide either an API key or server URL');
    }

    console.log('🔑 Fetching credentials from server');
    const r = await fetch(`${serverBase}/api/ephemeral`);
    if (!r.ok) throw new Error('Failed to get ephemeral key');
    return r.json();
  }

  async ensureMic() {
    if (this.micStream) return this.micStream;
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const t of this.micStream.getAudioTracks()) t.enabled = false;
    return this.micStream;
  }

  createRemoteAudio() {
    if (this.remoteAudioEl) return this.remoteAudioEl;
    this.remoteAudioEl = document.createElement('audio');
    this.remoteAudioEl.autoplay = true;
    this.remoteAudioEl.playsInline = true;
    this.remoteAudioEl.muted = false; // NEVER mute Atlas's voice output
    this.remoteAudioEl.volume = 1.0; // Full volume
    document.body.appendChild(this.remoteAudioEl);

    console.log('🔊 Created remote audio element:', {
      autoplay: this.remoteAudioEl.autoplay,
      muted: this.remoteAudioEl.muted,
      volume: this.remoteAudioEl.volume
    });

    this.remoteAudioEl.onplay = () => {
      console.log('🔊 Audio playback started');
      this.state.isSpeaking = true;
      this.updateOrbState();
    };

    this.remoteAudioEl.onpause = () => {
      console.log('⏸️ Audio playback paused');
      this.state.isSpeaking = false;
      this.updateOrbState();
    };

    this.remoteAudioEl.onended = () => {
      console.log('✅ Audio playback ended');
      this.state.isSpeaking = false;
      this.updateOrbState();
    };

    this.remoteAudioEl.onerror = (err) => {
      console.error('❌ Audio element error:', err);
    };

    return this.remoteAudioEl;
  }

  // Placeholder for OpenAI realtime connection setup
  async connectOpenAI() {
    // This would contain the full WebRTC setup for OpenAI realtime
    console.log('🔗 Connecting to OpenAI realtime...');
    // Implementation would go here
  }

  disconnect() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.state.connected = false;
  }
}