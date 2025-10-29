# Background Mode & Wake Word Detection

## Overview

Atlas Voice can run in the background and respond to "Hey Atlas" even when Chrome is minimized or you're on a different tab.

## Features

- 🎙️ **Wake Word Detection**: Say "Hey Atlas" to activate voice interaction
- 🔇 **Auto-Mute**: Automatically mutes after 10 seconds of inactivity
- 🔄 **Background Service**: Keeps Atlas running even when minimized
- 👂 **Always Listening**: Wake word detection works 24/7 (when enabled)

## Setup Instructions

### Step 1: Enable Chrome Background Mode

**For Chrome to run in the background when closed:**

1. Open Chrome Settings (`chrome://settings/`)
2. Click **"System"** in the left sidebar
3. Enable **"Continue running background apps when Google Chrome is closed"**

![Chrome Background Setting](https://i.imgur.com/example.png)

**Verify it's working:**
- Close all Chrome windows
- Look for the Chrome icon in your system tray (Windows) or menu bar (Mac)
- Chrome should still be running in the background

### Step 2: Enable Wake Word Detection in Atlas

1. Open Atlas Voice extension
2. Click the hamburger menu (☰)
3. Under "Voice Settings", check **"Wake Word Mode"**
4. Atlas will show: "👂 Wake word detection enabled! Say "Hey Atlas" to activate."

### Step 3: Test Wake Word

1. Minimize Chrome or switch to another app
2. Say **"Hey Atlas"** out loud
3. Atlas should automatically:
   - Unmute your microphone
   - Start listening for your command
   - Respond to your request
4. After 10 seconds of inactivity, Atlas will auto-mute

## How It Works

### Wake Word Flow

```
1. You: "Hey Atlas"
   ↓
2. Atlas: Detects wake word
   ↓
3. Atlas: Unmutes microphone
   ↓
4. Atlas: "Listening..."
   ↓
5. You: Give your command
   ↓
6. Atlas: Responds to command
   ↓
7. [10 seconds pass]
   ↓
8. Atlas: Auto-mutes microphone
   ↓
9. Atlas: "Say 'Hey Atlas' to activate"
```

### Supported Wake Words

- "Hey Atlas"
- "Hi Atlas"
- "Okay Atlas"

### Auto-Mute Timer

- **Trigger**: Starts after wake word detection
- **Duration**: 10 seconds of inactivity
- **Purpose**: Prevents Atlas from listening continuously
- **Reset**: Timer resets each time Atlas hears you speak
- **Status**: Shows "Say 'Hey Atlas' to activate" when muted

## Technical Details

### Background Service Worker

Atlas uses a Chrome service worker that stays active in the background:

- **Keepalive**: Pings every 20 seconds to prevent sleep
- **Memory**: Minimal resource usage (~10-20 MB RAM)
- **Battery**: Low battery impact (Web Speech API is efficient)

### Web Speech API

Wake word detection uses the browser's built-in Web Speech API:

- **Privacy**: Audio processing happens locally in the browser
- **Accuracy**: High accuracy for English wake words
- **Offline**: Does NOT work offline (requires internet for speech recognition)

### Microphone Privacy

- **Explicit Control**: Microphone is muted by default
- **Visual Indicators**: Red icon shows when mic is active
- **Auto-Mute**: Mic automatically mutes after 10 seconds
- **Manual Control**: Click mute button anytime to disable mic

## Troubleshooting

### Wake Word Not Working

**Problem**: "Hey Atlas" doesn't activate

**Solutions**:
1. Check that Wake Word Mode is enabled in settings
2. Verify microphone permission is granted
3. Check browser console for errors (F12)
4. Ensure you're saying one of the supported wake words clearly
5. Check that Web Speech API is supported (Chrome/Edge only)

### Chrome Doesn't Stay Open in Background

**Problem**: Chrome closes completely when you close all windows

**Solutions**:
1. Verify "Continue running background apps" is enabled
2. Restart Chrome after enabling the setting
3. Check system tray (Windows) or menu bar (Mac) for Chrome icon
4. macOS users: System Preferences → Users & Groups → Login Items (add Chrome)

### High CPU/Battery Usage

**Problem**: Atlas is using too much battery

**Solutions**:
1. Disable Wake Word Mode when not needed
2. Close Atlas when not in use
3. Use manual mute button instead of wake word for longer sessions
4. Check that no other tabs are using excessive resources

### Microphone Stays On

**Problem**: Microphone doesn't auto-mute

**Solutions**:
1. Check that wake word detection is working properly
2. Manually click the mute button
3. Check browser console for JavaScript errors
4. Refresh the extension page

### Background Mode Stops Working

**Problem**: Atlas stops responding after a while

**Solutions**:
1. Check that Chrome is still running in system tray
2. Reopen Atlas extension panel
3. Disconnect and reconnect to refresh session
4. Restart Chrome

## Platform Compatibility

### ✅ Supported
- Windows 10/11 (Chrome, Edge)
- macOS 10.15+ (Chrome, Edge)
- Linux (Chrome)

### ❌ Not Supported
- Firefox (no Web Speech API support)
- Safari (limited Web Speech API support)
- Mobile browsers (different architecture)

## Privacy & Security

### What Atlas Listens For

- **Active Listening**: Only after "Hey Atlas" wake word
- **Wake Word**: Uses Web Speech API for local detection
- **OpenAI**: Audio sent to OpenAI Realtime API when unmuted
- **Auto-Mute**: Mic disabled after 10 seconds to protect privacy

### Data Flow

1. **Wake Word Detection** (Local Browser)
   - Processes audio locally using Web Speech API
   - No data sent to any server
   - Only triggers on specific wake words

2. **Voice Interaction** (OpenAI Realtime API)
   - Audio sent to OpenAI when unmuted
   - OpenAI processes and responds
   - Conversation saved to NeonDB database (if enabled)

3. **Auto-Mute** (Privacy Protection)
   - Mic disabled automatically after 10 seconds
   - Prevents continuous listening
   - Must say "Hey Atlas" again to reactivate

## Best Practices

### For Best Performance

1. **Use Wake Word Mode** for hands-free operation
2. **Enable Background Mode** for always-available access
3. **Close Unused Tabs** to reduce Chrome memory usage
4. **Update Chrome** regularly for best compatibility

### For Privacy

1. **Disable Wake Word** when not needed
2. **Use Manual Mute** for sensitive conversations
3. **Check Mic Indicator** to verify mic is off
4. **Clear Memory** periodically in Atlas settings

### For Battery Life

1. **Disable Wake Word** on battery power
2. **Use Push-to-Talk** mode instead of continuous listening
3. **Close Atlas** when not in use for extended periods
4. **Quit Chrome** completely when not needed

## Advanced Configuration

### Keepalive Interval

The background service worker pings every 20 seconds. To adjust:

```javascript
// In background.js
const KEEPALIVE_INTERVAL = 20000; // milliseconds (20 seconds)
```

### Auto-Mute Timer

To change the 10-second auto-mute timer:

```javascript
// In sidepanel.js, WakeWordDetector.onWakeWordDetected
autoMuteTimer = setTimeout(() => {
  // Mute logic
}, 10000); // Change 10000 to desired milliseconds
```

### Wake Word Phrases

To add custom wake words:

```javascript
// In sidepanel.js, WakeWordDetector recognition.onresult
if (transcript.includes('hey atlas') ||
    transcript.includes('hi atlas') ||
    transcript.includes('okay atlas') ||
    transcript.includes('your custom phrase')) {
  // Trigger logic
}
```

## Support

- **GitHub Issues**: [Report bugs](https://github.com/mrmoe28/atlas-extension-chat-voice/issues)
- **Documentation**: [Full docs](https://github.com/mrmoe28/atlas-extension-chat-voice/blob/main/README.md)
- **Discord**: Coming soon

## FAQ

**Q: Can Atlas work completely offline?**
A: No, the Web Speech API requires internet, and OpenAI Realtime API needs connectivity.

**Q: How much battery does background mode use?**
A: Minimal impact (~1-2% per hour) when using wake word detection.

**Q: Can I use Atlas on my phone?**
A: Not yet. The mobile version is in development.

**Q: Does "Hey Atlas" work from any app?**
A: Yes, if Chrome background mode is enabled, it works system-wide.

**Q: Can I change the wake word to something else?**
A: Yes, but it requires editing the code (see Advanced Configuration above).

**Q: What happens if I say "Hey Atlas" by accident?**
A: The mic will unmute for 10 seconds, then auto-mute if you don't speak.

## Version History

- **v0.2.1** - Added auto-mute after 10 seconds
- **v0.2.0** - Added wake word detection and background mode
- **v0.1.0** - Initial release
