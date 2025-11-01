# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Atlas Voice Panel** is a Chrome Manifest V3 extension that provides voice AI assistance with desktop automation capabilities. It features voice-to-voice communication using OpenAI's Realtime API, desktop command execution, screen capture/vision analysis, and persistent memory storage.

**Architecture**: Hybrid Chrome extension + Vercel-hosted backend server
- **Extension**: Root-level files (manifest.json, sidepanel.html, sidepanel.js, background.js, content.js, styles.css)
- **Server**: Express.js API in `dev/server/` deployed to Vercel
- **Database**: NeonDB PostgreSQL for persistent memory/conversation storage
- **Build Tools**: Scripts in `dev/scripts/` for building, versioning, and releases

## Development Commands

### Extension Development
```bash
# Build extension for distribution
npm run build

# Create release ZIP
npm run build:zip

# Version bumping
npm run bump          # Patch: 0.2.0 → 0.2.1
npm run bump:minor    # Minor: 0.2.0 → 0.3.0
npm run bump:major    # Major: 0.2.0 → 1.0.0

# Create release (builds + prepares for GitHub)
npm run release
```

### Server Development
```bash
cd dev/server

# Install dependencies
npm install

# Run local development server (port 8787)
npm run dev
```

### Testing Extension Locally
1. Build: `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `dev/build-tools/dist/` folder

### Testing with Local Server
1. Start server: `cd dev/server && npm run dev`
2. Open extension settings
3. Change Server URL to `http://localhost:8787`
4. Click "Connect"

## Project Structure

```
atlas-voice-extension/
├── manifest.json              # Extension manifest (root for easy Chrome install)
├── sidepanel.html             # Main UI
├── sidepanel.js               # Extension logic, WebRTC, OpenAI Realtime integration
├── background.js              # Service worker (Manifest V3)
├── content.js                 # Content script for tab interaction
├── styles.css                 # Extension styling
├── assets/                    # Icons and resources
├── lib/                       # Third-party libraries
│   ├── pdf.min.js            # PDF.js for document parsing
│   ├── update-manager.js     # Auto-update logic
│   ├── update-ui.js          # Update banner UI
│   └── version-compare.js    # Version comparison utility
├── dev/
│   ├── server/               # Backend API (Vercel deployment)
│   │   ├── server.js         # Express API server
│   │   ├── database.js       # NeonDB operations
│   │   └── package.json      # Server dependencies
│   ├── scripts/              # Build automation
│   │   ├── build-extension.js    # Builds extension to dist/
│   │   ├── bump-version.js       # Version management
│   │   └── create-release.js     # Release preparation
│   └── build-tools/
│       └── dist/             # Build output (gitignored)
├── extension/                # Secondary manifest location
│   └── manifest.json
├── vercel.json               # Vercel deployment config
└── package.json              # Build scripts
```

## Architecture Details

### Extension Components

**Manifest V3 Structure**:
- **Service Worker** (`background.js`): Handles extension lifecycle, manages connections
- **Side Panel** (`sidepanel.html` + `sidepanel.js`): Main UI, WebRTC connection, voice interaction
- **Content Script** (`content.js`): Injected into web pages for tab interaction

**Key Permissions**:
- `storage`: Settings and state persistence
- `sidePanel`: Side panel UI
- `desktopCapture` + `tabCapture`: Screen capture for vision mode
- `<all_urls>`: Full web access for browser automation
- `notifications` + `alarms`: Update notifications

### Server API Endpoints

**Base URL**: `https://atlas-extension-chat-voice.vercel.app`

**Core Endpoints**:
- `GET /api/ephemeral` - Returns OpenAI API credentials (key, model, endpoint)
- `POST /api/desktop` - Desktop automation commands (file ops, system control)
- `POST /api/vision` - GPT-4 Vision screenshot analysis
- `POST /api/groq` - Groq API chat completions (FREE, uses llama-3.3-70b-versatile)

**Knowledge Base API**:
- `GET /api/knowledge?user_id=X` - Fetch memories, patterns, knowledge
- `POST /api/knowledge/memory` - Save memory entry
- `POST /api/knowledge/clear` - Clear all user memory
- `POST /api/conversation` - Save conversation message
- `GET /api/conversation/:sessionId` - Get conversation history
- `POST /api/pattern` - Save learned pattern
- `POST /api/knowledge/item` - Save knowledge entry

**Update API**:
- `GET /api/updates/check?currentVersion=X` - Check for new releases

### Database Schema (NeonDB)

