# 🧪 Auto-Update Testing Guide

Quick guide to test the auto-update system.

## Prerequisites

- Extension installed locally
- GitHub repo access
- Vercel deployment active

## Test 1: Version Bump Script

```bash
# Test patch bump
npm run bump

# Check updated files
git diff manifest.json package.json

# Should show version: "0.2.1" (from 0.2.0)
```

**Expected Result:** ✅ Both files updated with new version

---

## Test 2: Update Check API

```bash
# Test API endpoint
curl "https://atlas-extension-chat-voice.vercel.app/api/updates/check?currentVersion=0.1.0"
```

**Expected Response:**
```json
{
  "hasUpdate": true,
  "latestVersion": "0.2.0",
  "downloadUrl": "https://github.com/.../atlas-voice-extension.zip",
  "releaseNotes": "...",
  ...
}
```

**Expected Result:** ✅ API returns latest version info

---

## Test 3: GitHub Actions Workflow

```bash
# 1. Bump version
npm run bump

# 2. Commit and tag
git add .
git commit -m "test: auto-update system"
git tag v0.2.1

# 3. Push
git push origin main --tags
```

**Check GitHub Actions:**
1. Go to: https://github.com/mrmoe28/atlas-extension-chat-voice/actions
2. Watch workflow run
3. Should complete in ~2 minutes

**Expected Result:** ✅ Workflow succeeds, release created

---

## Test 4: GitHub Release

**Check Release Page:**
1. Go to: https://github.com/mrmoe28/atlas-extension-chat-voice/releases
2. Find latest release (v0.2.1)
3. Verify:
   - ✅ Release created
   - ✅ ZIP file attached
   - ✅ Changelog present
   - ✅ Installation instructions

**Expected Result:** ✅ Complete release with ZIP

---

## Test 5: Extension Update Check

**Manual Check:**
1. Open extension (chrome://extensions)
2. Click "Service worker" link
3. In console, run:
   ```javascript
   chrome.runtime.sendMessage({type: 'CHECK_UPDATE'})
   ```

**Check Console Output:**
```
Checking for updates... Current version: 0.2.0
Update check response: {hasUpdate: true, ...}
Update available: v0.2.1
```

**Expected Result:** ✅ Extension detects update

---

## Test 6: Update UI Banner

**In Extension Sidepanel:**
1. Open extension
2. Should see purple banner at top:
   ```
   🎉 Atlas Update Available!
   Version v0.2.1 is ready to download.
   [Download] [Later]
   ```

**Expected Result:** ✅ Banner shows with correct version

---

## Test 7: Update Download

**Click "Download" Button:**
1. Banner button changes to "Downloading..."
2. Download starts in Chrome
3. Button changes to "Downloaded!"
4. Instructions appear

**Check Downloads:**
- Go to chrome://downloads
- Should see: `atlas-voice-extension-update.zip`

**Expected Result:** ✅ ZIP downloaded successfully

---

## Test 8: Notification System

**Check Chrome Notifications:**
1. Update available → Should show notification
2. Click "Install Now" → Should start download
3. Download complete → Should show completion notification

**Expected Result:** ✅ All notifications working

---

## Test 9: Update Installation

**Manual Installation Test:**
1. Download ZIP from release
2. Extract to folder
3. Go to chrome://extensions
4. Click "Load unpacked"
5. Select extracted folder
6. Extension should update

**Check Version:**
- Open extension
- Version should be updated

**Expected Result:** ✅ Extension updated successfully

---

## Test 10: Periodic Check

**Test Automatic Checks:**
1. Install extension
2. Wait 4 hours OR
3. Restart browser
4. Check console logs
5. Should see: "Periodic update check triggered"

**Expected Result:** ✅ Automatic checks working

---

## Common Issues & Fixes

### Issue: Version Mismatch Error

```
Error: manifest.json version (0.2.0) does not match tag version (0.2.1)
```

**Fix:**
```bash
# Ensure versions match
npm run bump
git tag v0.2.1  # Must match manifest version
```

---

### Issue: API Returns 500 Error

**Fix:**
1. Check Vercel deployment: https://vercel.com/dashboard
2. Check server logs
3. Verify GitHub repo is public
4. Check GitHub API rate limits

---

### Issue: No Update Banner Shows

**Fix:**
1. Check console for errors
2. Verify permissions in manifest.json
3. Test API manually
4. Clear storage: `chrome.storage.local.clear()`

---

### Issue: Download Fails

**Fix:**
1. Check GitHub release has ZIP attached
2. Verify download URL is public
3. Check Chrome download settings
4. Try manual download from GitHub

---

## Quick Verification Checklist

After implementing, verify:

- [ ] GitHub Actions workflow exists (`.github/workflows/release.yml`)
- [ ] API endpoint responds (`/api/updates/check`)
- [ ] Version comparison works (`lib/version-compare.js`)
- [ ] Update manager initialized (`background.js`)
- [ ] UI banner added (`sidepanel.html`)
- [ ] Permissions added to manifest (`notifications`, `alarms`)
- [ ] Bump script works (`npm run bump`)

---

## Success Criteria

✅ All tests pass  
✅ Version bump → Tag push → Auto-release works  
✅ Extension detects updates within 4 hours  
✅ Users can download and install with 1 click  
✅ Notifications show up correctly  
✅ No errors in console  

---

## Production Readiness

Before going live:

1. **Test full flow** with real version bump
2. **Verify all notifications** work correctly
3. **Test on multiple machines** if possible
4. **Document for users** in README
5. **Create first real release** to test with users

---

## Monitoring

**After Release:**

- Monitor GitHub Actions for failures
- Check Vercel logs for API errors
- Watch for user reports of update issues
- Monitor download counts on releases

---

## Emergency Procedures

**If Bad Version Released:**

1. Delete release on GitHub immediately
2. Create new release with previous version
3. Update API to point to good version
4. Notify users in extension

**Rollback Steps:**
```bash
# Delete bad release
gh release delete v0.2.1 --yes

# Recreate with good version
git tag -d v0.2.1
git push origin :refs/tags/v0.2.1

# Push correct version
git tag v0.2.0
git push origin v0.2.0
```

---

## 🎉 Testing Complete!

Once all tests pass, your auto-update system is production-ready!

**Next Steps:**
1. Bump to v0.3.0 for real
2. Push tags
3. Watch the magic happen ✨
