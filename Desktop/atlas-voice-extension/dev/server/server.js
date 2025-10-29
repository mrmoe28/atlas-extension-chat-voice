import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  initializeDatabase,
  saveMemory,
  getMemories,
  getConversationHistory,
  saveConversation,
  getPatterns,
  savePattern,
  getKnowledge,
  saveKnowledge,
  clearAllMemory
} from './database.js';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8787;

// Initialize database on startup
initializeDatabase().then(result => {
  if (result.success) {
    console.log('✅ Database ready');
  } else {
    console.log('⚠️  Database initialization skipped:', result.message);
  }
});

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

// Knowledge Base API endpoints
app.get('/api/knowledge', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';

    // Fetch all knowledge data from database
    const [memoriesResult, patternsResult, knowledgeResult] = await Promise.all([
      getMemories(userId, 50),
      getPatterns(userId),
      getKnowledge(userId)
    ]);

    res.json({
      memory: memoriesResult.data || [],
      patterns: patternsResult.data || [],
      knowledge: knowledgeResult.data || []
    });
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

app.post('/api/knowledge/clear', async (req, res) => {
  try {
    const userId = req.body.user_id || 'default';
    const result = await clearAllMemory(userId);

    if (result.success) {
      res.json({ message: 'Memory cleared successfully' });
    } else {
      res.status(500).json({ error: result.message || 'Failed to clear memory' });
    }
  } catch (error) {
    console.error('Error clearing memory:', error);
    res.status(500).json({ error: 'Failed to clear memory' });
  }
});

app.post('/api/knowledge/memory', async (req, res) => {
  try {
    const { user_id, memory_type, content, importance_score } = req.body;
    const userId = user_id || 'default';

    const result = await saveMemory(userId, memory_type, content, importance_score || 5);

    if (result.success) {
      res.json({
        message: 'Memory saved successfully',
        data: result.data
      });
    } else {
      res.status(500).json({ error: result.message || 'Failed to save memory' });
    }
  } catch (error) {
    console.error('Error saving memory:', error);
    res.status(500).json({ error: 'Failed to save memory' });
  }
});

// New endpoints for conversations, patterns, and knowledge
app.post('/api/conversation', async (req, res) => {
  try {
    const { user_id, session_id, role, content, metadata } = req.body;
    const userId = user_id || 'default';
    const sessionId = session_id || 'default';

    const result = await saveConversation(userId, sessionId, role, content, metadata);

    if (result.success) {
      res.json({ message: 'Conversation saved', data: result.data });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

app.get('/api/conversation/:sessionId', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50; // Default to last 50 messages
    const offset = parseInt(req.query.offset) || 0;

    const result = await getConversationHistory(userId, sessionId);

    if (result.success) {
      // Apply pagination to results
      const totalCount = result.data.length;
      const paginatedData = result.data.slice(offset, offset + limit);

      res.json({
        data: paginatedData,
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          hasMore: (offset + limit) < totalCount
        }
      });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

app.post('/api/pattern', async (req, res) => {
  try {
    const { user_id, pattern_type, pattern_data, confidence_score } = req.body;
    const userId = user_id || 'default';

    const result = await savePattern(userId, pattern_type, pattern_data, confidence_score);

    if (result.success) {
      res.json({ message: 'Pattern saved', data: result.data });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error saving pattern:', error);
    res.status(500).json({ error: 'Failed to save pattern' });
  }
});

app.post('/api/knowledge/item', async (req, res) => {
  try {
    const { user_id, category, title, content, tags } = req.body;
    const userId = user_id || 'default';

    const result = await saveKnowledge(userId, category, title, content, tags || []);

    if (result.success) {
      res.json({ message: 'Knowledge saved', data: result.data });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error saving knowledge:', error);
    res.status(500).json({ error: 'Failed to save knowledge' });
  }
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

    // Check if API key is configured
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey || apiKey === '') {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({
        error: 'OPENAI_API_KEY not configured',
        message: 'Please add your OpenAI API key to Vercel environment variables'
      });
    }

    console.log('Analyzing screenshot with GPT-4 Vision...');
    console.log('API Key present:', apiKey.substring(0, 7) + '...');

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      // Return detailed error to client for debugging
      return res.status(response.status).json({
        error: `Vision API failed: ${response.status}`,
        details: errorText,
        message: 'OpenAI API error - check API key and model access'
      });
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

/**
 * Update Checker API
 * Checks GitHub Releases for new extension versions
 */
const GITHUB_REPO = 'mrmoe28/atlas-extension-chat-voice';
const UPDATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let updateCache = {
  data: null,
  timestamp: 0
};

function compareVersions(v1, v2) {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

async function fetchLatestRelease() {
  const now = Date.now();

  if (updateCache.data && (now - updateCache.timestamp) < UPDATE_CACHE_DURATION) {
    return updateCache.data;
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Atlas-Extension-Updater'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const release = await response.json();

  // Look for any ZIP file in the release assets
  const zipAsset = release.assets.find(asset =>
    asset.name.endsWith('.zip') && asset.content_type === 'application/zip'
  );

  if (!zipAsset) {
    throw new Error('Extension ZIP not found in release assets');
  }

  const releaseData = {
    version: release.tag_name.replace(/^v/, ''),
    tagName: release.tag_name,
    downloadUrl: zipAsset.browser_download_url,
    releaseNotes: release.body || '',
    publishedAt: release.published_at,
    htmlUrl: release.html_url
  };

  updateCache.data = releaseData;
  updateCache.timestamp = now;

  return releaseData;
}

app.get('/api/updates/check', async (req, res) => {
  try {
    const { currentVersion } = req.query;

    if (!currentVersion) {
      return res.status(400).json({
        error: 'Missing currentVersion parameter',
        usage: '/api/updates/check?currentVersion=0.2.0'
      });
    }

    const latestRelease = await fetchLatestRelease();
    const hasUpdate = compareVersions(latestRelease.version, currentVersion) > 0;

    res.json({
      hasUpdate,
      currentVersion,
      latestVersion: latestRelease.version,
      downloadUrl: hasUpdate ? latestRelease.downloadUrl : null,
      releaseNotes: hasUpdate ? latestRelease.releaseNotes : null,
      publishedAt: hasUpdate ? latestRelease.publishedAt : null,
      releaseUrl: hasUpdate ? latestRelease.htmlUrl : null,
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update check error:', error);

    res.status(500).json({
      error: 'Failed to check for updates',
      message: error.message,
      hasUpdate: false
    });
  }
});

app.listen(PORT, () => {
  console.log(`Ephemeral server listening on http://localhost:${PORT}`);
});
