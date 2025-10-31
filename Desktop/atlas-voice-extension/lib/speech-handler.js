import { ErrorHandler } from "./error-handler.js";
/**
 * Speech Handler - Manages speech recognition and text-to-speech
 */

let browserRecognition = null;
let browserSynthesis = window.speechSynthesis;

export class SpeechHandler {
  constructor(els, state, addMessage, updateOrbState) {
    this.els = els;
    this.state = state;
    this.addMessage = addMessage;
    this.updateOrbState = updateOrbState;
  }

  initBrowserSpeech() {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('❌ Browser Speech Recognition not supported');
      this.els.voiceStatus.textContent = 'Speech recognition not supported in this browser';
      return false;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    browserRecognition = new SpeechRecognition();

    browserRecognition.continuous = true;
    browserRecognition.interimResults = true;
    browserRecognition.lang = 'en-US';
    browserRecognition.maxAlternatives = 1;

    let finalTranscript = '';
    let interimTranscript = '';

    browserRecognition.onstart = () => {
      console.log('🎤 Browser speech recognition started');
      this.state.isListening = true;
      this.updateOrbState();
      this.els.voiceStatus.textContent = 'Listening...';
    };

    browserRecognition.onresult = (event) => {
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          console.log('🎤 Final transcript:', transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results in UI
      if (interimTranscript) {
        this.els.voiceStatus.textContent = `Hearing: "${interimTranscript}"`;
      }

      // Send to Groq when we have final transcript
      if (finalTranscript.trim()) {
        this.sendToGroq(finalTranscript.trim());
        finalTranscript = '';
      }
    };

    browserRecognition.onerror = (event) => {
      // "no-speech" is a common occurrence, not an error
      if (event.error === 'no-speech') {
        console.log('ℹ️ No speech detected (silence or background noise)');
        this.els.voiceStatus.textContent = 'No speech detected';
      } else if (event.error === 'aborted') {
        console.log('ℹ️ Speech recognition aborted');
        this.els.voiceStatus.textContent = 'Recognition aborted';
      } else {
        console.error('❌ Speech recognition error:', event.error);
        this.els.voiceStatus.textContent = `Error: ${event.error}`;
      }

      this.state.isListening = false;
      this.updateOrbState();
    };

    browserRecognition.onend = () => {
      console.log('🎤 Browser speech recognition ended');
      this.state.isListening = false;
      this.updateOrbState();

      // Auto-restart in continuous mode
      if (this.state.isContinuousMode && this.state.connected) {
        setTimeout(() => {
          if (this.state.connected && !this.state.isMuted) {
            browserRecognition.start();
          }
        }, 100);
      }
    };

    return true;
  }

  async sendToGroq(message) {
    try {
      console.log('📤 Sending to Groq:', message);

      // Get server URL from settings
      const serverUrl = this.els.serverUrl.value.trim();
      if (!serverUrl) {
        throw new Error('Server URL not configured. Please set it in Settings.');
      }

      this.els.voiceStatus.textContent = 'Thinking...';
      this.state.isSpeaking = true;
      this.updateOrbState();

      // Add user message to chat
      this.addMessage('user', message);

      // Add to conversation history
      this.state.conversationHistory.push({
        role: 'user',
        content: message
      });

      // Keep only last 10 messages for context
      if (this.state.conversationHistory.length > 10) {
        this.state.conversationHistory = this.state.conversationHistory.slice(-10);
      }

      const response = await ErrorHandler.withRetry(() => fetch(`${serverUrl}/api/groq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: this.state.conversationHistory.slice(0, -1) // Exclude current message
        })
      }));

      if (!response.ok) {
        throw new Error(`Groq API failed: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.message;

      console.log('✅ Groq response:', assistantMessage);

      // Add assistant response to chat
      this.addMessage('assistant', assistantMessage);

      // Add to conversation history
      this.state.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Speak the response using browser TTS
      this.speakText(assistantMessage);

    } catch (error) {
      console.error('❌ Groq error:', error);
      this.els.voiceStatus.textContent = 'Error processing request';
      this.state.isSpeaking = false;
      this.updateOrbState();

      this.addMessage('system', `Error: ${error.message}`);
    }
  }

  async speakText(text) {
    const selectedVoiceName = this.els.voiceSelect.value;

    // Check if Piper voice is selected
    if (selectedVoiceName && selectedVoiceName.startsWith('piper:')) {
      await this.speakWithPiper(text, selectedVoiceName);
      return;
    }

    // If "browser" fallback is selected or no Piper voice available, use browser TTS
    if (selectedVoiceName === 'browser' || selectedVoiceName === '' || !selectedVoiceName.startsWith('piper:')) {
      if (!browserSynthesis) {
        console.log('ℹ️ Speech synthesis not available');
        this.state.isSpeaking = false;
        this.updateOrbState();
        return;
      }

      // Cancel any ongoing speech
      browserSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        console.log('🔊 Speaking with browser voice...');
        this.state.isSpeaking = true;
        this.updateOrbState();
        this.els.voiceStatus.textContent = 'Speaking...';
      };

      utterance.onend = () => {
        console.log('✅ Speech complete');
        this.state.isSpeaking = false;
        this.updateOrbState();
        this.els.voiceStatus.textContent = this.state.connected ? 'Hold to talk' : 'Disconnected';
      };

      utterance.onerror = (event) => {
        console.log('ℹ️ Speech synthesis error:', event.error);
        this.state.isSpeaking = false;
        this.updateOrbState();
      };

      browserSynthesis.speak(utterance);
    }
  }

  async speakWithPiper(text, voiceValue) {
    try {
      // Extract voice name from "piper:voicename"
      const voiceName = voiceValue.replace('piper:', '');
      console.log('🎙️ Using Piper TTS voice:', voiceName);

      // Update UI
      this.state.isSpeaking = true;
      this.updateOrbState();
      this.els.voiceStatus.textContent = 'Generating speech...';

      // Get server URL
      const serverUrl = this.els.serverUrl.value.trim();
      if (!serverUrl) {
        throw new Error('Server URL not configured');
      }

      // Call Piper TTS API
      const response = await ErrorHandler.withRetry(() => fetch(`${serverUrl}/api/piper/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceName })
      }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'TTS generation failed');
      }

      const data = await response.json();
      console.log(`✅ Piper TTS audio generated: ${data.size} bytes`);

      // Convert base64 to audio blob
      const audioData = atob(data.audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      const audio = new Audio(audioUrl);

      audio.onplay = () => {
        console.log('🔊 Playing Piper TTS audio...');
        this.els.voiceStatus.textContent = 'Speaking...';
      };

      audio.onended = () => {
        console.log('✅ Piper TTS playback complete');
        this.state.isSpeaking = false;
        this.updateOrbState();
        this.els.voiceStatus.textContent = this.state.connected ? 'Hold to talk' : 'Disconnected';
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        this.state.isSpeaking = false;
        this.updateOrbState();
        this.els.voiceStatus.textContent = 'Playback error';
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      // Log error silently without showing to user
      console.log('ℹ️ Piper TTS not available:', error.message);
      this.state.isSpeaking = false;
      this.updateOrbState();
      this.els.voiceStatus.textContent = this.state.connected ? 'Hold to talk' : 'Disconnected';

      // No fallback - Piper voices only. If unavailable, just don't speak.
    }
  }

  stopBrowserSpeech() {
    if (browserRecognition) {
      browserRecognition.stop();
    }
  }

  startRecognition() {
    if (browserRecognition && !this.state.isListening) {
      browserRecognition.start();
    }
  }
}