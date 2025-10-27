import 'dotenv/config';
import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8787;

// Parse JSON bodies
app.use(express.json());

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
 * Return ephemeral credentials for WebRTC connection
 * For OpenAI Realtime API, the client uses the API key as Bearer token
 */
app.get('/api/ephemeral', async (req, res) => {
  try {
    // Return the API key as client_secret for the client to use
    const client_secret = (process.env.OPENAI_API_KEY || '').trim();
    // Use the latest Realtime API model
    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
    const endpoint = 'https://api.openai.com/v1/realtime';

    if (!client_secret) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log(`Providing credentials for model: ${model}`);

    res.json({
      client_secret,
      model,
      endpoint
    });
  } catch (e) {
    console.error('Error returning ephemeral token:', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

/**
 * Desktop Commander endpoint
 * Executes desktop automation commands
 */
app.post('/api/desktop', async (req, res) => {
  try {
    const { type, param } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Command type required' });
    }

    console.log(`Desktop command: ${type} ${param || ''}`);

    let command;
    let message;

    switch (type) {
      case 'openFolder':
        command = process.platform === 'darwin'
          ? `open "${param}"`
          : process.platform === 'win32'
          ? `start "" "${param}"`
          : `xdg-open "${param}"`;
        message = `Opened folder: ${param}`;
        break;

      case 'createFile':
        command = process.platform === 'win32'
          ? `type nul > "${param}"`
          : `touch "${param}"`;
        message = `Created file: ${param}`;
        break;

      case 'findFile':
        command = process.platform === 'win32'
          ? `where /R . "${param}"`
          : `find . -name "${param}"`;
        const { stdout: findResult } = await execAsync(command);
        return res.json({
          message: `Found files:\n${findResult || 'No files found'}`,
          result: findResult
        });

      case 'runApp':
        command = process.platform === 'darwin'
          ? `open -a "${param}"`
          : process.platform === 'win32'
          ? `start "" "${param}"`
          : `${param}`;
        message = `Launched application: ${param}`;
        break;

      case 'listFiles':
        const dir = param || '.';
        command = process.platform === 'win32'
          ? `dir "${dir}"`
          : `ls -la "${dir}"`;
        const { stdout: listResult } = await execAsync(command);
        return res.json({
          message: `Files in ${dir}:\n${listResult}`,
          result: listResult
        });

      default:
        return res.status(400).json({ error: 'Unknown command type' });
    }

    // Execute command
    await execAsync(command);

    res.json({
      success: true,
      message,
      command: type,
      param
    });
  } catch (e) {
    console.error('Desktop command error:', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Ephemeral server listening on http://localhost:${PORT}`);
});
