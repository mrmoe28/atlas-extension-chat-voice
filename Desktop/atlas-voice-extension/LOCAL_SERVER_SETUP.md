# Local Server Setup for Piper TTS

This guide explains how to run the Atlas Voice Extension local server with Piper TTS support.

## Why Use Local Server?

**Piper TTS requires local server** because:
- Voice model files (.onnx) need filesystem access
- Python execution required for Piper TTS
- Vercel serverless functions don't support these requirements

## Quick Start

### 1. Start the Server

```bash
./start-local-server.sh
```

This will:
- Check for dependencies and install if needed
- Start the server on `http://localhost:8787`
- Enable Piper TTS (if installed)

### 2. Configure Extension

1. Open Atlas Voice Extension
2. Click the hamburger menu (☰)
3. In Settings:
   - **Server URL**: Change to `http://localhost:8787`
   - **API Key**: Optional (server provides fallback)
4. Click "Connect"

### 3. Test Audio

- Send a voice or text message
- Select a Piper voice from the dropdown (if available)
- Audio should play through your speakers

## Detailed Setup

### Prerequisites

- Node.js 18+ installed
- Python 3.8+ (for Piper TTS)
- macOS, Linux, or Windows

### Installing Dependencies

#### Server Dependencies

```bash
cd dev/server
npm install
```

#### Piper TTS (Optional but Recommended)

```bash
cd piper-tts

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Install Piper TTS
pip install piper-tts
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp dev/server/.env.example dev/server/.env
```

Edit `dev/server/.env`:

```env
# Required for OpenAI Realtime API
OPENAI_API_KEY=sk-your-key-here

# Optional: OpenAI Realtime model
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17

# Database (already configured, no changes needed)
DATABASE_URL=postgresql://...
```

### Available Piper Voices

The following voices are included in the `piper-tts/voices/` directory:

- **en_US-amy-medium**: Female, clear, medium quality
- **en_US-danny-low**: Male, natural, low quality (fast)
- **en_US-kathleen-low**: Female, warm, low quality (fast)
- **en_US-lessac-medium**: Male, professional, medium quality
- **en_US-ljspeech-high**: Female, high quality (slower)
- **en_US-ryan-high**: Male, high quality (slower)

## Manual Server Start

If you prefer not to use the startup script:

```bash
cd dev/server
npm run dev
```

Server will start on `http://localhost:8787`

## Troubleshooting

### Port Already in Use

If port 8787 is in use, edit `dev/server/server.js`:

```javascript
const PORT = process.env.PORT || 8787;  // Change to different port
```

### Piper TTS Not Working

**Check if Piper is installed:**

```bash
cd piper-tts
source venv/bin/activate
piper --version
```

**If not installed:**

```bash
pip install piper-tts
```

**Verify voice models exist:**

```bash
ls -la piper-tts/voices/
```

You should see `.onnx` and `.onnx.json` files.

### Audio Not Playing

1. **Check browser console** (F12 in extension)
   - Look for audio playback errors
   - Check for autoplay blocking messages

2. **Verify server is running:**
   ```bash
   curl http://localhost:8787/api/ephemeral
   ```

3. **Test TTS endpoint:**
   ```bash
   curl -X POST http://localhost:8787/api/piper/tts \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello world","voice":"en_US-amy-medium"}'
   ```

4. **Check server logs** for errors

### "Database not configured" Error

The database connection is optional for basic functionality. If you see this error but want to use memory features:

1. Check that `DATABASE_URL` is set in `dev/server/.env`
2. Verify the database is accessible (NeonDB connection string)
3. Run the voice migration script:
   ```bash
   cd dev/server
   node migrate-piper-voices.js
   ```

## API Endpoints

When running locally, these endpoints are available:

### Get OpenAI Credentials
```
GET http://localhost:8787/api/ephemeral
```

### Generate Piper TTS Audio
```
POST http://localhost:8787/api/piper/tts
Body: {
  "text": "Hello world",
  "voice": "en_US-amy-medium"
}
```

### Desktop Commands
```
POST http://localhost:8787/api/desktop
Body: {
  "action": "volume_up"
}
```

### Vision Analysis
```
POST http://localhost:8787/api/vision
Body: {
  "imageBase64": "...",
  "prompt": "What's in this image?"
}
```

## Production vs Local

| Feature | Vercel (Production) | Local Server |
|---------|-------------------|--------------|
| OpenAI Realtime API | ✅ Yes | ✅ Yes |
| Desktop Commands | ✅ Yes | ✅ Yes |
| Vision Analysis | ✅ Yes | ✅ Yes |
| Piper TTS | ❌ No | ✅ Yes |
| Memory/Database | ✅ Yes | ✅ Yes |
| Groq Integration | ✅ Yes | ✅ Yes |

## Next Steps

1. **Test the extension** with local server
2. **Try different Piper voices** to find your favorite
3. **Monitor server logs** for any issues
4. **Use Vercel for deployment** (without Piper TTS) when needed

## Support

- Check `AUDIO_PLAYBACK_ISSUES.md` for common problems
- Review server logs in terminal
- Check browser console (F12) for client-side errors

## Notes

- Local server is required for Piper TTS functionality
- You can use Vercel for all other features
- Extension auto-detects which features are available
- Browser TTS works as fallback without Piper
