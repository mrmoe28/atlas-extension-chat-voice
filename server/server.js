import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8787;

// Simple health
app.get('/', (_, res) => res.send('OK'));

/**
 * Mint an ephemeral key (or session) for WebRTC.
 * GA commonly uses /v1/realtime/calls with a Bearer of a "client_secret" style ephemeral token.
 * Some setups mint via /v1/realtime/sessions; adjust per docs.
 */
app.get('/api/ephemeral', async (req, res) => {
  try {
    // This example returns your standard API key as a short-lived "client_secret"
    // In production, use the official ephemeral/session mint flow per docs/region.
    // Never expose OPENAI_API_KEY directly to untrusted clients.
    const client_secret = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-mini';
    const endpoint = process.env.OPENAI_REALTIME_CALLS_URL || 'https://api.openai.com/v1/realtime/calls';

    // Optionally you can pre-configure conversation instructions or voice here using
    // server-side events afterwards. Keeping minimal for a starter.
    res.json({ client_secret, model, endpoint });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Ephemeral server listening on http://localhost:${PORT}`);
});
