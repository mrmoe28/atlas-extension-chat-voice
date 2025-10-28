# 🎙️ Atlas Voice Panel

**A powerful Chrome extension for voice AI assistance with desktop automation capabilities**

Transform your browser into an intelligent voice-controlled assistant powered by OpenAI's Realtime API. Talk naturally to control your computer, browse the web, manage files, and get AI assistance - all through voice commands.

---

## ✨ Key Features

🎤 **Natural Voice Interaction** - Press-to-talk or continuous conversation modes  
🖥️ **Desktop Commander** - Control your computer with voice commands  
👁️ **Screen Vision** - AI can see and interact with your screen  
🌐 **Browser Control** - Voice-controlled web browsing and automation  
📁 **File Management** - Create, organize, and manage files by voice  
🤖 **Smart Assistant** - Powered by OpenAI's latest Realtime API  
⚡ **Real-time Responses** - Instant voice-to-voice communication  

---

## 🚀 Installation (Super Easy!)

### 🎯 Just 3 Steps!

1. **Download:** 
   - Click the green **"Code"** button above → **"Download ZIP"**
   - Extract the ZIP file anywhere on your computer

2. **Load in Chrome:**
   - Open `chrome://extensions/` 
   - Turn ON **"Developer mode"** (toggle in top right)
   - Click **"Load unpacked"** → Select the **extracted folder**
   - Done! ✨

3. **Start using:**
   - Click the Atlas Voice Panel icon in your toolbar
   - Click "Connect" and start talking!

> **🔥 That's it!** No nested folders, no confusion. The repository is structured so you get a clean extension ready to load directly.

---

## ⚡ Quick Start (No Setup Required!)

**The extension is pre-configured to use our hosted server!** Just install and start talking:

1. **Install the extension** (see installation above)
2. **Click the Atlas Voice icon** to open the side panel  
3. **Click "Connect"** - Uses our hosted server at `atlas-extension-chat-voice.vercel.app`
4. **Start talking!** Click "Hold to talk" and speak naturally

**That's it! No server setup needed.** ✨

---

## 🛠️ Advanced Setup (Optional)

### Want to run your own server? 

```bash
# 1. Set up the local server
cd server
cp .env.example .env

# 2. Add your OpenAI API key to .env
# Edit the .env file: OPENAI_API_KEY=your_key_here

# 3. Install and run
npm install
npm run dev
# Server runs on http://localhost:8787
```

**Then in the extension:**
- Open settings (click the menu button)
- Change Server URL to `http://localhost:8787`
- Click "Connect"

---

## 🎤 How to Use

### Basic Voice Chat
1. **Open the extension** - Click the Atlas Voice Panel icon
2. **Start talking** - Hold the "Hold to talk" button and speak
3. **Get responses** - Release the button and Atlas will respond with voice
4. **Interrupt anytime** - Click "Stop" to cancel responses

### Desktop Commander Mode  
Enable this for computer control:
1. **Open settings** → Enable "Desktop Commander mode"  
2. **Grant permissions** when prompted
3. **Voice commands:** "Open my downloads", "Take a screenshot", "Turn up volume"

### Screen Vision Mode
Let Atlas see your screen:
1. **Open settings** → Enable "Screen Vision mode"
2. **Ask about your screen:** "What's on my screen?", "Help me with this form"

---

## 🎯 Voice Commands Examples

**Just speak naturally! Here are some examples:**

### 🌐 Web & Browser
```
"Open Google"
"Search for artificial intelligence"  
"Refresh this page"
"Take a screenshot"
"Open a new tab"
"Go back to the previous page"
```

### 📁 File Management  
```
"Open my downloads folder"
"Create a new folder called Projects"
"Show me my desktop"
"Delete that old file"
"Move this to my documents"
```

### 🖱️ Mouse & Clicks
```
"Click the search button"
"Double click on that file"  
"Right click here"
"Scroll down the page"
"Click on the login link"
```

### ⌨️ Text & Typing
```
"Type 'Hello World'"
"Select all the text"
"Copy this text"
"Press Enter"
"Clear this field"
```