**Tables**:
- `atlas_memory` - User memories (facts, preferences, context, instructions)
- `atlas_conversations` - Full conversation history
- `atlas_patterns` - Learned command/workflow patterns
- `atlas_knowledge` - Knowledge base entries

**Connection**: Uses `@neondatabase/serverless` with HTTP fetch
**Access**: `process.env.DATABASE_URL` (Vercel env var)

### Voice Integration

**OpenAI Realtime API**:
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Connection: WebRTC via `RTCPeerConnection`
- Audio: Captured from microphone via `getUserMedia()`
- Features: Voice Activity Detection (VAD), function calling, interruption

**Voice Modes**:
- **Push-to-Talk**: Hold button to speak
- **Continuous**: Automatic VAD-based conversation
- **Wake Word**: Say "Hey Atlas" to activate (auto-mutes after 10 seconds of inactivity)

**Desktop Commander Mode**:
- Executes system commands via `/api/desktop` endpoint
- Commands: File operations, app launching, volume control, brightness, lock screen
- Platform support: macOS (primary), Windows, Linux

**Vision Mode**:
- Screen capture via `chrome.desktopCapture` API
- Base64 encoding of screenshots
- GPT-4 Vision analysis via `/api/vision` endpoint

## Build System

### Extension Build Process (`dev/scripts/build-extension.js`)
1. Cleans `dev/build-tools/dist/`
2. Copies root extension files to dist:
   - manifest.json
   - background.js
   - content.js
   - sidepanel.html
   - sidepanel.js
   - styles.css
   - assets/
   - lib/
3. Verifies manifest.json validity
4. Creates ready-to-load Chrome extension

### Version Management (`dev/scripts/bump-version.js`)
- Updates both `manifest.json` files (root + extension/)
- Updates root `package.json`
- Commits version change
- Creates git tag
- Prompts to push tag for auto-release

### Release Process
**Automated via GitHub Actions** (`.github/workflows/release.yml`):
1. Triggered by git tag push: `git tag v0.2.1 && git push origin v0.2.1`
2. Verifies manifest version matches tag
3. Runs `npm run build:zip`
4. Creates GitHub Release with ZIP attachment
5. Auto-generates changelog from commits

**Manual Release**:
```bash
npm run bump          # Updates versions, creates tag
git push origin main
git push origin v0.2.1  # Triggers auto-release
```

## Deployment

### Vercel Server Deployment
**Automatic**: Commits to `main` trigger Vercel deployment
**Configuration**: `vercel.json` routes all traffic to `dev/server/server.js`
**Environment Variables** (set in Vercel dashboard):
- `OPENAI_API_KEY` - Required for Realtime API and Vision
- `DATABASE_URL` - NeonDB connection string (auto-set via Neon integration)
- `OPENAI_REALTIME_MODEL` - Defaults to `gpt-4o-realtime-preview-2024-12-17`

### Extension Distribution
**GitHub Releases**: Users download `atlas-voice-extension.zip`
**Installation**: Extract ZIP → Load unpacked in Chrome
**Auto-Update**: Extension checks GitHub Releases API every 4 hours

## Critical Development Rules

### Manifest V3 Compliance
- **NO background pages** - Use service workers only
- **NO remote code execution** - All code bundled in extension
- **CSP compliance** - PDF.js bundled locally (no CDN)
- **Async service workers** - Keep background.js lightweight

### Version Management
- **Sync versions**: Root manifest.json, extension/manifest.json, and package.json MUST match
- **Use version scripts**: Always use `npm run bump` commands
- **Tag format**: `v0.2.1` (semver with "v" prefix)

### API Key Security
- **NEVER expose keys in extension** - Server-side only
- **Use environment variables** - Vercel env vars for OPENAI_API_KEY and GROQ_API_KEY
- **Credentials endpoint**: Extension fetches key from `/api/ephemeral`
- **Local API keys**: Extension supports storing OpenAI keys locally in localStorage (user preference)

### Extension File Locations
- **Root level**: Extension files live at repository root for easy user installation
- **Dev folder**: Development tools, server code, build artifacts
- **Build output**: `dev/build-tools/dist/` (gitignored)

### Database Operations
- **Check for DB**: Always handle case where `DATABASE_URL` is not set
- **Graceful degradation**: Memory features optional, don't break extension
- **NeonDB serverless**: Uses HTTP fetch, no persistent connections

