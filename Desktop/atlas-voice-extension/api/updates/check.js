/**
 * Atlas Extension Update Checker API
 * Checks GitHub Releases for new versions
 */

const GITHUB_REPO = 'mrmoe28/atlas-extension-chat-voice';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cache = {
  data: null,
  timestamp: 0
};

/**
 * Compare two semver versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

/**
 * Fetch latest release from GitHub
 */
async function fetchLatestRelease() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
    return cache.data;
  }

  try {
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
    
    // Find the extension ZIP in assets
    const zipAsset = release.assets.find(asset => 
      asset.name === 'atlas-voice-extension.zip'
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

    // Update cache
    cache.data = releaseData;
    cache.timestamp = now;

    return releaseData;
  } catch (error) {
    console.error('Error fetching release:', error);
    throw error;
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Enable CORS for extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentVersion } = req.query;

    if (!currentVersion) {
      return res.status(400).json({ 
        error: 'Missing currentVersion parameter',
        usage: '/api/updates/check?currentVersion=0.2.0'
      });
    }

    // Fetch latest release from GitHub
    const latestRelease = await fetchLatestRelease();

    // Compare versions
    const hasUpdate = compareVersions(latestRelease.version, currentVersion) > 0;

    // Build response
    const response = {
      hasUpdate,
      currentVersion,
      latestVersion: latestRelease.version,
      downloadUrl: hasUpdate ? latestRelease.downloadUrl : null,
      releaseNotes: hasUpdate ? latestRelease.releaseNotes : null,
      publishedAt: hasUpdate ? latestRelease.publishedAt : null,
      releaseUrl: hasUpdate ? latestRelease.htmlUrl : null,
      checkedAt: new Date().toISOString()
    };

    // Cache response in browser for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json(response);

  } catch (error) {
    console.error('Update check error:', error);
    
    return res.status(500).json({
      error: 'Failed to check for updates',
      message: error.message,
      hasUpdate: false
    });
  }
}
