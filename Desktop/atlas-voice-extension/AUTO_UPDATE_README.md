# Atlas Extension Auto-Update System

Complete automatic update system for Atlas Voice Extension using GitHub Releases and Vercel API.

## 🎯 Overview

This system provides **fully automatic updates** to all Atlas users without requiring manual downloads or Chrome Web Store approval.

### How It Works

```
Developer pushes code → GitHub Actions builds → Release created → Users auto-updated
```

1. **Developer**: Bump version and push tag
2. **GitHub Actions**: Automatically builds extension and creates release
3. **Extension**: Checks for updates every 4 hours
4. **User**: Gets notification and downloads update automatically

## 📋 Features

✅ **Automatic Update Checking** - Every 4 hours + on browser startup  
✅ **User Notifications** - Beautiful in-app banner with update info  
✅ **One-Click Install** - Download button triggers automatic installation  
✅ **Release Notes** - Shows changelog from GitHub releases  
✅ **Smart Caching** - API responses cached for 5 minutes  
✅ **Error Handling** - Graceful fallbacks if update fails  
✅ **Version Comparison** - Semantic versioning support  

## 🚀 Quick Start

### For Developers

**1. Bump Version**
```bash
# Patch version (0.2.0 → 0.2.1)
npm run bump

# Minor version (0.2.0 → 0.3.0)
npm run bump:minor

# Major version (0.2.0 → 1.0.0)
npm run bump:major
```

**2. Commit and Tag**
```bash
git add .
git commit -m "feat: add new awesome feature"
git tag v0.3.0
git push origin main --tags
```

**3. GitHub Actions Automatically:**
- Builds the extension
- Creates ZIP file
- Creates GitHub Release
- Uploads ZIP as release asset
- Generates changelog

**4. Users Auto-Update:**
- Extension checks for updates within 4 hours
- Shows notification banner
- Downloads and installs with one click

### For Users

**Automatic Updates:**
- Atlas checks for updates automatically
- You'll see a banner when updates are available
- Click "Download" to install
- Follow simple extraction instructions

**Manual Check:**
- Open extension settings
- Updates are checked automatically on startup

## 📁 Project Structure

```
atlas-voice-extension/
├── .github/
│   └── workflows/
│       ├── release.yml          # Auto-release on version tags
│       └── build.yml            # Build verification
│
├── api/
│   └── updates/
│       └── check.js             # Deleted (using Express server)
│
├── dev/
│   ├── scripts/
│   │   ├── bump-version.js      # Version bumping utility
│   │   ├── build-extension.js   # Build script
│   │   └── create-release.js    # Release script
│   └── server/
│       └── server.js            # Express server with /api/updates/check
│
├── lib/
│   ├── update-manager.js        # Core update logic
│   ├── update-ui.js             # UI notifications
│   └── version-compare.js       # Version comparison
│
├── background.js                # Initializes update manager
├── manifest.json                # Updated with permissions
└── sidepanel.html               # Update banner UI
```

## 🔧 Technical Details

### Update Check API

**Endpoint:** `https://atlas-extension-chat-voice.vercel.app/api/updates/check`

**Request:**
```
GET /api/updates/check?currentVersion=0.2.0
```

**Response:**
```json
{
  "hasUpdate": true,
  "currentVersion": "0.2.0",
  "latestVersion": "0.3.0",
  "downloadUrl": "https://github.com/.../atlas-voice-extension.zip",
  "releaseNotes": "## Changes\n- Feature 1\n- Feature 2",
  "publishedAt": "2025-01-15T10:30:00Z",
  "releaseUrl": "https://github.com/.../releases/tag/v0.3.0",
  "checkedAt": "2025-01-15T12:00:00Z"
}
```

### Version Comparison

Uses semantic versioning (semver):
```javascript
compareVersions("0.3.0", "0.2.0") // Returns 1 (newer)
compareVersions("0.2.0", "0.3.0") // Returns -1 (older)
compareVersions("0.2.0", "0.2.0") // Returns 0 (same)
```

### Update Manager

**Initialization:**
```javascript
// background.js
import { updateManager } from './lib/update-manager.js';
await updateManager.initialize();
```

**Features:**
- Periodic checks every 4 hours
- Check on browser startup
- Notification system
- Download management
- Error recovery

### GitHub Actions Workflow

**Triggered by:**
- Pushing tags matching `v*.*.*` (e.g., v0.3.0)

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Verify manifest version matches tag
5. Build extension ZIP
6. Generate changelog from commits
7. Create GitHub Release
8. Upload ZIP asset

## 🎨 User Interface

### Update Banner

Shows at top of sidepanel when update is available:

```
🎉 Atlas Update Available!
Version v0.3.0 is ready to download.
[Download] [Later]
```