### Testing
- **Test locally first**: Run server locally before deploying
- **Test production URL**: Verify hosted server after deployment
- **Manual extension testing**: Load unpacked and test all features
- **Check browser console**: Monitor for errors in extension and server logs
- **Jest tests**: Run `npm test` for unit tests (lib/ folder)
- **Playwright tests**: Visual and integration tests in `dev/tests/` (requires extension loaded)

### AI Provider Management
- **Multiple providers**: Supports Browser-Only (local), OpenAI Realtime, Groq API, and Hugging Face
- **Browser-Only mode**: 100% FREE, works offline, no API key required (lib/local-ai.js)
  - Uses browser's Web Speech API for voice input/output
  - Pattern-based local AI for basic conversations
  - Answers time, date, math, help queries
  - Complete privacy - nothing leaves the browser
- **Groq implementation**: FREE text chat via `POST /api/groq` with `llama-3.3-70b-versatile`
- **Hugging Face**: Free alternative using GPT-2 model (lib/huggingface-connector.js)
- **Provider switching**: UI dropdown in settings for user selection
- **Graceful fallback**: Handle API errors and switch providers if needed

## Common Development Tasks

### Adding a New Desktop Command
1. Add case to `dev/server/server.js` `/api/desktop` endpoint
2. Implement platform-specific logic (macOS/Windows/Linux)
3. Test command execution with proper error handling
4. Update function calling schema in extension if needed

### Adding a New API Endpoint
1. Define route in `dev/server/server.js`
2. Add CORS handling if needed (already enabled globally)
3. Implement database operations via `database.js` if needed
4. Test endpoint locally, then deploy to Vercel

### Adding a New AI Provider
1. Create connector class in `lib/` (see `lib/huggingface-connector.js` as example)
2. Add backend endpoint in `dev/server/server.js` (see `/api/groq` example)
3. Update UI dropdown in `sidepanel.html` (AI Provider section)
4. Add switching logic in `sidepanel.js`
5. Test with various prompts and error scenarios
6. Update documentation and error messages

### Running Tests
```bash
# Jest unit tests (lib/ components)
npm test
npm run test:watch  # Watch mode

# Playwright integration tests (requires extension loaded)
cd dev/tests
npx playwright test
npx playwright test --ui  # Interactive mode
npx playwright test --debug  # Debug mode
```

### Updating OpenAI Realtime Model
1. Update `OPENAI_REALTIME_MODEL` in Vercel environment variables
2. Optional: Update default in `vercel.json`
3. Extension will automatically use new model on next connection

### Debugging Extension Issues
1. **Check browser console** (DevTools in side panel)
2. **Check service worker** (`chrome://extensions` → "Inspect views: service worker")
3. **Check server logs** (Vercel dashboard or local terminal)
4. **Verify API key** (server logs show first 7 chars)
5. **Test microphone** (grant permissions, check settings)
6. **Review ERROR_SOLUTIONS.md** for common errors and fixes

### Deploying a New Version
```bash
# 1. Make changes and test locally
npm run build
# Load unpacked from dev/build-tools/dist/

# 2. Bump version
npm run bump  # or bump:minor, bump:major

# 3. Push changes
git push origin main

# 4. Push tag to trigger release
git push origin v0.2.1

# 5. Verify release on GitHub
# Extension auto-updates within 4 hours
```

### Fixing Vercel Deployment Issues
```bash
# Check current deployments
vercel ls

# Set correct alias if production URL broken
vercel alias set <deployment-url> atlas-voice-extension.vercel.app

# Verify environment variables are set
# Check Vercel dashboard → Settings → Environment Variables
# Required: OPENAI_API_KEY, GROQ_API_KEY, DATABASE_URL
```

## Key Technical Details

### Extension Architecture Patterns
- **Service Worker (background.js)**: Minimal logic, handles alarms for update checks
- **Side Panel (sidepanel.js)**: Main application logic (~3,500 lines), handles:
  - WebRTC connection to OpenAI Realtime API
  - Browser Speech Recognition as fallback
  - Web Speech Synthesis for text-to-speech
  - AI provider switching (OpenAI, Groq, Hugging Face)
  - localStorage for settings persistence
  - Function calling for desktop commands
- **Content Script (content.js)**: Injected into all pages for browser automation
  - Click, type, scroll, form filling
  - Screenshot capture
  - Tab manipulation

### State Management
- **localStorage**: API keys, server URLs, voice mode preferences, AI provider selection
- **chrome.storage.local**: Update notifications, error logs, extension state
- **Global variables in sidepanel.js**: WebRTC connection state, audio contexts, conversation history

