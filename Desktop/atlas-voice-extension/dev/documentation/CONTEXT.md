# Atlas Voice Panel - Project Context

## Project Overview
Atlas Voice Panel is a Chrome/Edge browser extension that provides a side panel for voice interaction with ChatGPT using OpenAI's Realtime API via WebRTC, with Web Speech API as a fallback.

## Current State
**Status**: Initial setup complete
**Created**: 2025-10-27
**Version**: 0.1.0

## Architecture

### Technology Stack
- **Extension**: Manifest V3 Chrome Extension (side panel)
- **WebRTC**: For real-time audio streaming with OpenAI
- **Fallback**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **Server**: Node.js + Express (ephemeral token provider)
- **API**: OpenAI Realtime API (gpt-realtime-mini)

### Components

#### Extension (`/extension`)
1. **manifest.json** - Extension configuration (Manifest V3)
2. **background.js** - Service worker for side panel behavior
3. **sidepanel.html** - Main UI layout
4. **sidepanel.js** - Core WebRTC and fallback logic
5. **styles.css** - Dark theme styling
6. **assets/mic.svg** - Microphone icon

#### Server (`/server`)
1. **server.js** - Express server for ephemeral token generation
2. **package.json** - Server dependencies
3. **.env.example** - Environment variable template

## Key Features

### Implemented
- ✅ Side panel UI with connection controls
- ✅ WebRTC connection to OpenAI Realtime API
- ✅ Press-to-talk microphone control
- ✅ Interrupt button for canceling responses
- ✅ Real-time audio streaming (bidirectional)
- ✅ Web Speech API fallback (STT + TTS)
- ✅ Voice selection for TTS
- ✅ Transcript display for user and assistant
- ✅ Ephemeral token server endpoint

### Pending
- ⏳ Microphone icon asset (basic SVG created, can be customized)
- ⏳ Data channel event handling (transcript streaming)
- ⏳ Enhanced error handling and retry logic
- ⏳ Production ephemeral token minting (currently uses direct API key)
- ⏳ Extension icons (16x16, 48x48, 128x128)
- ⏳ User settings persistence (chrome.storage)

## Setup Instructions

### 1. Server Setup
```bash
cd server
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npm install
npm run dev
```
Server runs on http://localhost:8787

### 2. Extension Setup
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Pin the extension to toolbar

### 3. Usage
1. Click extension icon to open side panel
2. Enter server URL: `http://localhost:8787`
3. Click "Connect"
4. Hold "Hold to talk" button to speak
5. Release to let AI respond

## Technical Decisions

### Why WebRTC?
- Low latency for real-time voice interaction
- Direct peer connection with OpenAI's servers
- Better audio quality than traditional HTTP streaming

### Why Side Panel?
- Persistent across browser tabs
- Non-intrusive UI that doesn't block page content
- Easy access via toolbar icon
- Chrome's recommended approach for assistant-style extensions

### Why Ephemeral Tokens?
- Never expose main API key to client
- Tokens can be time-limited and scoped
- Better security for production deployments

### Fallback Strategy
Web Speech API provides:
- Speech-to-text via SpeechRecognition
- Text-to-speech via SpeechSynthesis
- Works offline (for TTS) and requires no API keys
- Good for testing and accessibility

## Security Considerations

### Current (Development)
- ⚠️ Server returns raw API key as `client_secret` (DEMO ONLY)
- Local server on localhost:8787
- No CORS restrictions needed for localhost

### Production TODO
- ✅ Implement official OpenAI ephemeral token minting
- ✅ Add token expiration and refresh logic
- ✅ Use environment-specific server URLs
- ✅ Implement rate limiting on server
- ✅ Add authentication for server endpoints
- ✅ Deploy server to secure hosting (Vercel, Railway, etc.)
- ✅ Use HTTPS for all connections

## Known Issues

### Microphone Permission
- Side panel may not prompt for mic permission
- **Workaround**: Open a regular tab within extension context first
- Call `getUserMedia()` once to grant permission for `chrome-extension://` origin
- Then return to side panel

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: No side panel API (would need different approach)
- Safari: No Chrome Extension API support

## API Endpoints

