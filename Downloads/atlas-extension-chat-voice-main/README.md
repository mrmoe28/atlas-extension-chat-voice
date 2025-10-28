# Atlas Voice Panel (Chrome/Edge Side Panel + OpenAI Realtime)

## 1) Run the server
```bash
cd server
cp .env.example .env
# put your real OPENAI_API_KEY in .env
npm i
npm run dev
# Server runs on http://localhost:8787
```

## 2) Load the extension
- Open chrome://extensions (or edge://extensions)
- Enable "Developer mode"
- "Load unpacked" -> select the `extension/` folder
- Click the puzzle-piece -> pin "Atlas Voice Panel"
- Click the toolbar icon to open the side panel

## 3) Connect
- In the side panel, set Server URL to http://localhost:8787, press **Connect**
- Hold **Hold to talk** for press-to-talk voice capture; release to end turn
- Press **Interrupt** to cancel the assistant mid-reply

## Notes
- The server here returns your API key as `client_secret` for demo purposes. For production, implement the official *ephemeral token* or *session minting* flow and never expose your standard key to clients.
- If mic permission doesn't show in the side panel, open a normal tab page within the extension and call getUserMedia once to grant permission for the `chrome-extension://` origin, then return to the side panel.
- Fallback uses Web Speech API for STT/TTS when Realtime is unavailable.