### Audio Pipeline
- **OpenAI Realtime**: getUserMedia() → WebRTC → OpenAI → Audio playback
- **Browser-Only Mode** (lib/local-ai.js + lib/web-speech-handler.js):
  - 100% browser-based, no external APIs
  - webkitSpeechRecognition → Local AI pattern matching → Web Speech Synthesis
  - Pattern-based responses (greetings, time, date, math, help)
  - Completely private - no data sent to any server
- **Browser Speech Fallback** (lib/web-speech-handler.js):
  - Uses webkitSpeechRecognition for voice input
  - Web Speech Synthesis for text-to-speech output
  - Supports continuous and interim results
  - Configurable language settings
  - Used when OpenAI Realtime API unavailable or for non-OpenAI providers
- **Groq/HuggingFace**: Browser Speech Recognition → Text API → Web Speech Synthesis

### Error Handling
- **lib/error-handler.js**: Centralized retry logic with exponential backoff (3 retries, 2s base delay)
- **ERROR_SOLUTIONS.md**: Documents common errors, root causes, and solutions with code examples
  - Update manager network errors
  - Chrome extension permission errors
  - Storage quota issues
  - Development guidelines for logging and retry logic
- **Graceful degradation**: Features fail independently without breaking extension
- **Error storage**: Failed operations stored in chrome.storage.local for debugging

### Recent Major Changes (v0.3.x)
- **NEW**: Browser-Only Mode (100% FREE, no API key needed, works offline!)
- Added local API key storage (users can use their own OpenAI keys)
- Implemented Groq API integration (FREE alternative)
- Added Hugging Face connector (FREE, uses GPT-2)
- Enhanced web automation (click, type, fill forms by voice)
- Fixed microphone permission handling issues
- Improved error logging and user feedback
- UI automatically hides API key fields when Browser-Only mode selected

## Code Organization & File Purposes

### Core Extension Files (Root Level)
- **sidepanel.js** - Main application logic, WebRTC, AI integration (~3,500 lines)
  - DO NOT split into modules (breaks CSP compliance)
  - Contains all voice interaction logic
  - Handles provider switching, function calling, error handling
- **background.js** - Service worker, update checks, extension lifecycle
- **content.js** - Injected into web pages for automation (~1,500 lines)
- **sidepanel.html** - Main UI, settings panel, conversation display
- **styles.css** - All extension styling, themes, animations (~1,000 lines)

### Library Files (lib/)
**Note**: These ARE modular ES6 classes (export/import allowed in lib/ folder despite CSP restrictions on main extension files)
- **local-ai.js** - Browser-only local AI (100% FREE, no API key needed, works offline)
- **update-manager.js** - Auto-update logic, GitHub Release API integration
- **update-ui.js** - Update notification banner
- **version-compare.js** - Semantic version comparison utility
- **pdf.min.js** - PDF.js bundled (CSP-compliant, no CDN)
- **huggingface-connector.js** - Hugging Face API integration (FREE AI provider, uses GPT-2)
- **groq-connector.js** - Groq API integration (FREE, llama-3.3-70b-versatile)
- **web-speech-handler.js** - Browser Web Speech API wrapper (fallback when OpenAI unavailable)
- **error-handler.js** - Retry logic with exponential backoff (static utility class)

### Server Files (dev/server/)
- **server.js** - Express API, all endpoints (~700 lines)
- **database.js** - NeonDB operations, memory/conversation storage
- **package.json** - Server dependencies (separate from root)

### Build System (dev/scripts/)
- **build-extension.js** - Copies files to dist/, validates manifest
- **bump-version.js** - Updates versions in manifest + package.json
- **create-release.js** - Prepares GitHub release

### Testing (dev/tests/)
- **playwright.config.js** - Playwright test configuration
- **test-*.spec.js** - Playwright integration tests for UI
- **Root package.json** - Jest configuration for unit tests

## Important Notes

- **Microphone permissions**: Extension must handle permission denied gracefully
- **WebRTC connection**: Requires valid OPENAI_API_KEY from server OR user's local key
- **Screen capture**: Requires additional user permission prompt
- **Cross-browser**: Currently Chrome-only (uses Chrome-specific APIs)
- **Update mechanism**: GitHub Releases API used for version checking
- **Server URL**: Configurable in settings, defaults to Vercel deployment
- **localStorage persistence**: Settings persist across sessions but not in incognito mode
- **CSP Compliance**: Cannot load external scripts or use eval() - all code must be bundled
