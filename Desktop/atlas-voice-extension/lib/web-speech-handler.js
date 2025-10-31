/**
 * Web Speech API Handler
 * Handles browser-native speech recognition and synthesis
 */

export class WebSpeechHandler {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.selectedVoice = null;
  }

  /**
   * Initialize speech recognition
   */
  initialize(options = {}) {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    // Best practice: Set continuous to true for auto-listening mode
    this.recognition.continuous = options.continuous !== undefined ? options.continuous : true;
    this.recognition.interimResults = true; // Get partial results
    // Best practice: Set language explicitly
    this.recognition.lang = options.lang || 'en-US';
    this.recognition.maxAlternatives = 1;

    // Handle speech recognition results
    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];

      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        console.log('🎤 Final transcript:', transcript);

        if (this.onResultCallback) {
          this.onResultCallback(transcript, true);
        }
      } else {
        // Interim result
        const transcript = lastResult[0].transcript;
        if (this.onResultCallback) {
          this.onResultCallback(transcript, false);
        }
      }
    };

    // Handle recognition start
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Speech recognition started');
      if (this.onStartCallback) this.onStartCallback();
    };

    // Handle recognition end
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Speech recognition ended');
      if (this.onEndCallback) this.onEndCallback();
    };

    // Handle errors - Best practice: restart on error for continuous mode
    this.recognition.onerror = (event) => {
      console.error('🎤 Speech recognition error:', event.error);
      this.isListening = false;

      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    // Handle no match - Best practice: trigger callback for continuous mode restart
    this.recognition.onnomatch = () => {
      console.warn('🎤 Speech not recognized');
      if (this.onErrorCallback) {
        this.onErrorCallback('no-match');
      }
    };

    // Handle speech end - Best practice: trigger for continuous mode management
    this.recognition.onspeechend = () => {
      console.log('🎤 Speech ended (user stopped talking)');
      // Don't stop here - let onend handle it
    };

    console.log('✅ Web Speech API initialized');
  }

  /**
   * Start listening for speech
   */
  startListening() {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error.message);
      }
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak text using browser TTS
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice if selected
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Apply options
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      utterance.lang = options.lang || 'en-US';

      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Started speaking');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('🔊 Finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('🔊 Speech error:', event.error);
        reject(new Error(event.error));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Get available voices
   */
  getVoices() {
    return new Promise((resolve) => {
      let voices = this.synthesis.getVoices();

      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Voices may load asynchronously
        this.synthesis.onvoiceschanged = () => {
          voices = this.synthesis.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * Set selected voice
   */
  setVoice(voiceName) {
    this.getVoices().then(voices => {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) {
        this.selectedVoice = voice;
        console.log('✅ Voice set to:', voiceName);
      }
    });
  }

  /**
   * Set callbacks
   */
  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening() {
    return this.isListening;
  }

  /**
   * Check if currently speaking
   */
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }
}

// Export singleton instance
export const webSpeechHandler = new WebSpeechHandler();
