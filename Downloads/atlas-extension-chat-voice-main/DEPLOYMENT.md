# Atlas Voice Extension - Production Deployment Guide

## 🚀 Quick Start

Your extension is now production-ready! No local server needed.

## 📦 Chrome Web Store Submission

### 1. Create Extension Package

```bash
cd /Users/ekodevapps/Downloads/atlas-extension-chat-voice-main
zip -r atlas-voice-extension.zip extension/ -x "*.DS_Store" "*.git*"
```

This creates `atlas-voice-extension.zip` ready for Chrome Web Store.

### 2. Chrome Web Store Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 developer fee (if first time)
3. Click "New Item"
4. Upload `atlas-voice-extension.zip`

### 3. Store Listing Information

**Name:** Atlas Voice - AI Voice Assistant

**Description:**
```
Atlas Voice brings AI-powered voice interaction to your browser.
Talk to OpenAI's latest models with natural voice conversations.

Features:
• Real-time voice chat with GPT-4
• Desktop Commander mode for system control
• Web automation capabilities
• Copyable AI-generated prompts
• Beautiful, modern UI
• No local server required

Perfect for:
- Quick AI assistance while browsing
- Hands-free productivity
- Voice-based research
- Creative writing assistance
```

**Category:** Productivity

**Language:** English

**Screenshots needed:** 1280x800 or 640x400
- Main interface with voice orb
- Settings modal
- Chat conversation
- Desktop Commander in action

### 4. Privacy Policy

Your extension uses:
- Microphone (for voice input)
- Network access (to communicate with Vercel backend)
- OpenAI API (privacy policy: https://openai.com/privacy)

Create a simple privacy policy or use a template like:
https://www.freeprivacypolicy.com/

### 5. Permission Justifications

When submitting, explain:
- **Microphone:** Required for voice input to communicate with AI
- **Host permissions:** Required to connect to Vercel backend API

## 🔄 Auto-Deployment Workflow

### Current Setup:
1. ✅ Extension uses: `https://server-ekoapps.vercel.app`
2. ✅ Server deployed on Vercel
3. ✅ OpenAI API key stored securely in Vercel environment

### To Enable Auto-Deploy from GitHub:

1. Go to [Vercel Dashboard](https://vercel.com/ekoapps/server/settings/git)
2. Click "Connect Git Repository"
3. Select: `mrmoe28/atlas-extension-chat-voice`
4. Set **Root Directory:** `server`
5. Click "Deploy"

Now every push to `main` branch automatically redeploys the server!

### Making Updates:

```bash
# Make changes to extension or server
git add .
git commit -m "feat: your change description"
git push origin main

# Vercel automatically deploys server changes
# For extension changes, create new zip and update on Chrome Web Store
```

## 🔧 Extension Updates

### Version Bumping

Edit `extension/manifest.json`:
```json
{
  "version": "1.0.1"  // Increment for each update
}
```

### Publishing Updates

1. Make your changes
2. Commit and push to GitHub
3. Create new zip: `zip -r atlas-voice-extension.zip extension/`
4. Upload to Chrome Web Store
5. Submit for review

Updates typically approved within 24-48 hours.

## 🌍 Production URLs

- **Extension Backend:** https://server-ekoapps.vercel.app
- **GitHub Repository:** https://github.com/mrmoe28/atlas-extension-chat-voice
- **Vercel Project:** https://vercel.com/ekoapps/server

## 🔐 Security Notes

- ✅ OpenAI API key stored securely in Vercel (not in code)
- ✅ No secrets in GitHub repository
- ✅ HTTPS-only communication
- ✅ Environment variables protected

## 📊 Monitoring

- **Vercel Logs:** https://vercel.com/ekoapps/server/logs
- **Analytics:** Available in Vercel dashboard
- **Error Tracking:** Check Vercel function logs

## 💡 Tips

1. **Test Before Publishing:** Always test the production build locally first
2. **Semantic Versioning:** Use X.Y.Z format (Major.Minor.Patch)
3. **Changelog:** Keep track of changes in commits
4. **User Feedback:** Monitor Chrome Web Store reviews

## 🐛 Troubleshooting

### Extension can't connect to server
1. Check Vercel dashboard - is deployment successful?
2. Verify `OPENAI_API_KEY` environment variable exists
3. Check Vercel function logs for errors

### API key issues
```bash
# Update API key in Vercel
vercel env add OPENAI_API_KEY production
# Enter your new key when prompted
vercel --prod  # Redeploy
```

### Server not responding
1. Check https://server-ekoapps.vercel.app (should show "OK")
2. Check https://server-ekoapps.vercel.app/api/ephemeral (should return JSON)
3. Review Vercel logs for errors

## 📞 Support

For issues:
1. Check Vercel deployment logs
2. Review GitHub Issues
3. Update OpenAI API key if needed

---

🎉 **Your extension is production-ready!**

Users can now install and use Atlas Voice without any local setup.