### 🔊 System Controls
```
"Turn up the volume"
"Make the screen brighter"
"Lock my computer"  
"Take a screenshot"
"Mute the audio"
```

### 🤖 AI Assistant
```
"What's on my screen right now?"
"Help me fill out this form"
"Summarize this article"
"What time is it?"
"Remember that I prefer coffee"
```

---

## 🚨 Troubleshooting

### Extension Won't Load
❌ **Problem:** "Failed to load extension" error  
✅ **Solution:** 
- Make sure you **extracted the ZIP file first**
- Select the **extracted folder**, not the ZIP file  
- Enable **"Developer mode"** in `chrome://extensions/`
- Try refreshing the extensions page

### Microphone Issues  
❌ **Problem:** Voice not being detected  
✅ **Solution:**
- **Grant permission** when Chrome asks for microphone access
- Check `chrome://settings/content/microphone` - allow access for the extension
- **Test your mic** in other apps first
- Try opening a regular tab, grant permission there, then return to side panel

### Connection Problems
❌ **Problem:** Can't connect to server  
✅ **Solution:**
- **Default server:** Extension should work immediately with our hosted server
- **Custom server:** Make sure it's running on `http://localhost:8787`
- **Check your API key** in server/.env file  
- **Verify URL** in extension settings matches your server

### Desktop Commands Not Working
❌ **Problem:** "Open folder" etc. not working  
✅ **Solution:**
- **Enable "Desktop Commander mode"** in settings
- **Grant all permissions** when prompted  
- **macOS users:** May need to allow Chrome in System Preferences → Security & Privacy

---

## 🛠️ For Developers

### Building & Development
```bash
# Install dependencies
npm install

# Build extension for distribution  
npm run build

# Create release ZIP
npm run build:zip  

# Run local development server
npm run dev

# Run tests
npm run test
```

### Project Structure
```
atlas-extension-chat-voice/           (Clean Extension - Load This Root Folder!)
├── 📦 EXTENSION FILES (Root Level)
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker
│   ├── sidepanel.html     # Main UI
│   ├── sidepanel.js       # Extension logic  
│   ├── styles.css         # Styling
│   ├── content.js         # Content script
│   └── assets/            # Icons and resources
│       └── mic.svg
├── 📖 README.md           # This file
├── 📦 package.json        # Build scripts
├── ⚙️  vercel.json        # Server deployment config
└── 🛠️ dev/                # Development files (hidden from users)
    ├── server/            # Backend API server
    ├── scripts/           # Build utilities
    ├── tests/             # Test files
    ├── documentation/     # Additional docs
    └── build-tools/       # Build artifacts
```

> **🎯 Clean Design:** Extension files at root = easy installation. Development files in `dev/` = no confusion!

### Architecture Notes
- **Manifest V3** Chrome extension with side panel
- **OpenAI Realtime API** for voice-to-voice communication  
- **WebRTC** for real-time audio streaming
- **Web Speech API** fallback for older browsers
- **Vercel** hosted backend server
- **Desktop automation** via browser APIs and native messaging

---

## 🔐 Privacy & Security

- **🔒 Your conversations** are sent to OpenAI's API for processing
- **🏠 Local processing** when possible (Web Speech API fallback)
- **🚫 No data stored** permanently on our servers  
- **🔑 API keys** are handled securely (never exposed to client)
- **⚠️ Broad permissions** required for desktop automation features

---

## 📝 License & Contributing

This project is open source! Feel free to:
- 🐛 **Report bugs** in the Issues tab
- 💡 **Suggest features** and improvements  
- 🔧 **Submit pull requests** with fixes or enhancements
- ⭐ **Star the repo** if you find it useful!

---

## 💫 What Makes Atlas Special?

Unlike other voice assistants, Atlas Voice is designed specifically for **power users** who want to:

✨ **Control their entire workflow by voice**  
✨ **See and understand their screen content**  
✨ **Get real-time, conversational AI assistance**  
✨ **Automate repetitive computer tasks**  
✨ **Work faster without touching keyboard/mouse**  

**Ready to transform how you interact with your computer?** Install Atlas Voice and start talking! 🎙️
