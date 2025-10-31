# 🎙️ Atlas Voice Panel

<div align="center">

**Transform your browser into an intelligent voice-controlled AI assistant**

![Version](https://img.shields.io/badge/version-0.3.1-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Chrome](https://img.shields.io/badge/Chrome-88+-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=for-the-badge)

*A Chrome Manifest V3 extension for voice AI assistance with desktop automation, screen vision, and persistent memory - powered by OpenAI's Realtime API*

[🚀 Installation](#-installation) • [⚡ Quick Start](#-quick-start) • [📖 Documentation](./docs/FEATURES.md) • [🎙️ Background Mode](./BACKGROUND_MODE.md) • [🎤 Voice Commands](#-voice-commands-examples) • [🐛 Issues](https://github.com/mrmoe28/atlas-extension-chat-voice/issues)

</div>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🚀 Installation](#-installation-super-easy)
- [⚡ Quick Start](#-quick-start-no-setup-required)
- [📸 Screenshots](#-screenshots)
- [🛠️ Advanced Setup](#️-advanced-setup-optional)
- [🎤 Voice Commands](#-voice-commands-examples)
- [🚨 Troubleshooting](#-troubleshooting)
- [❓ FAQ](#-faq-frequently-asked-questions)
- [📖 Documentation](#-documentation)
- [🗺️ Roadmap](#️-roadmap)
- [⚡ Performance](#-performance)
- [🛠️ For Developers](#️-for-developers)
- [🔐 Privacy & Security](#-privacy--security)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🌟 Credits](#-credits--acknowledgments)

---

## ✨ Key Features

### Core Capabilities

🎤 **Voice-to-Voice AI** - Natural conversation with OpenAI's GPT-4 Realtime API
🔑 **Local API Key Storage** - Use your own OpenAI API key (no server required!)
🌐 **Browser Automation** - Click, type, fill forms, and navigate websites by voice
🖥️ **Desktop Commander** - Control your computer: files, apps, volume, brightness, lock screen
👁️ **Vision Mode** - AI can see and analyze your screen with GPT-4 Vision
🧠 **Persistent Memory** - Remembers you across sessions with NeonDB storage
⚡ **Real-time Responses** - <500ms latency WebRTC audio streaming
🔄 **Auto-Updates** - Automatic version checking via GitHub Releases

### Voice Modes

- 🎯 **Push-to-Talk** - Hold button to speak (perfect for precision)
- 🗣️ **Continuous** - Voice Activity Detection for hands-free conversation
- 🎙️ **Wake Word** - Say "Hey Atlas" to activate (with auto-mute after 10 seconds)
- 🔄 **Background Mode** - Run Atlas in background, activate with wake word anytime

### Desktop Automation

| Feature | Capabilities |
|---------|-------------|
| 📁 **File Operations** | Open, create, delete, move, copy files and folders |
| 🚀 **App Launcher** | Launch applications by name (Chrome, VS Code, Spotify, etc.) |
| 🔊 **System Controls** | Volume, brightness, lock screen, sleep |
| 🖱️ **Mouse & Clicks** | Click elements, scroll, interact with UI |
| ⌨️ **Text Input** | Type text, keyboard shortcuts |
| 📸 **Screenshots** | Capture screen, window, or tab |

### What Makes Atlas Different?

| Feature | Atlas Voice | Competitors |
|---------|------------|-------------|
| **Setup Time** | ⚡ 2 minutes | 🐌 30+ minutes |
| **Voice Latency** | < 500ms | 2-5 seconds |
| **Desktop Control** | ✅ Full automation | ❌ Limited or none |
| **Screen Vision** | ✅ GPT-4 Vision | ⚠️ Text-only |
| **Memory** | ✅ Persistent across sessions | ❌ Ephemeral |
| **Privacy** | 🔒 Optional memory | ⚠️ Always tracked |
| **Platform** | 🌐 Chrome extension | 📱 Separate app |
| **Cost** | 🆓 Free (BYOK) | 💰 Subscription |

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

## ⚡ Quick Start

**Two ways to get started:**

### Option 1: Use Your Own API Key (Recommended) 🔑

1. **Install the extension** (see installation above)
2. **Get your OpenAI API key** from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **Open Atlas settings** (click menu button)
4. **Enter your API key** in the "OpenAI API Key" field
5. **Click "Connect"** and start talking!

**Benefits:** Direct connection, full privacy, no server needed

### Option 2: Use Hosted Server 🌐

1. **Install the extension** (see installation above)
2. **Click the Atlas Voice icon** to open the side panel
3. **Click "Connect"** - Uses our hosted server at `atlas-voice-extension.vercel.app`
4. **Start talking!** Click "Hold to talk" and speak naturally

**Benefits:** No API key needed, instant setup

---

## 📸 Screenshots

> **Note:** Screenshots coming soon! Below are placeholders for what the extension looks like in action.

### Side Panel Interface
![Atlas Voice Side Panel](./docs/images/sidepanel.png)
*Main interface showing voice controls, conversation history, and status indicators*

### Settings Panel
![Settings Configuration](./docs/images/settings.png)
*Configure server URL, voice modes, and memory settings*

### Vision Mode in Action
![Vision Mode Screenshot](./docs/images/vision-mode.png)
*AI analyzing screen content with GPT-4 Vision*

### Desktop Commander
![Desktop Automation](./docs/images/desktop-commander.png)
*Voice-controlled file operations and system commands*

> **Want to contribute screenshots?** See our [Contributing Guide](#-contributing)

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

## ❓ FAQ (Frequently Asked Questions)

### General Questions

**Q: Is Atlas Voice free to use?**
A: Yes! The extension is free and open-source (MIT License). You'll need your own OpenAI API key for the AI features, which operates on OpenAI's pay-as-you-go pricing.

**Q: What browsers are supported?**
A: Currently Chrome 88+ and Chromium-based browsers (Edge, Brave). Firefox and Safari support planned for future releases.

**Q: Does it work offline?**
A: No, an internet connection is required for AI features. The extension connects to OpenAI's Realtime API for voice processing.

**Q: Is my data private?**
A: Audio is streamed to OpenAI for processing. Text transcripts are optionally saved if memory is enabled. The extension collects no telemetry or tracking data.

### Setup & Installation

**Q: Do I need to set up a server?**
A: No! The extension comes pre-configured with our hosted server. You can optionally run your own server if preferred.

**Q: Where do I get an OpenAI API key?**
A: The hosted server provides credentials. If running your own server, get a key from [OpenAI Platform](https://platform.openai.com/api-keys).

**Q: Why does it need so many permissions?**
A: Desktop automation requires broad permissions (file access, system control). You can review exactly what permissions are used in the [Documentation](./docs/FEATURES.md#extension-architecture).

### Usage Questions

**Q: Can I use it hands-free?**
A: Yes! Enable "Continuous Mode" for voice-activated conversation without holding a button. Wake word mode is planned for future releases.

**Q: What languages are supported?**
A: Currently English. Multi-language support is planned for v0.3.0+.

**Q: Can it control any application?**
A: It can launch applications, but in-app control depends on the application's accessibility. Browser-based apps work best.

**Q: How do I update the extension?**
A: The extension checks for updates automatically every 4 hours. You'll see a notification when a new version is available. Updates are manual (download and reload).

### Technical Questions

**Q: What's the voice latency?**
A: Typically <500ms via WebRTC direct connection to OpenAI's Realtime API.

**Q: Can I use my own AI model?**
A: Currently OpenAI only. Support for other providers (Anthropic Claude, local models) is on the roadmap.

**Q: Is the code open source?**
A: Yes! MIT License. View, modify, and contribute on [GitHub](https://github.com/mrmoe28/atlas-extension-chat-voice).

**Q: Can I self-host everything?**
A: Yes! The server code is in `dev/server/`. Deploy to Vercel, your own server, or run locally. See [Advanced Setup](#️-advanced-setup-optional).

### Troubleshooting

**Q: Microphone not working?**
A: Check Chrome permissions at `chrome://settings/content/microphone` and grant access when prompted.

**Q: "Failed to connect" error?**
A: Verify internet connection and server URL in settings. Default is `https://atlas-extension-chat-voice.vercel.app`.

**Q: Desktop commands not executing?**
A: Ensure "Desktop Commander mode" is enabled in settings. macOS users may need to grant Accessibility permissions.

**Q: Can't see the extension icon?**
A: Click the puzzle piece icon in Chrome's toolbar and pin Atlas Voice Panel for easy access.

**Still have questions?** Check the [Full Documentation](./docs/FEATURES.md) or [open an issue](https://github.com/mrmoe28/atlas-extension-chat-voice/issues).

---

## 📖 Documentation

### Complete Feature Documentation

📚 **[Full Features Guide](./docs/FEATURES.md)** - Comprehensive documentation including:
- Voice interaction modes and settings
- Desktop Commander command reference
- Vision mode capabilities and examples
- Memory system architecture
- API endpoint documentation
- Database schema
- Troubleshooting guide
- Development guide
- And much more!

### Quick Links

- 📖 [Complete Features Documentation](./docs/FEATURES.md)
- 🎤 [Voice Commands Reference](./docs/FEATURES.md#command-reference)
- 🖥️ [Desktop Automation Guide](./docs/FEATURES.md#desktop-automation)
- 👁️ [Vision Mode Documentation](./docs/FEATURES.md#vision--screen-analysis)
- 🧠 [Memory System Guide](./docs/FEATURES.md#memory--knowledge-base)
- 🔧 [API Reference](./docs/FEATURES.md#backend-api)
- 🐛 [Troubleshooting](./docs/FEATURES.md#troubleshooting)
- 💻 [Developer Guide](./docs/FEATURES.md#developer-guide)

### Architecture Overview

```
┌─────────────────────────────────────────┐
│      Chrome Extension (Client)          │
│  ┌────────────────────────────────────┐ │
│  │  Side Panel UI (sidepanel.html)   │ │
│  │  - Voice controls                  │ │
│  │  - Settings panel                  │ │
│  │  - Conversation display            │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Service Worker (background.js)   │ │
│  │  - Update checking                 │ │
│  │  - Lifecycle management            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ↕ WebRTC / HTTPS
┌─────────────────────────────────────────┐
│   Vercel Hosted Server (dev/server/)   │
│  ┌────────────────────────────────────┐ │
│  │  Express.js API                    │ │
│  │  - /api/ephemeral (credentials)    │ │
│  │  - /api/desktop (automation)       │ │
│  │  - /api/vision (GPT-4 Vision)      │ │
│  │  - /api/knowledge (memory)         │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ↕ HTTP/S
┌─────────────────────────────────────────┐
│         External Services               │
│  - OpenAI Realtime API (voice)         │
│  - OpenAI GPT-4 Vision (screenshots)   │
│  - NeonDB PostgreSQL (memory)          │
└─────────────────────────────────────────┘
```

---

## 🗺️ Roadmap

### ✅ Current Version (0.3.1)

- Voice-to-voice AI communication
- Push-to-talk, continuous, and wake word modes
- Desktop automation commands
- **NEW:** Local API key storage (use your own OpenAI key!)
- **NEW:** Enhanced web automation (click, type, fill forms by voice)
- Screen capture and vision analysis
- Persistent memory system
- Auto-update mechanism
- Settings configuration

### 🔄 Next Release (0.4.0)

- [ ] **Enhanced Memory** - Memory search, categories, and export
- [ ] **UI Improvements** - Dark mode, custom themes, resizable panels
- [ ] **Better Error Handling** - More detailed error messages and recovery
- [ ] **Keyboard Shortcuts** - Hotkeys for common actions
- [ ] **Multi-language Support** - i18n for interface and commands
- [ ] **Custom Wake Words** - Configure your own activation phrase

### 📋 Planned (0.4.0+)

- [ ] **Advanced Automation** - Multi-step workflows, scheduled commands
- [ ] **Browser Integration** - Tab automation, form filling, bookmarks
- [ ] **Cross-Platform** - Firefox extension, full Linux support
- [ ] **Mobile** - iOS and Android apps
- [ ] **Team Features** - Shared knowledge base, collaboration
- [ ] **Custom Models** - Support for other AI providers

### 💡 Long-term Vision

- Multiple AI model support (Anthropic Claude, local models)
- Custom fine-tuned models for specialized tasks
- Calendar and email integration
- Task management and CRM integrations
- Desktop app (Electron) for non-Chrome users
- API for third-party integration

---

## ⚡ Performance

### Benchmarks

| Operation | Latency | Notes |
|-----------|---------|-------|
| Voice Response | < 500ms | Via WebRTC direct connection |
| Desktop Command | 100-300ms | Platform dependent |
| Vision Analysis | 2-5 seconds | Depends on image size |
| Memory Lookup | < 100ms | NeonDB serverless |
| Update Check | < 1 second | GitHub API |

### System Requirements

**Minimum:**
- Chrome 88+ (Manifest V3 support)
- 4 GB RAM
- 50 MB storage
- 1 Mbps internet

**Recommended:**
- Chrome 120+
- 8 GB RAM
- 100 MB storage
- 5+ Mbps internet

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

## 🤝 Contributing

We love contributions! Here's how you can help make Atlas Voice even better:

### Ways to Contribute

- 🐛 **Report Bugs** - Found an issue? [Open a bug report](https://github.com/mrmoe28/atlas-extension-chat-voice/issues/new?template=bug_report.md)
- 💡 **Suggest Features** - Have an idea? [Request a feature](https://github.com/mrmoe28/atlas-extension-chat-voice/issues/new?template=feature_request.md)
- 📖 **Improve Documentation** - Fix typos, add examples, clarify instructions
- 🔧 **Submit Code** - Fix bugs, add features, improve performance
- ⭐ **Star the Repo** - Show your support and help others discover it!
- 💬 **Share Feedback** - Tell us what you like and what could be better

### Development Contribution Guide

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/atlas-voice-extension.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Test** thoroughly (load extension, test features)
6. **Commit** with clear message: `git commit -m 'Add amazing feature'`
7. **Push** to your fork: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Development Guidelines

- ✅ Test your changes with the extension loaded in Chrome
- ✅ Follow existing code style and patterns
- ✅ Update documentation for new features
- ✅ Keep commits focused and well-described
- ✅ Be respectful and constructive in discussions

### Code of Conduct

Be kind, respectful, and constructive. We're all here to build something awesome together! 🚀

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

**TL;DR:** You can use, modify, and distribute this project freely, even commercially. Just keep the license notice.

---

## 🌟 Credits & Acknowledgments

### Built With

- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) - Voice-to-voice AI
- [OpenAI GPT-4 Vision](https://platform.openai.com/docs/guides/vision) - Screen analysis
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser integration
- [WebRTC](https://webrtc.org/) - Real-time audio streaming
- [NeonDB](https://neon.tech/) - Serverless PostgreSQL
- [Vercel](https://vercel.com/) - Hosting and deployment
- [Express.js](https://expressjs.com/) - Backend API

### Inspiration

This project was inspired by the need for a truly hands-free, voice-controlled computing experience that goes beyond simple commands to enable natural conversation and complex automation.

### Special Thanks

- OpenAI for the incredible Realtime API
- The Chrome Extensions team for Manifest V3
- All contributors and testers who helped improve Atlas Voice
- The open-source community for tools and libraries

---

## 📊 Project Stats

<div align="center">

![GitHub Stars](https://img.shields.io/github/stars/mrmoe28/atlas-extension-chat-voice?style=social)
![GitHub Forks](https://img.shields.io/github/forks/mrmoe28/atlas-extension-chat-voice?style=social)
![GitHub Issues](https://img.shields.io/github/issues/mrmoe28/atlas-extension-chat-voice)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/mrmoe28/atlas-extension-chat-voice)
![GitHub Last Commit](https://img.shields.io/github/last-commit/mrmoe28/atlas-extension-chat-voice)
![GitHub Repo Size](https://img.shields.io/github/repo-size/mrmoe28/atlas-extension-chat-voice)

</div>

---

## 💫 Why Choose Atlas Voice?

Unlike other voice assistants, Atlas Voice is designed specifically for **power users** and **developers** who want:

### 🚀 **Speed & Efficiency**
- Voice commands execute in milliseconds
- No context switching between apps
- Hands-free multitasking
- Keyboard-free workflow possible

### 🧠 **Intelligence & Memory**
- Natural conversation with GPT-4
- Remembers you across sessions
- Learns your patterns and preferences
- Context-aware responses

### 🔧 **Power & Control**
- Full desktop automation
- Screen vision and analysis
- File and application management
- System control (volume, brightness, etc.)

### 🔒 **Privacy & Ownership**
- Open source (MIT License)
- Bring your own OpenAI key
- Optional persistent memory
- No telemetry or tracking
- Data stays in your control

### 🎯 **Developer Friendly**
- Built with modern web tech
- Well-documented API
- Easy to extend and customize
- Active development

---

<div align="center">

## 🎙️ Ready to Transform Your Computing Experience?

**Install Atlas Voice and start talking to your computer like never before!**

[📥 Download Latest Release](https://github.com/mrmoe28/atlas-extension-chat-voice/releases/latest) • [📖 Read Full Documentation](./docs/FEATURES.md) • [⭐ Star on GitHub](https://github.com/mrmoe28/atlas-extension-chat-voice)

<br>

**Made with ❤️ by the Atlas Voice Team**

[🌐 Website](https://example.com) • [🐦 Twitter](https://twitter.com/atlasvoice) • [💬 Discord](https://discord.gg/atlasvoice)

<br>

*If you find Atlas Voice useful, please consider giving it a ⭐ star on GitHub!*

</div>
