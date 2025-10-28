# Atlas Voice Panel (Chrome/Edge Side Panel + OpenAI Realtime)

A powerful Chrome extension that provides voice AI assistance with desktop automation capabilities through OpenAI's Realtime API.

## 🚀 Quick Installation (Recommended)

### Option 1: Download from Releases (Easiest)
1. **Go to [Releases](https://github.com/mrmoe28/atlas-extension-chat-voice/releases)**
2. **Download `atlas-voice-extension.zip`** from the latest release
3. **Extract the ZIP file** to a folder on your computer
4. **Install in Chrome/Edge:**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the **extracted folder** (not the ZIP file)
5. **Pin the extension:** Click the puzzle piece icon → pin "Atlas Voice Panel"

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/mrmoe28/atlas-extension-chat-voice.git
cd atlas-extension-chat-voice

# Install dependencies and build
npm install
npm run build:zip

# The extension will be in atlas-voice-extension.zip
# Extract it and load the extracted folder in Chrome
```

## 🖥️ Server Setup

The extension requires a backend server to handle OpenAI API calls:

```bash
cd server
cp .env.example .env
# Add your OPENAI_API_KEY to .env file
npm install
npm run dev
# Server runs on http://localhost:8787
```

## 🔧 Usage

1. **Connect to Server:**
   - Click the Atlas Voice Panel icon to open the side panel
   - Set Server URL to `http://localhost:8787`
   - Click **Connect**

2. **Voice Interaction:**
   - Hold **Hold to talk** button for press-to-talk voice capture
   - Release to end your turn and get AI response
   - Click **Stop** to interrupt the assistant mid-reply

3. **Advanced Features:**
   - Enable "Desktop Commander mode" for voice-controlled automation
   - Use "Screen Vision mode" to let AI see your screen
   - Adjust creativity settings and add custom instructions

## 🎤 Voice Commands

Atlas Voice supports natural language commands for:
- **File Management:** "Open my downloads folder", "Create a new file"
- **Browser Control:** "Open Google", "Refresh the page", "Take screenshot"  
- **System Control:** "Turn up volume", "Lock my computer"
- **Mouse/Keyboard:** "Click the search button", "Type hello world"
- **And much more!** Enable Desktop Commander mode and speak naturally.

## ⚙️ Development

```bash
# Build extension only
npm run build

# Build and create ZIP
npm run build:zip

# Run tests
npm test

# Development server
npm run dev
```

## 📁 Project Structure

```
atlas-extension-chat-voice/
├── extension/          # Chrome extension source files
│   ├── manifest.json   # Extension configuration
│   ├── background.js   # Service worker
│   ├── sidepanel.html  # Extension UI
│   ├── sidepanel.js    # Extension logic
│   └── styles.css      # Styling
├── server/             # Backend server
├── scripts/            # Build utilities
└── .github/workflows/  # Automated releases
```

## 🔒 Security Notes

- The demo server returns your API key as `client_secret` for simplicity
- For production use, implement proper token management and never expose your API key to clients
- The extension requests broad permissions for desktop automation features

## 🐛 Troubleshooting

**Microphone not working?**
- Grant microphone permission when prompted
- If blocked, go to `chrome://settings/content/microphone` and allow access
- Try opening a regular tab first, then return to the side panel

**Extension not loading?**
- Make sure you extracted the ZIP file first
- Select the extracted folder, not the ZIP file itself
- Enable "Developer mode" in chrome://extensions/

**Can't connect to server?**
- Ensure the server is running on http://localhost:8787
- Check that your .env file contains a valid OPENAI_API_KEY
- Verify the server URL in extension settings
