# Atlas Voice Extension - Features Documentation

## Overview

Atlas Voice Panel is a Chrome Manifest V3 extension that provides voice AI assistance with desktop automation capabilities. It features voice-to-voice communication using OpenAI's Realtime API, desktop command execution, screen capture/vision analysis, and persistent memory storage.

**Architecture**: Hybrid Chrome extension + Vercel-hosted backend server
- **Extension**: Root-level files (manifest.json, sidepanel.html, sidepanel.js, background.js, content.js, styles.css)
- **Server**: Express.js API in `dev/server/` deployed to Vercel
- **Database**: NeonDB PostgreSQL for persistent memory/conversation storage

---

## Table of Contents

1. [Voice Interaction Features](#voice-interaction-features)
2. [Desktop Automation](#desktop-automation)
3. [Vision & Screen Analysis](#vision--screen-analysis)
4. [Memory & Knowledge Base](#memory--knowledge-base)
5. [User Interface](#user-interface)
6. [Extension Architecture](#extension-architecture)
7. [Backend API](#backend-api)
8. [Auto-Update System](#auto-update-system)
9. [Security Features](#security-features)
10. [Configuration](#configuration)
11. [Platform Compatibility](#platform-compatibility)
12. [Troubleshooting](#troubleshooting)

---

## Voice Interaction Features

### Voice Modes

#### 1. Push-to-Talk Mode
**Description**: Hold button to speak, release to send

**How to Use**:
1. Click and hold the microphone button
2. Speak your message
3. Release button to send

**Best For**:
- Controlled conversations
- Noisy environments
- Precise command input

**Permissions Required**: Microphone access

**Troubleshooting**:
- If mic doesn't activate, check browser permissions at `chrome://settings/content/microphone`
- Ensure no other application is blocking microphone access
- Try refreshing the extension

#### 2. Continuous Mode
**Description**: Automatic Voice Activity Detection (VAD)

**How to Use**:
1. Toggle continuous mode button ON
2. Start speaking naturally
3. AI automatically detects when you're done speaking

**Best For**:
- Natural conversation flow
- Hands-free operation
- Extended dialogues

**Permissions Required**: Microphone access

**Troubleshooting**:
- If AI interrupts too early, speak louder or more continuously
- Background noise may trigger VAD - use push-to-talk in noisy environments
- Adjust microphone sensitivity in system settings

#### 3. Wake Word Mode (Planned)
**Status**: UI placeholder, not yet implemented

**Planned Features**:
- Custom wake word configuration
- Always-listening mode
- Local wake word detection for privacy

### OpenAI Realtime API Integration

**Technical Details**:
- **Model**: `gpt-4o-realtime-preview-2024-12-17`
- **Connection**: WebRTC via `RTCPeerConnection`
- **Audio**: 16-bit PCM, 24kHz sample rate
- **Latency**: < 500ms typical response time

**Features**:
- Low-latency voice responses
- Natural conversation flow
- Interruption support (can speak over AI)
- Function calling for commands
- Contextual memory retention

**Code Example** (Internal):
```javascript
// WebRTC connection setup
const pc = new RTCPeerConnection();
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(stream.getAudioTracks()[0]);

// Data channel for function calling
const dataChannel = pc.createDataChannel('oai-events');
```

**Troubleshooting**:
- **No response**: Check server connection status
- **Garbled audio**: Verify internet connection stability
- **Long delays**: Server may be under load, try reconnecting

---

## Desktop Automation

### Desktop Commander Mode

The extension can execute system commands on your computer via voice or text commands.

**Security Note**: Commands are executed server-side with your explicit permission. Always review commands before enabling automation.

### File Operations

#### Open Files
**Command Examples**:
```
"Open my resume"
"Open the file at /Users/username/Documents/report.pdf"
```

**Functionality**:
- Opens files with default application
- Supports full file paths
- Cross-platform compatible

**Permissions Required**: None (uses system default handlers)

#### Open Folders
**Command Examples**:
```
"Open my documents folder"
"Show me the downloads directory"
"Open /Users/username/Desktop"
```

**Functionality**:
- Opens folders in file explorer/finder
- Works with shortcuts (Desktop, Documents, Downloads)

#### Create Files
**Command Examples**:
```
"Create a file called notes.txt in my documents"
"Make a new file at /path/to/file.json with content {...}"
```

**Functionality**:
- Creates new files with optional content
- Creates parent directories if needed

#### Delete Files
**Command Examples**:
```
"Delete the file old_report.pdf"
"Remove /path/to/temp/file.txt"
```

**Functionality**:
- Moves files to trash/recycle bin (safe delete)
- Supports force delete with confirmation

⚠️ **Warning**: Deletion is permanent. Use with caution.

#### Move/Copy Files
**Command Examples**:
```
"Move report.pdf to my documents folder"
"Copy config.json to /backup/config.json"
```

**Functionality**:
- Move or copy files between directories
- Preserves file metadata

### System Control

#### Volume Control
**Command Examples**:
```
"Set volume to 50%"
"Volume up"
"Mute the system"
"Unmute"
```

**Functionality**:
- Adjust system volume 0-100%
- Increment/decrement volume
- Mute/unmute

**Platform Support**:
- macOS: `osascript` commands
- Windows: `nircmd` or PowerShell
- Linux: `amixer` or `pactl`

#### Brightness Control
**Command Examples**:
```
"Set brightness to 75%"
"Turn brightness up"
"Dim the screen"
```

**Functionality**:
- Adjust display brightness
- Increment/decrement levels

**Platform Support**:
- macOS: `brightness` utility
- Windows: PowerShell WMI
- Linux: `xrandr` or `brightnessctl`

#### Lock Screen
**Command Examples**:
```
"Lock my computer"
"Lock the screen"
```

**Functionality**:
- Immediately locks workstation
- Requires password to unlock

**Platform Commands**:
- macOS: `pmset displaysleepnow`
- Windows: `rundll32.exe user32.dll,LockWorkStation`
- Linux: `loginctl lock-session`

#### Application Launcher
**Command Examples**:
```
"Launch Spotify"
"Open Chrome"
"Start Visual Studio Code"
```

**Functionality**:
- Opens applications by name
- Searches system PATH and common locations
- Cross-platform app name resolution

**Supported Apps** (examples):
- Browsers: Chrome, Firefox, Safari, Edge
- Productivity: VS Code, Sublime Text, Atom
- Communication: Slack, Discord, Teams
- Media: Spotify, iTunes, VLC
- And more...

### Desktop API Endpoint

**Endpoint**: `POST /api/desktop`

**Request Format**:
```json
{
  "command": "open_file",
  "parameters": {
    "path": "/Users/username/Documents/file.pdf"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "File opened successfully",
  "output": "..."
}
```

**Available Commands**:
- `open_file` - Open a file
- `open_folder` - Open a folder
- `create_file` - Create a new file
- `delete_file` - Delete a file
- `move_file` - Move/rename a file
- `copy_file` - Copy a file
- `set_volume` - Set system volume
- `volume_up` - Increase volume
- `volume_down` - Decrease volume
- `set_brightness` - Set display brightness
- `brightness_up` - Increase brightness
- `brightness_down` - Decrease brightness
- `lock_screen` - Lock the workstation
- `launch_app` - Launch application

### Troubleshooting Desktop Commands

**Command Not Working**:
- Check server logs for error messages
- Verify file paths are absolute and correct
- Ensure application names match installed apps

**Permission Denied**:
- macOS: Grant "Accessibility" permission to Terminal/Node
- Windows: Run server as Administrator if needed
- Linux: Check file permissions and ownership

**Platform-Specific Issues**:
- macOS: Some commands require Accessibility permissions
- Windows: May need to install additional utilities (nircmd)
- Linux: Commands vary by desktop environment

---

## Vision & Screen Analysis

### Vision Mode Overview

The extension can capture your screen and analyze it using GPT-4 Vision, enabling AI to "see" what you're seeing.

**Use Cases**:
- Describe what's on your screen
- Analyze UI layouts or designs
- Read text from images or screenshots
- Identify objects or content in applications
- Debug visual issues
- Get help with software interfaces

### Screen Capture

**Technology**: Chrome `desktopCapture` API

**Capture Types**:
1. **Full Screen** - Entire display
2. **Application Window** - Specific app window
3. **Chrome Tab** - Current or specific tab
4. **Desktop Area** - Custom region (not yet implemented)

**Permissions Required**:
- `desktopCapture` permission in manifest
- User approval per session (security requirement)

**How to Use**:
1. Click "Vision Mode" or say "What's on my screen?"
2. Chrome shows screen picker dialog
3. Select what to share (screen/window/tab)
4. Click "Share" to capture
5. AI analyzes and describes the content

**Example Commands**:
```
"What's on my screen?"
"Describe this window"
"Read the text on screen"
"What am I looking at?"
"Analyze this UI"
"Help me understand this interface"
```

### GPT-4 Vision Integration

**Model**: GPT-4 with Vision capabilities

**API Endpoint**: `POST /api/vision`

**Request Format**:
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "prompt": "Describe what's in this image"
}
```

**Response Format**:
```json
{
  "description": "I can see a Chrome browser window with...",
  "details": {
    "elements": ["..."],
    "text": ["..."],
    "suggestions": ["..."]
  }
}
```

**Image Processing**:
- **Format**: PNG (base64 encoded)
- **Max Size**: 20MB (API limit)
- **Resolution**: Automatically scaled if needed
- **Quality**: High quality for text readability

### Vision Workflow

```mermaid
User Request → Screen Capture → Base64 Encoding →
API Call → GPT-4 Vision → Analysis → Response
```

1. User requests screen analysis
2. Extension captures screenshot via `chrome.desktopCapture`
3. Image converted to base64 PNG
4. Sent to `/api/vision` endpoint
5. Server forwards to OpenAI GPT-4 Vision
6. AI analyzes and generates description
7. Response spoken via voice or displayed in chat

### Vision Examples

**Example 1: UI Analysis**
```
User: "What's on my screen?"
AI: "I can see a code editor with a JavaScript file open.
     The file appears to be a React component with several
     imports at the top and a functional component definition.
     There's a syntax error on line 24 - you're missing a
     closing curly brace."
```

**Example 2: Document Reading**
```
User: "Read the text on my screen"
AI: "The document is titled 'Q4 Sales Report' and shows
     a table with the following data: January: $45,000,
     February: $52,000, March: $48,500..."
```

**Example 3: Design Feedback**
```
User: "What do you think of this design?"
AI: "This appears to be a landing page mockup. The layout
     is clean with good use of whitespace. I notice the
     CTA button could be more prominent - consider using
     a brighter color or larger size..."
```

### Troubleshooting Vision Mode

**Screen Capture Fails**:
- Grant permission when Chrome prompts
- Try restarting the extension
- Check Chrome permissions at `chrome://extensions`

**Analysis Takes Too Long**:
- Large images may take 10-30 seconds to process
- Check internet connection
- Server logs may show API timeouts

**Poor Quality Analysis**:
- Ensure screen content is clearly visible
- Higher resolution captures work better for text
- Try capturing specific windows instead of full screen

**Privacy Concerns**:
- Screenshots are NOT stored permanently
- Images sent to OpenAI API (see OpenAI privacy policy)
- Disable vision mode if handling sensitive information

---

## Memory & Knowledge Base

### Persistent Memory System

The extension maintains long-term memory across sessions using a NeonDB PostgreSQL database.

**Benefits**:
- AI remembers you across sessions
- Personalized responses based on past conversations
- Learns your preferences and patterns
- Maintains conversation context

### Memory Types

#### 1. Personal Memory
**What It Stores**:
- User preferences (e.g., "I prefer TypeScript over JavaScript")
- Personal facts (e.g., "I'm a frontend developer in SF")
- Context (e.g., "Working on Project Atlas")
- Custom instructions (e.g., "Always use semicolons in code")

**Example**:
```
User: "Remember that I prefer React over Vue"
AI: "Got it, I'll remember you prefer React"

[Later session]
User: "Help me build a component"
AI: "I'll create a React component for you since that's your preference"
```

#### 2. Conversation History
**What It Stores**:
- Full message transcripts
- Session IDs for grouping conversations
- Timestamps and metadata
- Voice vs text indicators

**Use Cases**:
- "What did we talk about yesterday?"
- "Remind me of the solution we discussed"
- "Continue our previous conversation"

#### 3. Pattern Learning
**What It Stores**:
- Frequently used commands
- Common workflows
- Command variations and aliases
- Usage frequency and context

**Example**:
```
[After multiple uses]
User: "Open my work folder"
AI: *Learns "work folder" means /Users/you/Projects*
AI: *Automatically opens correct path*
```

#### 4. Knowledge Base
**What It Stores**:
- Learned information
- Reference materials
- Domain-specific knowledge
- Categorized entries

**Example**:
```
User: "Remember that our API endpoint is api.example.com/v2"
AI: "I've saved that to your knowledge base"

[Later]
User: "What's our API endpoint?"
AI: "It's api.example.com/v2"
```

### Memory API

#### Fetch All Memory
**Endpoint**: `GET /api/knowledge?user_id={userId}`

**Response**:
```json
{
  "memories": [...],
  "conversations": [...],
  "patterns": [...],
  "knowledge": [...]
}
```

#### Save Memory
**Endpoint**: `POST /api/knowledge/memory`

**Request**:
```json
{
  "userId": "user123",
  "content": "User prefers dark mode",
  "type": "preference",
  "category": "ui"
}
```

#### Save Conversation
**Endpoint**: `POST /api/conversation`

**Request**:
```json
{
  "sessionId": "session_abc123",
  "userId": "user123",
  "role": "user",
  "content": "What's the weather?",
  "timestamp": "2025-10-29T10:30:00Z"
}
```

#### Clear Memory
**Endpoint**: `POST /api/knowledge/clear`

**Request**:
```json
{
  "userId": "user123"
}
```

⚠️ **Warning**: This permanently deletes all memory data.

### Database Schema

#### atlas_memory Table
```sql
CREATE TABLE atlas_memory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT,  -- 'fact', 'preference', 'context', 'instruction'
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### atlas_conversations Table
```sql
CREATE TABLE atlas_conversations (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

#### atlas_patterns Table
```sql
CREATE TABLE atlas_patterns (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  context TEXT,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### atlas_knowledge Table
```sql
CREATE TABLE atlas_knowledge (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Memory Commands

**Save Memory**:
```
"Remember that [information]"
"Save this: [information]"
"Store in memory: [information]"
```

**Retrieve Memory**:
```
"What do you know about me?"
"What do you remember?"
"Tell me my preferences"
```

**Clear Memory**:
```
"Forget everything"
"Clear my memory"
"Delete all my data"
```

**Conversation History**:
```
"What did we talk about?"
"Show me our conversation history"
"What did I ask you earlier?"
```

### Privacy & Data Management

**Data Storage**:
- All data stored in NeonDB PostgreSQL
- User-specific isolation (queries filtered by user_id)
- No cross-user data leakage

**Data Access**:
- Only accessible via authenticated API calls
- Server-side validation of user_id
- No public endpoints for memory data

**Data Deletion**:
- User can clear all memory at any time
- Permanent deletion (no recovery)
- GDPR-compliant data removal

**Opt-Out**:
- Memory features can be disabled
- Extension works without database connection
- All features remain functional without memory

### Troubleshooting Memory

**Memory Not Saving**:
- Check DATABASE_URL environment variable is set
- Verify NeonDB connection in server logs
- Extension degrades gracefully if DB unavailable

**Memory Not Loading**:
- Verify user_id is consistent across sessions
- Check API endpoint `/api/knowledge` returns data
- Clear browser cache and reconnect

**Wrong User Data**:
- Ensure user_id generation is consistent
- Check server logs for user_id values
- May need to clear and restart with new user_id

---

## User Interface

### Side Panel Layout

The extension uses Chrome's side panel API for a persistent, non-intrusive interface.

**Components**:

#### 1. Header Section
- **Extension Title**: "Atlas Voice Panel"
- **Connection Status**: Green (Connected) / Red (Disconnected) / Yellow (Connecting)
- **Settings Button**: Access configuration panel

#### 2. Conversation Display
- **Message History**: Scrollable conversation log
- **Message Types**:
  - User messages (right-aligned, blue)
  - AI responses (left-aligned, gray)
  - System messages (centered, italic)
- **Timestamps**: Relative time (e.g., "2 minutes ago")
- **Auto-scroll**: Follows latest message

#### 3. Voice Controls
- **Microphone Button**: Large circular button
  - Gray (inactive)
  - Blue (listening - push-to-talk)
  - Pulsing animation (active)
  - Red (error state)
- **Mode Toggle**: Switch between Push-to-Talk / Continuous
- **Wake Word Toggle**: Placeholder for future feature

#### 4. Status Indicators
- **Listening**: Animated waveform visualization
- **Speaking**: AI response indicator
- **Thinking**: Processing dots animation
- **Error**: Red alert with message

#### 5. Settings Panel
- **Server URL**: Editable input field
- **Connection Test**: "Test Connection" button
- **Memory Controls**: "Clear Memory" button
- **Mode Selection**: Radio buttons for voice modes
- **About**: Version info and links

### Visual States

#### Connected State
```
[✓] Connected to Atlas Server
[Blue Microphone Icon]
[Conversation visible]
```

#### Listening State (Push-to-Talk)
```
[🎤 Listening...] (Animated)
[Blue pulsing circle around mic]
[Sound waveform animation]
```

#### Listening State (Continuous)
```
[🎤 Continuous Mode Active]
[Persistent blue indicator]
[VAD visualization]
```

#### AI Speaking State
```
[🗣️ Atlas is speaking...]
[Sound wave visualization]
[Stop button to interrupt]
```

#### Error State
```
[❌ Connection Error]
[Red background on status]
[Error message displayed]
[Retry/Settings buttons]
```

### Settings Panel

**Accessible Via**: Gear icon in header

**Options**:

#### Server Configuration
- **Server URL**: Text input
  - Default: `https://atlas-extension-chat-voice.vercel.app`
  - Local dev: `http://localhost:8787`
  - Custom deployments supported
- **Test Connection**: Button to verify server reachability
- **Auto-Connect**: Toggle to connect on startup

#### Voice Settings
- **Mode Selection**:
  - ○ Push-to-Talk (default)
  - ○ Continuous
  - ○ Wake Word (disabled, coming soon)
- **Microphone**: System default (future: device selection)

#### Memory Settings
- **Enable Memory**: Toggle to use persistent memory
- **Clear Memory**: Button with confirmation dialog
- **Export Memory**: (Planned feature)

#### About Section
- **Version**: Current extension version
- **Server Version**: API version
- **GitHub**: Link to repository
- **Report Issue**: Link to GitHub issues
- **Check for Updates**: Manual update check button

### Keyboard Shortcuts

**Planned Features** (not yet implemented):
- `Ctrl/Cmd + M`: Toggle microphone
- `Ctrl/Cmd + S`: Open settings
- `Ctrl/Cmd + K`: Clear conversation
- `Esc`: Stop AI speaking

### Responsive Design

- **Minimum Width**: 320px
- **Recommended Width**: 400-600px
- **Scrollable**: Content adapts to panel height
- **Font Scaling**: Respects browser zoom settings

### Accessibility

**Current Features**:
- High contrast mode compatible
- Keyboard navigation (partial)
- Screen reader labels (partial)
- Visual and text status indicators

**Planned Improvements**:
- Full keyboard navigation
- ARIA labels for all interactive elements
- Screen reader announcements for AI responses
- High contrast theme option

### Troubleshooting UI Issues

**Panel Not Opening**:
- Check extension is enabled at `chrome://extensions`
- Right-click extension icon → "Open side panel"
- Try reloading extension

**Layout Issues**:
- Zoom to 100% in Chrome settings
- Clear browser cache
- Reload extension

**Controls Not Responding**:
- Check browser console for errors (DevTools)
- Verify microphone permissions
- Reconnect to server

---

## Extension Architecture

### Chrome Extension Components

#### Manifest V3 Structure

**manifest.json** (Root):
```json
{
  "manifest_version": 3,
  "name": "Atlas Voice Panel",
  "version": "0.2.0",
  "permissions": [
    "storage",
    "sidePanel",
    "desktopCapture",
    "tabCapture",
    "notifications",
    "alarms"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### Service Worker (background.js)

**Purpose**: Handles extension lifecycle and background tasks

**Responsibilities**:
- Extension installation/update events
- Alarm scheduling for update checks
- Message passing between components
- Background API calls (if needed)

**Key Features**:
```javascript
// Update checking
chrome.alarms.create('updateCheck', { periodInMinutes: 240 });

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First-time setup
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Route messages between components
});
```

### Side Panel (sidepanel.html + sidepanel.js)

**Purpose**: Main user interface and logic

**Responsibilities**:
- WebRTC connection management
- OpenAI Realtime API integration
- Microphone access and audio streaming
- UI rendering and state management
- Settings persistence

**Key Features**:
```javascript
// WebRTC setup
async function connectToAI() {
  const pc = new RTCPeerConnection();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(stream.getAudioTracks()[0]);

  // Data channel for function calling
  const dataChannel = pc.createDataChannel('oai-events');

  // SDP offer/answer exchange
  // ...
}

// Settings storage
chrome.storage.local.set({ serverUrl: '...' });
chrome.storage.local.get(['serverUrl'], (result) => { ... });
```

### Content Script (content.js)

**Purpose**: Interact with web pages (currently minimal)

**Potential Use Cases**:
- Browser automation commands
- Page content extraction
- Form filling
- Tab manipulation

**Current Implementation**: Placeholder for future features

### Communication Flow

```
User Interaction (Side Panel)
        ↓
Service Worker (Background)
        ↓
API Server (Vercel)
        ↓
External Services (OpenAI, NeonDB)
```

### Permissions Breakdown

#### storage
**Purpose**: Save settings and state locally
**Usage**: Server URL, user preferences, session data
**Privacy**: All data local to user's browser

#### sidePanel
**Purpose**: Display side panel UI
**Usage**: Chrome's Side Panel API
**Privacy**: No data collection

#### desktopCapture
**Purpose**: Capture screen for vision mode
**Usage**: Screenshot analysis with GPT-4 Vision
**Privacy**: Images sent to OpenAI, not stored

#### tabCapture
**Purpose**: Capture tab audio/video (future feature)
**Usage**: Planned for tab-specific automation
**Privacy**: Not yet implemented

#### <all_urls>
**Purpose**: Access all websites
**Usage**: Browser automation commands
**Privacy**: No data collection, read-only access

#### notifications
**Purpose**: Show update notifications
**Usage**: Alert user of new version availability
**Privacy**: No external data sent

#### alarms
**Purpose**: Schedule background tasks
**Usage**: Periodic update checks (every 4 hours)
**Privacy**: No external data sent

### Data Flow

#### Voice Interaction Flow
```
1. User speaks into microphone
2. Audio captured via getUserMedia()
3. Audio streamed via WebRTC to OpenAI
4. OpenAI processes and responds
5. Response audio played in browser
6. Text transcript shown in UI
7. Conversation saved to database (if enabled)
```

#### Desktop Command Flow
```
1. User voice command or text
2. AI interprets command intent
3. Function call sent via data channel
4. Extension validates command
5. API request to /api/desktop
6. Server executes command
7. Result returned to extension
8. UI updated with success/error
```

#### Vision Analysis Flow
```
1. User requests screen analysis
2. Chrome shows screen picker
3. User selects screen/window/tab
4. Screenshot captured
5. Image converted to base64
6. API request to /api/vision
7. GPT-4 Vision analyzes image
8. Description returned
9. AI speaks/displays result
```

---

## Backend API

### Server Architecture

**Technology**: Express.js on Node.js
**Hosting**: Vercel Edge Functions
**Database**: NeonDB PostgreSQL (serverless)

**Location**: `dev/server/server.js`

### Core Endpoints

#### GET /api/ephemeral
**Purpose**: Provide OpenAI API credentials to extension

**Response**:
```json
{
  "apiKey": "sk-proj-...",
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "endpoint": "https://api.openai.com/v1/realtime"
}
```

**Security**: API key never exposed in extension code

**Usage**:
```javascript
const response = await fetch(`${serverUrl}/api/ephemeral`);
const { apiKey, model } = await response.json();
```

#### POST /api/desktop
**Purpose**: Execute desktop automation commands

**Request**:
```json
{
  "command": "open_file",
  "parameters": {
    "path": "/Users/username/Documents/file.pdf"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "File opened successfully",
  "output": "Process ID: 12345"
}
```

**Supported Commands**: See [Desktop Automation](#desktop-automation) section

**Error Response**:
```json
{
  "success": false,
  "error": "File not found",
  "message": "The specified file does not exist"
}
```

#### POST /api/vision
**Purpose**: Analyze screenshots with GPT-4 Vision

**Request**:
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "prompt": "Describe what's in this image in detail"
}
```

**Response**:
```json
{
  "success": true,
  "description": "I can see a code editor with JavaScript...",
  "model": "gpt-4-vision-preview"
}
```

**Image Limits**:
- Max size: 20MB
- Format: PNG, JPEG, WebP
- Encoding: Base64

**Error Handling**:
- Image too large: Automatic resizing
- Invalid format: Error message
- API timeout: Retry logic

### Knowledge Base Endpoints

#### GET /api/knowledge
**Purpose**: Retrieve all user memory

**Query Parameters**:
- `user_id` (required): User identifier

**Response**:
```json
{
  "memories": [
    {
      "id": 1,
      "content": "User prefers TypeScript",
      "type": "preference",
      "category": "development",
      "created_at": "2025-10-29T10:00:00Z"
    }
  ],
  "conversations": [...],
  "patterns": [...],
  "knowledge": [...]
}
```

#### POST /api/knowledge/memory
**Purpose**: Save new memory entry

**Request**:
```json
{
  "userId": "user123",
  "content": "User prefers dark mode",
  "type": "preference",
  "category": "ui"
}
```

**Response**:
```json
{
  "success": true,
  "id": 42,
  "message": "Memory saved successfully"
}
```

#### POST /api/knowledge/clear
**Purpose**: Delete all user memory

**Request**:
```json
{
  "userId": "user123"
}
```

**Response**:
```json
{
  "success": true,
  "deleted": {
    "memories": 15,
    "conversations": 142,
    "patterns": 8,
    "knowledge": 23
  }
}
```

⚠️ **Warning**: This action is permanent and cannot be undone.

#### POST /api/conversation
**Purpose**: Save conversation message

**Request**:
```json
{
  "sessionId": "session_abc123",
  "userId": "user123",
  "role": "user",
  "content": "What's the weather like?",
  "timestamp": "2025-10-29T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "id": 245
}
```

#### GET /api/conversation/:sessionId
**Purpose**: Retrieve conversation history

**Response**:
```json
{
  "sessionId": "session_abc123",
  "messages": [
    {
      "id": 244,
      "role": "user",
      "content": "What's the weather like?",
      "timestamp": "2025-10-29T10:30:00Z"
    },
    {
      "id": 245,
      "role": "assistant",
      "content": "I don't have access to current weather data...",
      "timestamp": "2025-10-29T10:30:02Z"
    }
  ]
}
```

#### POST /api/pattern
**Purpose**: Save learned pattern

**Request**:
```json
{
  "userId": "user123",
  "pattern": "open work folder",
  "context": "/Users/username/Projects",
  "frequency": 5
}
```

**Response**:
```json
{
  "success": true,
  "id": 12
}
```

### Update System Endpoint

#### GET /api/updates/check
**Purpose**: Check for new extension version

**Query Parameters**:
- `currentVersion` (required): Current extension version (e.g., "0.2.0")

**Response (Update Available)**:
```json
{
  "updateAvailable": true,
  "latestVersion": "0.3.0",
  "downloadUrl": "https://github.com/.../atlas-voice-extension.zip",
  "releaseNotes": "- Added wake word detection\n- Improved vision mode...",
  "releaseDate": "2025-10-30"
}
```

**Response (No Update)**:
```json
{
  "updateAvailable": false,
  "currentVersion": "0.2.0",
  "latestVersion": "0.2.0"
}
```

### Environment Variables

**Required**:
```env
OPENAI_API_KEY=sk-proj-...
```

**Optional**:
```env
DATABASE_URL=postgresql://...  # Auto-set by Vercel Neon integration
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
```

### CORS Configuration

```javascript
app.use(cors({
  origin: ['chrome-extension://*'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

### Error Handling

**Standard Error Response**:
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": { /* Optional additional context */ }
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing API key)
- `404` - Not Found (invalid endpoint)
- `500` - Internal Server Error

### Rate Limiting

**Current**: No rate limiting (trusted extension only)

**Planned**:
- Per-user rate limits
- Endpoint-specific limits
- Graceful degradation

### API Testing

**Local Testing**:
```bash
cd dev/server
npm install
npm run dev

# Test endpoint
curl http://localhost:8787/api/ephemeral
```

**Production Testing**:
```bash
curl https://atlas-extension-chat-voice.vercel.app/api/ephemeral
```

---

## Auto-Update System

### Update Mechanism

The extension automatically checks for updates every 4 hours using GitHub Releases API.

**Components**:
- `lib/update-manager.js` - Update checking logic
- `lib/update-ui.js` - Update notification banner
- `lib/version-compare.js` - Semantic version comparison

### Update Flow

```
1. Chrome alarm triggers every 4 hours
2. background.js calls checkForUpdates()
3. Fetch latest release from GitHub API
4. Compare versions (current vs latest)
5. Store update info in chrome.storage
6. Show notification banner in side panel
7. User clicks "Download" or "Dismiss"
8. Download link opens GitHub release page
```

### Update Checking

**Endpoint**: GitHub Releases API
```
GET https://api.github.com/repos/USERNAME/atlas-voice-extension/releases/latest
```

**Response**:
```json
{
  "tag_name": "v0.3.0",
  "name": "Version 0.3.0",
  "body": "Release notes markdown...",
  "assets": [
    {
      "name": "atlas-voice-extension.zip",
      "browser_download_url": "https://..."
    }
  ],
  "published_at": "2025-10-30T12:00:00Z"
}
```

### Version Comparison

**Algorithm**: Semantic versioning (semver)

```javascript
function compareVersions(v1, v2) {
  // "0.2.0" vs "0.3.0"
  const [major1, minor1, patch1] = v1.split('.').map(Number);
  const [major2, minor2, patch2] = v2.split('.').map(Number);

  if (major1 !== major2) return major2 - major1;
  if (minor1 !== minor2) return minor2 - minor1;
  return patch2 - patch1;
}
```

**Returns**:
- `> 0` - v2 is newer (update available)
- `0` - Same version (no update)
- `< 0` - v1 is newer (impossible in production)

### Update Notification

**Banner UI**:
```
╔════════════════════════════════════════════╗
║ 🎉 Update Available: v0.3.0                ║
║                                            ║
║ - Added wake word detection                ║
║ - Improved vision mode performance         ║
║                                            ║
║ [Download Update]  [Dismiss]               ║
╚════════════════════════════════════════════╝
```

**Behavior**:
- Non-intrusive (doesn't block usage)
- Dismissible (won't show again for this version)
- Persistent until dismissed or updated
- Shows release notes preview

### Manual Update Check

**Settings Panel**:
- "Check for Updates" button
- Shows current version
- Shows latest version
- Direct link to GitHub releases

### Update Installation

**Process**:
1. User clicks "Download Update"
2. GitHub release page opens
3. User downloads `atlas-voice-extension.zip`
4. User extracts ZIP
5. Chrome: `chrome://extensions` → Load unpacked
6. Select extracted folder
7. Extension updates and reloads

**Automatic Installation**: Not possible due to Chrome security restrictions (manual review required)

### Skipping Updates

**User Choice**: Can dismiss update notification

**Stored in chrome.storage**:
```javascript
{
  dismissedVersion: "0.3.0",
  lastChecked: "2025-10-29T14:00:00Z"
}
```

### Update Frequency

**Default**: Every 4 hours (240 minutes)

**Configurable**: Edit `background.js`:
```javascript
chrome.alarms.create('updateCheck', {
  periodInMinutes: 240  // Change this value
});
```

### Troubleshooting Updates

**Update Not Detected**:
- Check GitHub releases exist
- Verify version tags match format `vX.Y.Z`
- Check browser console for API errors
- Manually trigger check in settings

**Banner Not Showing**:
- Check chrome.storage for dismissal
- Verify update-ui.js is loaded
- Check for JavaScript errors in console

**Download Fails**:
- GitHub may be rate-limiting (try later)
- Check internet connection
- Download manually from GitHub releases page

---

## Security Features

### API Key Protection

**Never Exposed in Extension**:
- API keys stored in Vercel environment variables
- Extension fetches from `/api/ephemeral` endpoint
- Keys never in extension code or storage

**Server-Side Only**:
```javascript
// ✅ GOOD (server.js)
const apiKey = process.env.OPENAI_API_KEY;

// ❌ BAD (sidepanel.js)
const apiKey = "sk-proj-...";  // NEVER DO THIS
```

### Credential Handling

**Fetch Credentials Flow**:
```javascript
// Extension requests credentials
const response = await fetch(`${serverUrl}/api/ephemeral`);
const { apiKey, model } = await response.json();

// Use for WebRTC connection only
// API key kept in memory, never persisted
```

**Security Measures**:
- API key sent over HTTPS only
- Key used immediately for WebRTC connection
- Not stored in chrome.storage
- Expires when session ends

### Screen Capture Privacy

**User Consent**:
- Chrome shows picker dialog for every capture
- User explicitly selects what to share
- No automatic capturing without permission

**Data Handling**:
- Screenshots sent to OpenAI for analysis
- Not stored on server
- Not saved in database
- Temporary memory only during processing

**Privacy Options**:
- User can disable vision mode entirely
- Option to review before sending (planned)
- Sensitive content warning (planned)

### Microphone Access

**Permission Flow**:
1. Extension requests microphone access
2. Chrome shows permission prompt
3. User grants/denies permission
4. Permission persists until revoked

**Privacy Controls**:
- Visual indicator when microphone active
- Push-to-talk mode for controlled access
- Easy to disconnect/disable

**Data Handling**:
- Audio streamed directly to OpenAI via WebRTC
- Not recorded on server
- Not stored in database (unless conversation history enabled)

### Database Security

**NeonDB Serverless**:
- PostgreSQL with HTTPS connections
- Connection pooling and SSL
- Row-level security (planned)

**Data Isolation**:
```sql
-- All queries filtered by user_id
SELECT * FROM atlas_memory WHERE user_id = $1;
```

**No Cross-User Access**:
- Each user's data isolated
- Server validates user_id
- No shared data between users

### CORS Configuration

**Allowed Origins**:
```javascript
cors({
  origin: ['chrome-extension://*'],
  methods: ['GET', 'POST'],
  credentials: true
})
```

**Restrictions**:
- Only Chrome extensions can call API
- Web browsers blocked
- No public access to endpoints

### Content Security Policy

**Manifest V3 CSP**:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**Restrictions**:
- No remote code execution
- No eval() or inline scripts
- All code bundled with extension

### Permissions Justification

**storage**: Settings and state
**sidePanel**: UI display
**desktopCapture**: Vision mode (user consent)
**tabCapture**: Future features (not yet used)
**<all_urls>**: Browser automation (read-only)
**notifications**: Update alerts
**alarms**: Background tasks

**No Analytics**: Extension collects no telemetry or usage data

### Best Practices

**For Users**:
- Review permissions before installing
- Keep extension updated
- Revoke microphone access when not in use
- Clear memory if sharing device
- Use strong server URL (HTTPS only)

**For Developers**:
- Never commit API keys
- Use environment variables
- Validate all inputs server-side
- Sanitize database queries
- Log security events

---

## Configuration

### Extension Settings

**Accessible Via**: Settings button (gear icon) in side panel

#### Server URL
**Default**: `https://atlas-extension-chat-voice.vercel.app`

**Custom URL**:
1. Open settings
2. Edit "Server URL" field
3. Click "Save"
4. Click "Test Connection" to verify
5. Reconnect to AI

**Local Development**:
```
http://localhost:8787
```

**Custom Deployment**:
```
https://your-vercel-app.vercel.app
```

#### Auto-Connect
**Description**: Automatically connect to AI on extension startup

**Options**:
- ✅ Enabled (default) - Connects immediately
- ❌ Disabled - Manual connection required

**Use Cases**:
- Disable if server is unreliable
- Disable to save API costs
- Enable for seamless experience

#### Voice Mode
**Options**:
- Push-to-Talk (default)
- Continuous
- Wake Word (not yet available)

**Saved**: Persists across sessions

#### Memory
**Enable Memory**: Toggle for persistent memory features

**Options**:
- ✅ Enabled - Save conversations and learning
- ❌ Disabled - Ephemeral sessions only

**Clear Memory**: Button to delete all stored data

### Storage Configuration

**Location**: `chrome.storage.local`

**Stored Data**:
```javascript
{
  // Server settings
  serverUrl: "https://...",
  autoConnect: true,

  // Voice settings
  voiceMode: "pushToTalk",  // or "continuous", "wakeWord"

  // Memory settings
  memoryEnabled: true,
  userId: "user_abc123",

  // Update settings
  dismissedVersion: "0.2.0",
  lastUpdateCheck: "2025-10-29T14:00:00Z",

  // Session data
  lastSessionId: "session_xyz789"
}
```

**Access in Code**:
```javascript
// Save setting
chrome.storage.local.set({ serverUrl: 'https://...' });

// Load setting
chrome.storage.local.get(['serverUrl'], (result) => {
  console.log(result.serverUrl);
});
```

### Server Configuration

**Environment Variables** (Vercel):

```env
# Required
OPENAI_API_KEY=sk-proj-...

# Optional
DATABASE_URL=postgresql://...  # Auto-set by Neon integration
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
NODE_ENV=production
```

**Setting Environment Variables**:
1. Go to Vercel dashboard
2. Select project
3. Go to Settings → Environment Variables
4. Add/edit variables
5. Redeploy for changes to take effect

### Vercel Deployment

**vercel.json**:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/dev/server/server.js" }
  ],
  "builds": [
    { "src": "dev/server/server.js", "use": "@vercel/node" }
  ]
}
```

**Deployment**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Automatic Deployment**:
- Push to `main` branch triggers deployment
- GitHub integration required

### Database Configuration

**NeonDB Setup**:
1. Install Vercel Neon integration
2. `DATABASE_URL` auto-set in environment
3. No manual configuration needed

**Connection String Format**:
```
postgresql://user:password@host/database?sslmode=require
```

**Connection in Code**:
```javascript
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

// Query
const results = await sql`SELECT * FROM atlas_memory WHERE user_id = ${userId}`;
```

### Extension Development

**package.json Scripts**:
```json
{
  "scripts": {
    "build": "node dev/scripts/build-extension.js",
    "build:zip": "node dev/scripts/create-release.js",
    "bump": "node dev/scripts/bump-version.js patch",
    "bump:minor": "node dev/scripts/bump-version.js minor",
    "bump:major": "node dev/scripts/bump-version.js major",
    "release": "npm run bump && npm run build:zip"
  }
}
```

**Build Configuration**:
- Source: Root-level extension files
- Output: `dev/build-tools/dist/`
- Gitignored: dist/ folder not committed

---

## Platform Compatibility

### Browser Support

#### Google Chrome
**Status**: ✅ Fully Supported

**Requirements**:
- Chrome 88+ (Manifest V3 support)
- Desktop only (not mobile)

**Features**:
- All features fully functional
- Best performance
- Primary development target

**Installation**:
1. Download from GitHub releases
2. Extract ZIP
3. `chrome://extensions` → Load unpacked
4. Select extracted folder

#### Microsoft Edge
**Status**: ⚠️ Likely Compatible (Untested)

**Notes**:
- Chromium-based (should work)
- Same extension API as Chrome
- Not officially tested
- Community feedback welcome

**Installation**: Same as Chrome

#### Brave Browser
**Status**: ⚠️ Likely Compatible (Untested)

**Notes**:
- Chromium-based
- May have stricter privacy settings
- Extension permissions may require additional approval

#### Firefox
**Status**: ❌ Not Compatible

**Reasons**:
- Different Web Extension manifest
- Different side panel API
- WebRTC implementation differences
- Would require separate build

**Future**: May support with Firefox-specific build

#### Safari
**Status**: ❌ Not Compatible

**Reasons**:
- Different extension model
- Different APIs
- Requires Xcode and Apple Developer account
- Would require complete rewrite

**Future**: Low priority due to complexity

### Operating System Support

#### Desktop Commander Compatibility

##### macOS
**Status**: ✅ Fully Supported

**Version**: macOS 10.14+

**Commands**:
- File operations: `open`, `rm`, `mv`, `cp`
- Volume control: `osascript -e 'set volume...'`
- Brightness: `brightness` utility
- Lock screen: `pmset displaysleepnow`
- App launching: `open -a`

**Requirements**:
- Accessibility permissions (for some commands)
- Terminal app permissions

##### Windows
**Status**: ⚠️ Basic Support (Community Tested)

**Version**: Windows 10+

**Commands**:
- File operations: `explorer`, `del`, `move`, `copy`
- Volume control: `nircmd` or PowerShell
- Brightness: PowerShell WMI
- Lock screen: `rundll32.exe user32.dll,LockWorkStation`
- App launching: `start`

**Requirements**:
- PowerShell 5.0+
- Optional: nircmd utility for advanced features

**Known Issues**:
- Some commands require Administrator privileges
- Path handling differences (backslash vs forward slash)

##### Linux
**Status**: ⚠️ Basic Support (Community Tested)

**Version**: Most modern distributions

**Commands**:
- File operations: `xdg-open`, `rm`, `mv`, `cp`
- Volume control: `amixer` or `pactl`
- Brightness: `xrandr` or `brightnessctl`
- Lock screen: `loginctl lock-session` or `xdg-screensaver lock`
- App launching: Desktop file execution

**Requirements**:
- X11 or Wayland
- Common utilities installed (varies by distro)

**Known Issues**:
- Desktop environment differences (GNOME, KDE, etc.)
- Permissions vary by distro
- Sound system differences (ALSA, PulseAudio, PipeWire)

#### Voice Features Compatibility

**All Platforms**: ✅ Supported

**Requirements**:
- Modern browser (Chrome 88+)
- Microphone
- Internet connection
- WebRTC support

**Platform-Specific Notes**:
- macOS: Native microphone permission dialog
- Windows: Windows privacy settings for microphone
- Linux: Microphone access via PulseAudio or PipeWire

### Mobile Support

#### Chrome on Android
**Status**: ❌ Not Supported

**Reasons**:
- Chrome for Android doesn't support extensions
- No side panel API on mobile
- Desktop capture not available

**Future**: Separate mobile app possible

#### Safari on iOS
**Status**: ❌ Not Supported

**Reasons**:
- iOS Safari extensions very limited
- No microphone access for extensions
- Different architecture required

**Future**: Native iOS app possible

### System Requirements

**Minimum**:
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- Storage: 50 MB for extension
- Internet: 1 Mbps broadband

**Recommended**:
- CPU: Quad-core 2.5 GHz+
- RAM: 8 GB+
- Storage: 100 MB+
- Internet: 5+ Mbps broadband

**Microphone**:
- Any USB or built-in microphone
- 16-bit, 24 kHz sample rate recommended
- Noise-cancelling microphone preferred

---

## Troubleshooting

### Common Issues

#### Extension Won't Connect

**Symptoms**:
- Red "Disconnected" status
- "Failed to connect" error message
- No response when clicking connect

**Solutions**:

1. **Check Server URL**:
   - Open Settings
   - Verify URL is correct: `https://atlas-extension-chat-voice.vercel.app`
   - Click "Test Connection"

2. **Check Internet Connection**:
   - Open browser and visit google.com
   - Check if other websites work
   - Disable VPN if using one

3. **Check Server Status**:
   - Visit server URL in browser
   - Should show "Atlas Voice API is running"
   - Check Vercel dashboard for deployment status

4. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for error messages
   - Common errors:
     - CORS errors: Server configuration issue
     - Network errors: Internet connection
     - 401 errors: Missing API key on server

5. **Reload Extension**:
   - Go to `chrome://extensions`
   - Find "Atlas Voice Panel"
   - Click reload button (circular arrow)

#### Microphone Not Working

**Symptoms**:
- No response when speaking
- Microphone button doesn't activate
- "Permission denied" error

**Solutions**:

1. **Grant Microphone Permission**:
   - Chrome will prompt on first use
   - Click "Allow" when prompted
   - Check `chrome://settings/content/microphone`

2. **Check System Microphone**:
   - macOS: System Preferences → Security & Privacy → Microphone
   - Windows: Settings → Privacy → Microphone
   - Linux: Check PulseAudio/PipeWire settings

3. **Test Microphone**:
   - Use another app (Voice Recorder, Zoom, etc.)
   - Verify microphone works system-wide
   - Check microphone isn't muted

4. **Check Browser Permissions**:
   - `chrome://settings/content/microphone`
   - Ensure Chrome can access microphone
   - Remove and re-grant permission

5. **Try Different Browser**:
   - Test in Incognito mode (grants fresh permissions)
   - Try different Chromium browser

#### Vision Mode Not Working

**Symptoms**:
- Screen picker doesn't appear
- "Permission denied" for screen capture
- Black image or no image captured

**Solutions**:

1. **Grant Screen Capture Permission**:
   - Click "Vision Mode" or say "What's on my screen?"
   - Chrome will show picker dialog
   - Select screen/window/tab
   - Click "Share"

2. **Check Extension Permissions**:
   - `chrome://extensions`
   - Verify "desktopCapture" permission enabled
   - Reload extension if needed

3. **macOS Specific**:
   - System Preferences → Security & Privacy → Screen Recording
   - Ensure Chrome is allowed
   - May need to restart Chrome after granting permission

4. **Windows Specific**:
   - Check Windows Privacy settings
   - Ensure Chrome can record screen

5. **Try Different Capture Type**:
   - If "Entire Screen" fails, try "Window" or "Chrome Tab"
   - Some windows may be protected (e.g., banking apps)

#### Desktop Commands Not Working

**Symptoms**:
- "Command failed" error
- Commands don't execute
- Permission denied errors

**Solutions**:

1. **Check Platform Support**:
   - macOS: Best support
   - Windows/Linux: Basic support, may need additional setup

2. **macOS Accessibility Permission**:
   - System Preferences → Security & Privacy → Accessibility
   - Add Terminal or your terminal emulator
   - Restart server after granting permission

3. **Windows Administrator**:
   - Some commands require Administrator privileges
   - Right-click and "Run as Administrator" if running server locally

4. **Check File Paths**:
   - Use absolute paths, not relative
   - macOS/Linux: `/Users/username/file.txt`
   - Windows: `C:\Users\username\file.txt`
   - Use correct path separators for platform

5. **Check Server Logs**:
   - Vercel dashboard → Logs
   - Look for error messages
   - May reveal missing dependencies or permissions

#### Memory Not Persisting

**Symptoms**:
- AI doesn't remember past conversations
- "Memory not available" message
- Fresh start every session

**Solutions**:

1. **Check Database Connection**:
   - Verify `DATABASE_URL` set in Vercel
   - Check Neon integration installed
   - Test database query in server logs

2. **Enable Memory in Settings**:
   - Open Settings
   - Ensure "Enable Memory" is checked
   - Reconnect to AI

3. **Check User ID**:
   - User ID must be consistent across sessions
   - Check chrome.storage for userId
   - May need to clear and regenerate

4. **Graceful Degradation**:
   - Extension works without database
   - Memory features simply disabled
   - No functionality lost

#### Update Notification Not Showing

**Symptoms**:
- No update banner despite new version
- "Check for Updates" shows nothing

**Solutions**:

1. **Manual Update Check**:
   - Open Settings
   - Click "Check for Updates"
   - Wait for response

2. **Check GitHub Releases**:
   - Visit repository on GitHub
   - Click "Releases"
   - Verify new release exists

3. **Check Version Format**:
   - Release tags must be `vX.Y.Z` format
   - Verify current version in manifest.json

4. **Clear Dismissed Updates**:
   - Open DevTools
   - `chrome.storage.local.remove('dismissedVersion')`
   - Check again

5. **Check Alarms**:
   - Background.js logs alarm triggers
   - Verify alarm is scheduled
   - May need to reinstall extension

### Error Messages

#### "Failed to connect to Atlas server"
**Cause**: Server unreachable or offline

**Solutions**:
- Check internet connection
- Verify server URL in settings
- Check Vercel deployment status

#### "Microphone permission denied"
**Cause**: Browser doesn't have microphone access

**Solutions**:
- Grant permission when prompted
- Check Chrome settings for microphone access
- Check system privacy settings

#### "OpenAI API key not configured"
**Cause**: Missing or invalid API key on server

**Solutions**:
- Check `OPENAI_API_KEY` in Vercel environment variables
- Verify key is valid (starts with `sk-proj-`)
- Redeploy after setting key

#### "Database connection failed"
**Cause**: NeonDB not configured or unreachable

**Solutions**:
- Install Neon integration in Vercel
- Verify `DATABASE_URL` environment variable
- Check Neon dashboard for database status
- Extension will work without database (memory disabled)

#### "Screen capture permission denied"
**Cause**: User didn't allow screen sharing or system blocks it

**Solutions**:
- Click "Share" in Chrome picker dialog
- Grant system permissions (macOS Screen Recording)
- Try different capture type

#### "Command execution failed"
**Cause**: Desktop command couldn't execute

**Solutions**:
- Check file paths are valid
- Verify platform support for command
- Check server logs for details
- Grant required system permissions

### Performance Issues

#### Slow Response Times
**Causes**: Network latency, API overload, server cold start

**Solutions**:
- Check internet speed (need 5+ Mbps)
- Try different time of day
- Vercel may be cold starting (first request slow)
- Check OpenAI API status

#### High CPU/Memory Usage
**Causes**: WebRTC connection, audio processing

**Solutions**:
- Disconnect when not in use
- Close other Chrome tabs
- Restart browser
- Check for memory leaks in DevTools

#### Audio Stuttering
**Causes**: Network instability, CPU overload

**Solutions**:
- Close other bandwidth-heavy applications
- Check network stability (no packet loss)
- Lower other CPU usage
- Try wired connection instead of Wi-Fi

### Getting Help

**Browser Console Logs**:
1. Open side panel
2. Right-click → "Inspect"
3. Check Console tab for errors

**Server Logs**:
1. Visit Vercel dashboard
2. Select project
3. Go to "Logs" tab
4. Look for error messages

**GitHub Issues**:
- Report bugs: https://github.com/.../issues
- Include:
  - Extension version
  - Browser version
  - Operating system
  - Error messages
  - Steps to reproduce

**Community Support**:
- Check existing GitHub issues
- Search for similar problems
- Ask questions in Discussions

---

## Developer Guide

### Local Development

#### Extension Development
```bash
# Build extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select dev/build-tools/dist/
```

#### Server Development
```bash
cd dev/server

# Install dependencies
npm install

# Run locally (port 8787)
npm run dev

# Test endpoint
curl http://localhost:8787/api/ephemeral
```

#### Connect Extension to Local Server
1. Build and load extension
2. Open extension settings
3. Change Server URL to `http://localhost:8787`
4. Click "Save" and "Connect"

### Building for Distribution

#### Version Bumping
```bash
npm run bump          # Patch: 0.2.0 → 0.2.1
npm run bump:minor    # Minor: 0.2.0 → 0.3.0
npm run bump:major    # Major: 0.2.0 → 1.0.0
```

**What It Does**:
- Updates `manifest.json` (root and extension/)
- Updates `package.json`
- Creates git commit
- Creates git tag

#### Creating a Release
```bash
npm run release
```

**What It Does**:
1. Bumps version
2. Builds extension
3. Creates ZIP file
4. Prepares for GitHub release

#### GitHub Release (Automated)
```bash
# Push tag to trigger workflow
git push origin main
git push origin v0.2.1
```

**What Happens**:
1. GitHub Actions workflow runs
2. Verifies manifest version
3. Builds extension
4. Creates ZIP
5. Creates GitHub Release
6. Attaches ZIP file
7. Generates changelog

### API Development

#### Adding New Endpoint
```javascript
// dev/server/server.js

app.post('/api/new-feature', async (req, res) => {
  try {
    const { param1, param2 } = req.body;

    // Your logic here

    res.json({ success: true, data: {...} });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### Testing New Endpoint
```bash
# Local
curl -X POST http://localhost:8787/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"param1":"value1"}'

# Production
curl -X POST https://atlas-extension-chat-voice.vercel.app/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"param1":"value1"}'
```

### Database Development

#### Adding New Table
```javascript
// Run migration (in server.js or separate script)
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS new_table (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

await sql(createTableQuery);
```

#### Querying Data
```javascript
// Using @neondatabase/serverless
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

// Query with parameters (prevents SQL injection)
const results = await sql`
  SELECT * FROM atlas_memory
  WHERE user_id = ${userId}
  ORDER BY created_at DESC
`;
```

### Extension Development

#### Adding New UI Feature
1. Edit `sidepanel.html` for structure
2. Edit `styles.css` for styling
3. Edit `sidepanel.js` for logic
4. Test in Chrome
5. Build for distribution

#### Adding New Background Task
```javascript
// background.js

// Create alarm
chrome.alarms.create('myTask', { periodInMinutes: 60 });

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'myTask') {
    // Your task logic here
  }
});
```

### Testing

#### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Server connection succeeds
- [ ] Microphone permission granted
- [ ] Push-to-talk mode works
- [ ] Continuous mode works
- [ ] Screen capture works
- [ ] Vision analysis works
- [ ] Desktop commands execute
- [ ] Memory saves and loads
- [ ] Settings persist
- [ ] Update check works

#### Automated Testing (Future)
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for extension flow

### Deployment

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Automatic Deployment**:
- Push to `main` branch
- Vercel auto-deploys
- Takes 1-2 minutes

#### Extension Distribution
1. Create GitHub Release
2. Users download ZIP
3. Users load unpacked in Chrome
4. Auto-update notifies of new versions

### Best Practices

**Code Quality**:
- Use ES6+ features
- Comment complex logic
- Handle all errors
- Validate all inputs

**Security**:
- Never commit API keys
- Use environment variables
- Validate server-side
- Sanitize database queries

**Version Management**:
- Use semantic versioning
- Keep manifests in sync
- Tag all releases
- Write clear commit messages

**Documentation**:
- Update CLAUDE.md for major changes
- Update FEATURES.md for new features
- Update README.md for setup changes
- Comment complex code

---

## Command Reference

### Voice Commands Quick Reference

#### Desktop Control
```
"Open [app name]"               → Launch application
"Open [file path]"              → Open file
"Open [folder path]"            → Open folder
"Set volume to [0-100]%"        → Set system volume
"Volume up/down"                → Adjust volume
"Mute"                          → Mute system
"Set brightness to [0-100]%"    → Set display brightness
"Brightness up/down"            → Adjust brightness
"Lock my computer"              → Lock workstation
```

#### Vision & Screen
```
"What's on my screen?"          → Capture and analyze screen
"Describe this window"          → Analyze current window
"Read the text on screen"       → OCR screen content
"What am I looking at?"         → General screen description
```

#### Memory & Context
```
"Remember that [info]"          → Save to memory
"What do you know about me?"    → Retrieve memories
"Forget everything"             → Clear all memory
"What did we talk about?"       → Conversation history
```

#### Settings & Control
```
"Connect"                       → Connect to AI server
"Disconnect"                    → Disconnect from server
"Change voice mode"             → Switch interaction mode
"Open settings"                 → Open settings panel
```

### Keyboard Shortcuts (Planned)

```
Ctrl/Cmd + M                    → Toggle microphone
Ctrl/Cmd + S                    → Open settings
Ctrl/Cmd + K                    → Clear conversation
Esc                             → Stop AI speaking
Space (hold)                    → Push-to-talk (when focused)
```

---

## Roadmap

### Current Version: 0.2.0

**Implemented Features**:
- ✅ Voice-to-voice AI communication
- ✅ Push-to-talk and continuous modes
- ✅ Desktop automation commands
- ✅ Screen capture and vision analysis
- ✅ Persistent memory system
- ✅ Auto-update mechanism
- ✅ Settings configuration

### Planned for v0.3.0

**Wake Word Detection**:
- Custom wake word configuration
- Local wake word processing
- Always-listening mode

**Enhanced Memory**:
- Memory search functionality
- Memory categories and tags
- Memory export/import

**UI Improvements**:
- Dark mode
- Custom themes
- Resizable panels

### Planned for v0.4.0

**Advanced Automation**:
- Multi-step workflows
- Scheduled commands
- Conditional logic
- Command aliases

**Browser Integration**:
- Tab automation
- Form filling
- Content extraction
- Bookmark management

### Planned for v1.0.0

**Cross-Platform**:
- Firefox extension
- Safari extension (maybe)
- Linux full support

**Mobile**:
- iOS app
- Android app
- Mobile-optimized UI

**Enterprise**:
- Team collaboration
- Shared knowledge base
- Admin controls
- SSO integration

### Long-Term Vision

**AI Capabilities**:
- Multiple AI model support
- Custom fine-tuned models
- Specialized agent modes

**Integration**:
- Calendar integration
- Email integration
- Task management
- CRM systems

**Platform Expansion**:
- Desktop app (Electron)
- Web app (standalone)
- API for third-party integration

---

## Version History

### 0.2.0 (Current)
**Release Date**: 2025-10-29

**Added**:
- Desktop automation commands
- Screen capture and vision mode
- Persistent memory system with NeonDB
- Auto-update mechanism
- Settings configuration panel

**Improved**:
- WebRTC connection stability
- Error handling and user feedback
- Documentation and setup guides

### 0.1.0 (Initial Release)
**Release Date**: 2025-10-15

**Features**:
- Basic voice-to-voice communication
- OpenAI Realtime API integration
- Push-to-talk mode
- Side panel UI
- Chrome Manifest V3 compliance

---

## FAQ

**Q: Is my voice data stored?**
A: No, audio is streamed directly to OpenAI via WebRTC. Only text transcripts are saved if memory is enabled.

**Q: Can I use my own OpenAI API key?**
A: Currently no, the extension uses server-provided credentials. Self-hosted server option planned.

**Q: Does it work offline?**
A: No, requires internet connection for AI communication.

**Q: How much does it cost?**
A: The extension is free. Server API costs depend on OpenAI usage (pay-as-you-go).

**Q: Is it safe to use for work?**
A: Use caution with sensitive information. Screenshots and conversations may be sent to OpenAI. Review their privacy policy.

**Q: Can I contribute?**
A: Yes! Contributions welcome. See GitHub repository for guidelines.

**Q: Why Chrome only?**
A: Manifest V3 and side panel API are Chrome-specific. Firefox support possible in future.

**Q: How do I delete my data?**
A: Open settings and click "Clear Memory". This permanently deletes all stored data.

---

*Last Updated: 2025-10-29*
*Extension Version: 0.2.0*
*Documentation Version: 1.0*

---

## Appendix

### Technical Specifications

**Extension**:
- Manifest Version: 3
- Chrome Version: 88+
- Size: ~500 KB (installed)

**Server**:
- Runtime: Node.js 18+
- Framework: Express.js
- Hosting: Vercel Edge Functions
- Region: Auto (global)

**Database**:
- PostgreSQL 14+
- Hosting: NeonDB Serverless
- Connection: HTTP fetch (no persistent connections)

**AI**:
- Model: GPT-4 Realtime (December 2024 preview)
- Audio: 16-bit PCM, 24kHz
- Latency: <500ms typical

### API Rate Limits

**OpenAI Realtime API**:
- Dependent on OpenAI account tier
- Typically 500 requests/day (free tier)
- See OpenAI docs for current limits

**NeonDB**:
- Free tier: 3 GB storage
- Connection pooling handled by Neon
- See Neon docs for current limits

**Vercel**:
- Free tier: 100 GB bandwidth/month
- Function execution: 100 GB-hours/month
- See Vercel docs for current limits

### Browser Compatibility Matrix

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 88+ | ✅ Supported | Primary target |
| Edge | 88+ | ⚠️ Untested | Should work |
| Brave | Latest | ⚠️ Untested | Should work |
| Opera | Latest | ⚠️ Untested | May work |
| Firefox | Any | ❌ Not supported | Different APIs |
| Safari | Any | ❌ Not supported | Different model |

### Platform Compatibility Matrix

| OS | Desktop Commands | Voice | Vision | Notes |
|----|-----------------|-------|--------|-------|
| macOS | ✅ Full | ✅ Full | ✅ Full | Best support |
| Windows | ⚠️ Basic | ✅ Full | ✅ Full | Some commands limited |
| Linux | ⚠️ Basic | ✅ Full | ✅ Full | Varies by distro |

### File Structure Reference

```
atlas-voice-extension/
├── manifest.json              # Extension manifest (root)
├── sidepanel.html             # Main UI
├── sidepanel.js               # Extension logic
├── background.js              # Service worker
├── content.js                 # Content script
├── styles.css                 # Styling
├── assets/
│   └── icon*.png              # Extension icons
├── lib/
│   ├── pdf.min.js            # PDF.js library
│   ├── update-manager.js     # Update checking
│   ├── update-ui.js          # Update banner
│   └── version-compare.js    # Version comparison
├── dev/
│   ├── server/
│   │   ├── server.js         # Express API
│   │   ├── database.js       # DB operations
│   │   └── package.json      # Server deps
│   ├── scripts/
│   │   ├── build-extension.js
│   │   ├── bump-version.js
│   │   └── create-release.js
│   └── build-tools/
│       └── dist/             # Build output
├── docs/
│   └── FEATURES.md           # This file
├── extension/
│   └── manifest.json         # Secondary manifest
├── .github/
│   └── workflows/
│       └── release.yml       # Auto-release workflow
├── vercel.json               # Vercel config
├── package.json              # Build scripts
└── README.md                 # Setup guide
```

---

## Glossary

**Manifest V3**: Latest Chrome extension platform (more secure, service worker based)

**Side Panel**: Chrome UI feature for persistent panel alongside browser

**WebRTC**: Real-time communication protocol for audio/video streaming

**Service Worker**: Background script that runs independently of web pages

**Content Script**: JavaScript injected into web pages

**OpenAI Realtime API**: Voice-to-voice AI communication API

**NeonDB**: Serverless PostgreSQL database platform

**Vercel**: Hosting platform for serverless functions and static sites

**VAD**: Voice Activity Detection (auto-detect when user is speaking)

**Push-to-Talk**: Hold button to speak, release to send

**Continuous Mode**: AI listens continuously, auto-detects speech

**Desktop Commander**: Feature for executing system commands

**Vision Mode**: Screen capture and AI visual analysis

**Memory System**: Persistent storage of conversations and learnings

**Auto-Update**: Automatic check and notification for new versions

---

**End of Documentation**