**Features:**
- Beautiful gradient background
- Clear version information
- One-click download button
- Dismissible (reappears after 24h)

### Notifications

Chrome notifications show:
- When update is available
- During download
- On successful installation
- On errors

## 🧪 Testing

### Test Update Check API

```bash
# Check if API is working
curl "https://atlas-extension-chat-voice.vercel.app/api/updates/check?currentVersion=0.1.0"
```

### Test Version Bump

```bash
# Dry run - see what would happen
npm run bump

# Check manifest
cat manifest.json | grep version
```

### Test Full Release Flow

1. **Create test version:**
   ```bash
   npm run bump
   git add .
   git commit -m "test: version bump test"
   git tag v0.2.1
   ```

2. **Push (triggers workflow):**
   ```bash
   git push origin main --tags
   ```

3. **Monitor GitHub Actions:**
   - Go to: https://github.com/mrmoe28/atlas-extension-chat-voice/actions
   - Watch the build complete

4. **Verify Release:**
   - Go to: https://github.com/mrmoe28/atlas-extension-chat-voice/releases
   - Check ZIP is attached

5. **Test Extension:**
   - Open extension
   - Wait up to 4 hours OR restart browser
   - Should see update notification

## 🔍 Troubleshooting

### No Update Notification Showing

**Check:**
1. Console logs in background page: `chrome://extensions` → Click "service worker"
2. Verify API is responding:
   ```bash
   curl "https://atlas-extension-chat-voice.vercel.app/api/updates/check?currentVersion=0.1.0"
   ```
3. Check permissions in manifest.json (notifications, alarms)

### GitHub Action Failing

**Common Issues:**
1. **Version mismatch**: manifest.json version must match git tag
   ```bash
   # Fix: Update both to match
   npm run bump
   git tag v0.X.Y
   ```

2. **Build fails**: Check build script works locally
   ```bash
   npm run build
   ```

3. **Missing dependencies**: Ensure package.json is committed

### Update Download Fails

**Check:**
1. GitHub Release exists with ZIP attached
2. Download URL is publicly accessible
3. Browser console for errors
4. Chrome downloads not blocked

## 📚 API Reference

### UpdateManager

```javascript
// Check for updates
await updateManager.checkForUpdates()

// Install available update
await updateManager.installUpdate()

// Get update status
const status = await updateManager.getUpdateStatus()
```

### Version Comparison

```javascript
import { compareVersions, isNewerVersion } from './lib/version-compare.js';

// Compare versions
const result = compareVersions("0.3.0", "0.2.0"); // 1, -1, or 0

// Check if newer
if (isNewerVersion(newVersion, currentVersion)) {
  // Update available
}
```

## 🔐 Security

### Release Integrity

- All releases are from verified GitHub repo
- Download URLs are GitHub CDN (trusted)
- Extension validates manifest.json before installing

### API Security

- CORS enabled for extension origin
- Rate limiting (5min cache)
- No sensitive data in responses

## 📝 Changelog Format

Auto-generated from commit messages:

```markdown
## Atlas Voice Extension v0.3.0

### Changes
- feat: Add new voice command
- fix: Resolve audio issue
- docs: Update README

### Installation
1. Download `atlas-voice-extension.zip`
2. Extract the ZIP file
...

Released: 2025-01-15T10:30:00Z
```

## 🎯 Best Practices

### Version Bumping

- **Patch (0.0.X)**: Bug fixes, minor tweaks
- **Minor (0.X.0)**: New features, improvements
- **Major (X.0.0)**: Breaking changes, major rewrites

### Commit Messages

Use conventional commits for auto-changelog:

```bash
feat: Add desktop automation
fix: Resolve microphone issue
docs: Update installation guide
chore: Bump version to 0.3.0
```

### Testing Updates

Always test locally before releasing:

```bash
# Build extension
npm run build

# Test in browser
# 1. Go to chrome://extensions
# 2. Load unpacked: dev/build-tools/dist
# 3. Test all features
```

## 🚨 Emergency Rollback

If a bad version is released:

1. **Delete the release** on GitHub
2. **Create new release** with previous good version
3. Users will see it as "update available"
4. They can downgrade by installing older version

## 📞 Support

- **Issues**: https://github.com/mrmoe28/atlas-extension-chat-voice/issues
- **Releases**: https://github.com/mrmoe28/atlas-extension-chat-voice/releases

---

## ✅ Implementation Complete!

Your auto-update system is now fully functional. Here's what happens next:

1. Make changes to your extension
2. Run `npm run bump` to increment version
3. Commit, tag, and push: `git push origin main --tags`
4. GitHub Actions automatically builds and releases
5. All users get notified within 4 hours!

**No manual work required! 🎉**
