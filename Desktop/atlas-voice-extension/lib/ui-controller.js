/**
 * UI Controller - Handles user interface logic and state management
 */

export class UIController {
  constructor(els, state) {
    this.els = els;
    this.state = state;
  }

  openSettingsModal() {
    this.els.settingsModal.classList.add('open');
    this.els.settingsModal.setAttribute('aria-hidden', 'false');
    this.els.settingsBackdrop.classList.add('visible');

    // Load saved settings
    this.loadSettings();
  }

  closeSettingsModal() {
    this.els.settingsModal.classList.remove('open');
    this.els.settingsModal.setAttribute('aria-hidden', 'true');
    this.els.settingsBackdrop.classList.remove('visible');

    // Save settings
    this.saveSettings();
  }

  loadSettings() {
    // Load settings from chrome storage
    chrome.storage.local.get([
      'apiKey', 'serverUrl', 'autoConnect', 'continuousMode', 'aiProvider',
      'voiceSelect', 'desktopMode', 'wakeWordMode', 'temperature', 'memoryEnabled',
      'specialInstructions'
    ], (result) => {
      if (result.apiKey) this.els.apiKey.value = result.apiKey;
      if (result.serverUrl) this.els.serverUrl.value = result.serverUrl;
      if (result.autoConnect) this.els.autoConnect.checked = result.autoConnect;
      if (result.continuousMode) this.els.continuousMode.checked = result.continuousMode;
      if (result.aiProvider) this.els.aiProvider.value = result.aiProvider;
      if (result.voiceSelect) this.els.voiceSelect.value = result.voiceSelect;
      if (result.desktopMode) this.els.desktopMode.checked = result.desktopMode;
      if (result.wakeWordMode) this.els.wakeWordMode.checked = result.wakeWordMode;
      if (result.temperature) {
        this.els.temperatureSlider.value = result.temperature;
        this.els.temperatureValue.textContent = result.temperature;
      }
      if (result.memoryEnabled) this.els.memoryEnabled.checked = result.memoryEnabled;
      if (result.specialInstructions) this.els.specialInstructions.value = result.specialInstructions;
    });
  }

  saveSettings() {
    const settings = {
      apiKey: this.els.apiKey.value,
      serverUrl: this.els.serverUrl.value,
      autoConnect: this.els.autoConnect.checked,
      continuousMode: this.els.continuousMode.checked,
      aiProvider: this.els.aiProvider.value,
      voiceSelect: this.els.voiceSelect.value,
      desktopMode: this.els.desktopMode.checked,
      wakeWordMode: this.els.wakeWordMode.checked,
      temperature: this.els.temperatureSlider.value,
      memoryEnabled: this.els.memoryEnabled.checked,
      specialInstructions: this.els.specialInstructions.value
    };

    chrome.storage.local.set(settings);
    console.log('Settings saved');
  }

  updateOrbState() {
    this.els.voiceOrb.classList.remove('listening', 'speaking');

    if (this.state.isSpeaking) {
      this.els.voiceOrb.classList.add('speaking');
      this.els.orbStatus.textContent = 'AI is speaking...';
    } else if (this.state.isListening) {
      this.els.voiceOrb.classList.add('listening');
      this.els.orbStatus.textContent = 'Listening...';
    } else if (this.state.connected) {
      this.els.orbStatus.textContent = 'Ready - Hold button to talk';
    } else {
      this.els.orbStatus.textContent = 'Disconnected';
    }
  }

  addMessage(role, content, messageType = 'text', attachments = null) {
    if (!content || content.trim() === '') return;

    // Hide orb, show chat
    this.els.voiceOrbWrapper.classList.add('hidden');
    this.els.chatContainer.classList.remove('hidden');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (messageType === 'text') {
      contentDiv.textContent = content;
    } else if (messageType === 'code') {
      const codeEl = document.createElement('code');
      codeEl.textContent = content;
      contentDiv.appendChild(codeEl);
    }

    messageDiv.appendChild(contentDiv);
    this.els.chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    this.els.chatContainer.scrollTop = this.els.chatContainer.scrollHeight;

    // Auto-clear old messages if too many
    const messages = this.els.chatContainer.querySelectorAll('.message');
    if (messages.length > 50) {
      messages[0].remove();
    }
  }

  showConnectionStatus(connected) {
    this.state.connected = connected;
    this.els.statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    this.updateOrbState();
  }

  toggleHelp() {
    const helpContent = this.els.helpContent;
    const toggleBtn = this.els.toggleHelpBtn;

    if (helpContent.style.display === 'none' || !helpContent.style.display) {
      helpContent.style.display = 'block';
      toggleBtn.textContent = 'Hide Commands';
    } else {
      helpContent.style.display = 'none';
      toggleBtn.textContent = 'Show Commands';
    }
  }
}