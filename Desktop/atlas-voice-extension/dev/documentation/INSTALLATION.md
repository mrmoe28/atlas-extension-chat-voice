# 📦 Atlas Voice Extension - Installation Guide

## 🚀 Quick Install (3 Steps)

### Step 1: Download
- Go to [GitHub Releases](https://github.com/mrmoe28/atlas-extension-chat-voice/releases)
- Download **`atlas-voice-extension.zip`** from the latest release

### Step 2: Extract 
- **Important:** Extract the ZIP file to a folder on your computer
- Do NOT try to load the ZIP file directly into Chrome

### Step 3: Load in Chrome
1. Open `chrome://extensions/` in Chrome (or `edge://extensions/` in Edge)
2. Turn ON "Developer mode" (toggle in top right corner)
3. Click "Load unpacked" button
4. Select the **extracted folder** (not the ZIP file)
5. The extension should now appear in your browser

### Step 4: Pin & Use
1. Click the puzzle piece icon in Chrome toolbar
2. Find "Atlas Voice Panel" and click the pin icon
3. Click the Atlas Voice Panel icon to open the side panel
4. Follow the setup instructions in the panel

---

## 🔧 Server Setup (Required)

The extension needs a backend server to work:

```bash
# 1. Download server files (included in repo)
cd server

# 2. Create environment file
cp .env.example .env

# 3. Add your OpenAI API key to the .env file
# Edit .env file and add: OPENAI_API_KEY=your_key_here

# 4. Install and run
npm install
npm run dev
```

The server will run on `http://localhost:8787`

---

## ❗ Common Issues

**"Failed to load extension"**
- Make sure you extracted the ZIP file first
- Select the extracted folder, not the ZIP file
- Enable "Developer mode" in chrome://extensions/

**"Microphone not working"**
- Grant permission when Chrome asks
- Check chrome://settings/content/microphone
- Allow access for the extension

**"Can't connect to server"**
- Make sure server is running on localhost:8787
- Check your OpenAI API key in server/.env
- Verify server URL in extension settings

---

## 🎯 Ready to Use!

Once installed:
1. Open the side panel by clicking the extension icon
2. Set server URL to `http://localhost:8787`
3. Click "Connect"
4. Hold "Hold to talk" and start speaking!

For advanced features like Desktop Commander, enable them in the settings menu.
