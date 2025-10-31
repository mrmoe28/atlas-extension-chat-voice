/**
 * Atlas Voice - Minimal Interface with Hamburger Menu
 */

// Import modules
import { MicManager } from './lib/mic-manager.js';
import { SpeechHandler } from './lib/speech-handler.js';
import { AIConnector } from './lib/ai-connector.js';
import { UIController } from './lib/ui-controller.js';
import { ErrorHandler } from './lib/error-handler.js';

// Setup global error handling
ErrorHandler.setupGlobalErrorHandling();

// Global state
const state = {
  connected: false,
  isListening: false,
  isSpeaking: false,
  isMuted: false,
  isContinuousMode: false,
  isDesktopMode: false,
  isVisionMode: false,
  isContinuousVision: false,
  atlasHasControl: true,
  currentUserMessage: '',
  currentAIMessage: '',
  lastScreenshot: null,
  memoryContext: '',
  conversationHistory: []
};

// DOM elements
const els = {
  menuBtn: document.getElementById('menuBtn'),
  settingsModal: document.getElementById('settingsModal'),
  settingsBackdrop: document.getElementById('settingsBackdrop'),
  settingsClose: document.getElementById('settingsClose'),
  apiKey: document.getElementById('apiKey'),
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  statusDot: document.getElementById('statusDot'),
  voiceBtn: document.getElementById('voiceBtn'),
  voiceStatus: document.getElementById('voiceStatus'),
  interruptBtn: document.getElementById('interruptBtn'),
  continuousMode: document.getElementById('continuousMode'),
  desktopMode: document.getElementById('desktopMode'),
  visionMode: document.getElementById('visionMode'),
  wakeWordMode: document.getElementById('wakeWordMode'),
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
  clearMemoryBtn: document.getElementById('clearMemoryBtn'),
  textInput: document.getElementById('textInput'),
  textSendBtn: document.getElementById('textSendBtn'),
  fileUploadBtn: document.getElementById('fileUploadBtn'),
  fileInput: document.getElementById('fileInput'),
  muteBtn: document.getElementById('muteBtn'),
  muteIcon: document.getElementById('muteIcon'),
  unmutedIcon: document.getElementById('unmutedIcon')
};

// Initialize modules
const micManager = MicManager;
const uiController = new UIController(els, state);

// Function to add message (for modules)
function addMessage(role, content, type = 'text', attachments = null) {
  uiController.addMessage(role, content, type, attachments);
}

// Function to update orb state (for modules)
function updateOrbState() {
  uiController.updateOrbState();
}

// Initialize user session and other setup code here...