### Server
- `GET /` - Health check (returns "OK")
- `GET /api/ephemeral` - Get ephemeral token for WebRTC
  - Returns: `{ client_secret, model, endpoint }`

### OpenAI Realtime (via WebRTC)
- Endpoint: `https://api.openai.com/v1/realtime/calls`
- Method: POST with SDP offer
- Auth: Bearer token (ephemeral)
- Content-Type: `application/sdp`

## Data Channel Events (Future)
The DataChannel can send/receive these events:
- `input_audio.end` - Signal end of user turn
- `response.cancel` - Interrupt current response
- Text transcripts (if enabled server-side)
- Conversation metadata

## Next Steps

### Immediate
1. Test microphone permission flow
2. Verify WebRTC connection with real API key
3. Test press-to-talk functionality
4. Validate audio quality

### Short-term
1. Add extension icons (16, 48, 128px)
2. Implement transcript streaming via DataChannel
3. Add user settings (voice preference, server URL)
4. Persist settings with chrome.storage

### Long-term
1. Production-ready ephemeral token minting
2. Deploy server to cloud hosting
3. Add conversation history persistence
4. Implement custom voice instructions
5. Add visual audio waveform during recording
6. Chrome Web Store publication

## Resources

### Documentation
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### Similar Projects
- ChatGPT Web App (official)
- Voice Control extensions
- AI assistant browser extensions

## Development Notes

### Testing Checklist
- [ ] Server starts without errors
- [ ] Extension loads in Chrome
- [ ] Side panel opens on icon click
- [ ] Connection establishes successfully
- [ ] Microphone permission granted
- [ ] Audio recording works
- [ ] WebRTC peer connection established
- [ ] Remote audio plays through speakers
- [ ] Press-to-talk captures audio
- [ ] Interrupt button works
- [ ] Fallback STT/TTS works
- [ ] Voice selection changes TTS voice

### Debug Tips
- Check browser DevTools console (F12)
- Monitor Network tab for API calls
- Use `chrome://webrtc-internals` for WebRTC debugging
- Check server logs for token requests
- Test with different microphone devices

## Project Structure
```
atlas-voice-panel/
├── extension/
│   ├── manifest.json          # Extension config
│   ├── background.js          # Service worker
│   ├── sidepanel.html         # Main UI
│   ├── sidepanel.js           # Client logic
│   ├── styles.css             # Styling
│   └── assets/
│       └── mic.svg            # Microphone icon
├── server/
│   ├── package.json           # Dependencies
│   ├── server.js              # Express server
│   └── .env.example           # Config template
├── README.md                  # Setup instructions
├── CONTEXT.md                 # This file
└── CLAUDE.md                  # Development guidelines
```

## Environment Variables

### Server (.env)
```env
OPENAI_API_KEY=sk-xxxxx                    # Your OpenAI API key
OPENAI_REALTIME_MODEL=gpt-realtime-mini    # Model to use
OPENAI_REALTIME_CALLS_URL=https://api.openai.com/v1/realtime/calls  # API endpoint
PORT=8787                                   # Server port (optional)
```

## Lessons Learned

### WebRTC Setup
- Must create local offer before exchanging with remote peer
- Audio tracks must be added to RTCPeerConnection
- Remote audio requires an `<audio>` element with `autoplay`
- DataChannel must be created before creating offer

### Side Panel
- Requires Manifest V3
- Service worker replaces background page
- Must enable side panel behavior in background script
- Icon click can auto-open side panel

### Voice Permissions
- Browser permission must be granted to extension origin
- Side panel may need initial permission in regular tab context
- Permission persists after first grant

## Future Enhancements

### UI/UX
- Visual waveform during recording
- Animated speaking indicator
- Message threading/history view
- Dark/light theme toggle
- Keyboard shortcuts

### Features
- Multi-language support
- Custom voice instructions
- Conversation export
- Local conversation history
- Background ambient sound detection
- Wake word activation

### Technical
- WebSocket fallback for regions without WebRTC support
- Audio quality settings (bitrate, sample rate)
- Noise cancellation/enhancement
- Echo cancellation
- Multiple conversation threads
- Chrome.storage.sync for cross-device settings
