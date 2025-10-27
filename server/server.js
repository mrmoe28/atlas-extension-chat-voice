import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8787;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple health
app.get('/', (_, res) => res.send('OK'));

/**
 * Create OpenAI Realtime session and return ephemeral credentials
 */
app.get('/api/ephemeral', async (req, res) => {
  try {
    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview';

    console.log('Creating OpenAI Realtime session...');

    // Create ephemeral session with OpenAI
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: 'alloy'
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('OpenAI session creation failed:', sessionResponse.status, errorText);
      throw new Error(`Failed to create session: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('Session created successfully');

    res.json({
      client_secret: sessionData.client_secret.value,
      model: model,
      endpoint: 'https://api.openai.com/v1/realtime'
    });
  } catch (e) {
    console.error('Error creating ephemeral token:', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Ephemeral server listening on http://localhost:${PORT}`);
});
