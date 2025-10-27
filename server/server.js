import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
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
        // Expand ~ to home directory
        const expandedPath = param.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'darwin'
          ? `open "${expandedPath}"`
          : process.platform === 'win32'
          ? `start "" "${expandedPath}"`
          : `xdg-open "${expandedPath}"`;
        message = `Opened folder: ${param}`;
        break;

      case 'createFile':
        // Expand ~ to home directory
        const expandedFilePath = param.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `type nul > "${expandedFilePath}"`
          : `touch "${expandedFilePath}"`;
        message = `Created file: ${param}`;
        break;

      case 'createFolder':
        // Expand ~ to home directory
        const expandedFolderPath = param.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `mkdir "${expandedFolderPath}"`
          : `mkdir -p "${expandedFolderPath}"`;
        message = `Created folder: ${param}`;
        break;

      case 'deleteFile':
        const expandedDeletePath = param.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `del "${expandedDeletePath}"`
          : `rm "${expandedDeletePath}"`;
        message = `Deleted file: ${param}`;
        break;

      case 'deleteFolder':
        const expandedDeleteFolderPath = param.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `rmdir /s /q "${expandedDeleteFolderPath}"`
          : `rm -rf "${expandedDeleteFolderPath}"`;
        message = `Deleted folder: ${param}`;
        break;

      case 'renameFile':
        const [oldPath, newPath] = param.split(':');
        const expandedOldPath = oldPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        const expandedNewPath = newPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `ren "${expandedOldPath}" "${expandedNewPath}"`
          : `mv "${expandedOldPath}" "${expandedNewPath}"`;
        message = `Renamed: ${oldPath} → ${newPath}`;
        break;

      case 'copyFile':
        const [sourcePath, destPath] = param.split(':');
        const expandedSourcePath = sourcePath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        const expandedDestPath = destPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `copy "${expandedSourcePath}" "${expandedDestPath}"`
          : `cp -r "${expandedSourcePath}" "${expandedDestPath}"`;
        message = `Copied: ${sourcePath} → ${destPath}`;
        break;

      case 'moveFile':
        const [moveSourcePath, moveDestPath] = param.split(':');
        const expandedMoveSourcePath = moveSourcePath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        const expandedMoveDestPath = moveDestPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
        command = process.platform === 'win32'
          ? `move "${expandedMoveSourcePath}" "${expandedMoveDestPath}"`
          : `mv "${expandedMoveSourcePath}" "${expandedMoveDestPath}"`;
        message = `Moved: ${moveSourcePath} → ${moveDestPath}`;
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

      // System Control Commands
      case 'volumeUp':
        command = process.platform === 'darwin'
          ? `osascript -e "set volume output volume (output volume of (get volume settings) + 10)"`
          : process.platform === 'win32'
          ? `powershell -c "[audio]::Volume += 0.1"`
          : `amixer set Master 10%+`;
        message = `Volume increased`;
        break;

      case 'volumeDown':
        command = process.platform === 'darwin'
          ? `osascript -e "set volume output volume (output volume of (get volume settings) - 10)"`
          : process.platform === 'win32'
          ? `powershell -c "[audio]::Volume -= 0.1"`
          : `amixer set Master 10%-`;
        message = `Volume decreased`;
        break;

      case 'muteVolume':
        command = process.platform === 'darwin'
          ? `osascript -e "set volume output muted true"`
          : process.platform === 'win32'
          ? `powershell -c "[audio]::Volume = 0"`
          : `amixer set Master mute`;
        message = `Volume muted`;
        break;

      case 'brightnessUp':
        command = process.platform === 'darwin'
          ? `osascript -e "tell application \\"System Events\\" to key code 144"`
          : process.platform === 'win32'
          ? `powershell -c "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,80)"`
          : `xrandr --output $(xrandr | grep ' connected' | head -n1 | cut -d' ' -f1) --brightness 0.8`;
        message = `Brightness increased`;
        break;

      case 'brightnessDown':
        command = process.platform === 'darwin'
          ? `osascript -e "tell application \\"System Events\\" to key code 145"`
          : process.platform === 'win32'
          ? `powershell -c "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,20)"`
          : `xrandr --output $(xrandr | grep ' connected' | head -n1 | cut -d' ' -f1) --brightness 0.2`;
        message = `Brightness decreased`;
        break;

      case 'lockScreen':
        command = process.platform === 'darwin'
          ? `osascript -e "tell application \\"System Events\\" to keystroke \\"q\\" using {command down, control down}"`
          : process.platform === 'win32'
          ? `rundll32.exe user32.dll,LockWorkStation`
          : `gnome-screensaver-command -l`;
        message = `Screen locked`;
        break;

      case 'sleepComputer':
        command = process.platform === 'darwin'
          ? `osascript -e "tell application \\"System Events\\" to sleep"`
          : process.platform === 'win32'
          ? `rundll32.exe powrprof.dll,SetSuspendState 0,1,0`
          : `systemctl suspend`;
        message = `Computer sleeping`;
        break;

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

/**
 * Vision API endpoint
 * Analyzes screenshots using GPT-4 Vision
 */
app.post('/api/vision', async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image required' });
    }

    console.log('Analyzing screenshot with GPT-4 Vision...');

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(process.env.OPENAI_API_KEY || '').trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'Describe what you see in this screenshot in detail.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', response.status, errorText);
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices[0]?.message?.content || 'Unable to analyze image';

    console.log('Vision analysis complete');

    res.json({
      success: true,
      description,
      model: 'gpt-4o'
    });
  } catch (e) {
    console.error('Vision API error:', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Ephemeral server listening on http://localhost:${PORT}`);
});
