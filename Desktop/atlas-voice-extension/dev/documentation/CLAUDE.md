# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atlas Extension Chat Voice - A browser extension/application featuring chat and voice interaction capabilities.

## Project Status

**INITIAL SETUP REQUIRED** - This is a new project. Before beginning development:

1. Determine the project type:
   - Browser Extension (Chrome/Firefox/Safari)
   - Next.js 15 web application
   - Electron desktop application
   - Other

2. Set up the appropriate tech stack based on project type

## Technology Stack (To Be Determined)

### For Next.js Web App (Recommended Default):
- Next.js 15.5.3+ (App Router)
- React 19.1.1+
- TypeScript 5.9.2+
- Tailwind CSS 4.1.13+
- ShadCN UI (latest)
- NeonDB (PostgreSQL)
- Vercel (deployment)

### For Browser Extension:
- TypeScript
- React or Vanilla JS
- Manifest V3
- Chrome Extensions API / WebExtensions API
- Background service workers
- Content scripts architecture

## Architecture Considerations

### Voice Capabilities
- **Speech Recognition**: Web Speech API or external service (Deepgram, AssemblyAI)
- **Text-to-Speech**: Web Speech API or ElevenLabs/Google TTS
- **Audio Processing**: Consider MediaRecorder API, AudioContext
- **Microphone Permissions**: Handle browser permission flow

### Chat Capabilities
- **AI Integration**: OpenAI API, Anthropic Claude API, or other LLM
- **Message Storage**: IndexedDB (browser) or NeonDB (server)
- **Real-time Updates**: Server-Sent Events or WebSockets
- **Message History**: Implement pagination and search

### Extension Architecture (If Browser Extension)
- **Popup UI**: Main interaction point (React component)
- **Background Script**: Handle API calls, state management
- **Content Scripts**: Page interaction (if needed)
- **Storage**: chrome.storage.local/sync for settings and history
- **Permissions**: activeTab, storage, identity (for OAuth)

## Development Setup (Once Tech Stack Is Chosen)

### Next.js Application:
```bash
# Initialize project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack

# Install core dependencies
npm install zod next-themes

# Install ShadCN
npx shadcn@latest init
npx shadcn@latest add button input form card dialog

# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

### Browser Extension:
```bash
# Initialize with TypeScript
npm init -y
npm install --save-dev typescript @types/chrome webpack webpack-cli ts-loader

# Build extension
npm run build

# Load in browser
# Chrome: chrome://extensions -> Load unpacked -> dist/
```

## Required Project Structure

### Next.js App Structure:
```
atlas-chat-voice/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── chat/
│   │   └── api/
│   ├── components/
│   │   ├── ui/              # ShadCN components
│   │   ├── chat/            # Chat UI components
│   │   └── voice/           # Voice control components
│   ├── lib/
│   │   ├── speech.ts        # Voice utilities
│   │   ├── ai.ts            # AI/LLM integration
│   │   └── storage.ts       # Data persistence
│   ├── hooks/
│   │   ├── use-speech-recognition.ts
│   │   └── use-chat.ts
│   └── types/
│       └── chat.ts
├── public/
├── CONTEXT.md               # Project state and decisions
└── next.config.ts
```

### Browser Extension Structure:
```
atlas-extension/
├── src/
│   ├── popup/               # Extension popup UI
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── background/          # Service worker
│   │   └── index.ts
│   ├── content/             # Content scripts (if needed)
│   │   └── index.ts
│   ├── lib/
│   │   ├── speech.ts
│   │   └── storage.ts
│   └── types/
├── public/
│   ├── manifest.json
│   └── icons/
└── webpack.config.js
```

## Voice Integration Guidelines

### Speech Recognition Setup:
```typescript
// Use Web Speech API or external service
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = 'en-US'

// Handle results
recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('')
}
```

### Text-to-Speech Setup:
```typescript
// Web Speech API
const utterance = new SpeechSynthesisUtterance(text)
utterance.lang = 'en-US'
window.speechSynthesis.speak(utterance)
```

## Chat Integration Guidelines

### AI API Integration:
- Store API keys in environment variables (NEVER commit)
- Implement rate limiting and error handling
- Use streaming responses for better UX
- Cache responses when appropriate

### Message Storage Schema:
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  voiceEnabled?: boolean
  audioUrl?: string
}
```

## Critical Development Rules

### Voice Feature Requirements:
1. **Permission Handling**: Always request microphone access before use
2. **Error Recovery**: Handle speech recognition errors gracefully
3. **Visual Feedback**: Show recording state (listening/processing/speaking)
4. **Privacy**: Never record without explicit user consent
5. **Accessibility**: Provide keyboard shortcuts and visual alternatives

### Chat Feature Requirements:
1. **Message Validation**: Validate all user input with Zod
2. **Error Messages**: Display clear, user-friendly error messages
3. **Loading States**: Show typing indicators during AI response
4. **Message History**: Implement infinite scroll or pagination
5. **Security**: Sanitize and escape all message content

### Browser Extension Specific (If Applicable):
1. **Manifest V3**: Use service workers, not background pages
2. **CSP Compliance**: Follow Content Security Policy restrictions
3. **Permissions**: Request minimum necessary permissions
4. **Storage Limits**: Be mindful of chrome.storage quota limits
5. **Cross-browser**: Test on Chrome, Firefox, Edge

## Testing Requirements

### Voice Testing:
- Test with different accents and speech patterns
- Verify microphone permission flow
- Test audio playback on various devices
- Handle network failures during API calls

### Chat Testing:
- Test message sending/receiving
- Verify message history persistence
- Test with long messages and special characters
- Validate API error handling

## Environment Variables

```env
# AI Service
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Database (if Next.js)
DATABASE_URL=

# Voice Services (if using external)
ELEVENLABS_API_KEY=
DEEPGRAM_API_KEY=
```

## Next Steps for Initial Setup

1. **Decide Project Type**: Browser extension vs web app
2. **Initialize Repository**: Run appropriate setup commands
3. **Create CONTEXT.md**: Document initial decisions
4. **Set Up Voice**: Implement basic speech recognition
5. **Set Up Chat**: Implement basic message flow
6. **Test Integration**: Verify voice and chat work together
7. **Deploy** (if web app): Set up Vercel and NeonDB

## Important Notes

- **NEVER use Turbopack** for builds (causes deployment issues)
- **ALWAYS run ESLint** after making changes
- **Research first**: Look up best practices before implementing features
- **Update CONTEXT.md**: Document all major decisions and changes
- **No workarounds**: Implement proper solutions, not temporary fixes
- **Ask when uncertain**: Don't assume requirements

## Browser Compatibility

### Speech API Support:
- Chrome/Edge: Full support
- Firefox: Limited support (may need polyfill)
- Safari: Partial support (test thoroughly)

### Recommended Fallbacks:
- Provide text input as alternative to voice
- Show browser compatibility warnings
- Use feature detection before enabling voice features
