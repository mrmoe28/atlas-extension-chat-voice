# Quick Test Guide - Atlas Memory System

## 🚀 Quick 5-Minute Test

### Step 1: First Conversation (Session 1)
1. Open Atlas voice extension
2. Click the voice orb to connect
3. Say: **"Hey Atlas, remember that my name is [YOUR NAME] and I'm working on a voice AI project"**
4. Wait for Atlas to confirm
5. Say: **"What's my name?"**
   - ✅ Should respond with your name
6. **Close Atlas completely**

### Step 2: Test Memory Persistence (Session 2)
1. **Reopen Atlas** (new session)
2. Click the voice orb to connect
3. Wait 2-3 seconds for memory to load
4. Say: **"What's my name?"**
   - ✅ **Expected**: Atlas remembers your name from Session 1!
5. Say: **"What was I telling you about earlier?"**
   - ✅ **Expected**: Atlas recalls the voice AI project conversation

---

## 📋 Full Test Checklist

### Test 1: User ID Persistence
- [ ] Open browser console (F12)
- [ ] Type: `localStorage.getItem('atlasVoice_userId')`
- [ ] ✅ You should see a unique ID like `user_a3f2c1...`
- [ ] Close and reopen Atlas
- [ ] Check localStorage again
- [ ] ✅ Same user ID should persist

### Test 2: Basic Memory Save
- [ ] Say: "Remember my favorite food is pizza"
- [ ] Say: "What's my favorite food?"
- [ ] ✅ Should respond: "pizza"

### Test 3: Cross-Session Memory
- [ ] Have a conversation about any topic (e.g., hobbies)
- [ ] Close Atlas
- [ ] Reopen Atlas (wait for connection)
- [ ] Say: "What were we discussing before?"
- [ ] ✅ Should recall the previous topic

### Test 4: Console Logs Check
Look for these in browser console (F12):

```
✅ Should See:
🆔 Using existing user ID: user_...
🚀 Atlas initialized with User ID: user_...
📜 Loading recent conversation history...
✅ Loaded X messages from conversation history
🧠 Loading memories from database...
✅ Loaded memory context: XXXX chars
✅ Full context loaded with conversation history
```

```
❌ Should NOT See:
⚠️ No server URL configured
❌ Failed to load memories
❌ Error loading conversation history
❌ Element not found
```

### Test 5: Multiple Topics Memory
**Session 1:**
- [ ] Tell Atlas your profession

**Session 2 (after reopening):**
- [ ] Tell Atlas your hobbies

**Session 3 (after reopening):**
- [ ] Say: "Tell me everything you know about me"
- [ ] ✅ Should recall both profession AND hobbies

---

## 🔍 Verify Backend Integration

### Check Server Health
```bash
curl http://localhost:3030/health
```
✅ Expected: Should respond with status

### Check Your User ID
Open console and run:
```javascript
console.log('User ID:', localStorage.getItem('atlasVoice_userId'))
```

### Check Last Session
```javascript
console.log('Last Session:', localStorage.getItem('atlasVoice_lastSessionId'))
console.log('Last Session Time:', localStorage.getItem('atlasVoice_lastSessionTime'))
```

---

## 🐛 Common Issues & Quick Fixes

### Issue: "No previous conversation found"

**When it's OK:**
- First time using Atlas
- After clearing memory
- Fresh installation

**When it's a problem:**
- After having conversations and restarting

**Fix:**
1. Check if Memory System is enabled (Settings → Memory System toggle)
2. Check backend server is running
3. Check browser console for errors

---

### Issue: Atlas doesn't remember anything

**Quick Fix:**
1. Open Settings (⚠️ icon)
2. Verify "Memory System" is toggled ON
3. Check "Server URL" is correct (usually `http://localhost:3030`)
4. Click "Test Connection" button
5. Reload Atlas

---

### Issue: Console shows errors

**Common Errors:**

**Error**: `Failed to load memories: 404`
**Fix**: Backend server not running. Start it:
```bash
cd dev/server
npm start
```

**Error**: `CORS error`
**Fix**: Backend CORS not configured. Check `dev/server/server.js` has CORS enabled.

**Error**: `user_id is undefined`
**Fix**: Clear localStorage and reload:
```javascript
localStorage.clear()
location.reload()
```

---

## 💡 Pro Tips

### Tip 1: Check Memory in Real-Time
Open console while talking to Atlas to see:
- When memories are saved
- When patterns are learned
- When conversations are logged

### Tip 2: Force Memory Reload
If Atlas seems to forget something:
```javascript
// In console:
location.reload()
```

### Tip 3: View Your Conversation History
```javascript
// Check last session ID
const sessionId = localStorage.getItem('atlasVoice_lastSessionId')
console.log('Session ID:', sessionId)

// Then manually fetch history (in console):
fetch(`http://localhost:3030/api/conversation/${sessionId}?user_id=${localStorage.getItem('atlasVoice_userId')}&limit=20`)
  .then(r => r.json())
  .then(data => console.table(data.data))
```

### Tip 4: Clear Memory and Start Fresh
Settings → Clear Memory button (or in console):
```javascript
// This will clear YOUR user's memory specifically
fetch('http://localhost:3030/api/knowledge/clear', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({user_id: localStorage.getItem('atlasVoice_userId')})
})
```

---

## 🎯 Success Criteria

Your Atlas memory system is working perfectly if:

✅ **Persistence**:
- User ID stays the same across browser restarts

✅ **Memory Recall**:
- Atlas remembers facts you told her in previous sessions

✅ **Conversation Continuity**:
- Atlas can reference previous conversations

✅ **Console Logs**:
- No errors in browser console
- Sees "Loading memories" and "Loading conversation history"

✅ **User-Specific**:
- Multiple users (different browsers) have separate memories

---

## 📊 Expected Console Output (Good Session)

```
🆔 Using existing user ID: user_a3f2c1b8e4d7f5g2h1j3k4l5m6n7o8p9
🚀 Atlas initialized with User ID: user_a3f2c1b8e4d7f5...
✅ Microphone access granted
🔑 Getting ephemeral token...
✅ Ephemeral token received
🧠 Loading full memory context...
🧠 Loading memories from database...
✅ Loaded memory context: 2456 chars
📜 Loading recent conversation history...
✅ Loaded 18 messages from conversation history
✅ Full context loaded with conversation history
🔗 Connection state: connected
🎤 Listening...
```

---

## 🚨 Troubleshooting Flow

```
Problem: Atlas doesn't remember
    ↓
Is Memory System enabled?
    ↓ No → Enable in Settings
    ↓ Yes
    ↓
Is backend server running?
    ↓ No → Start server: cd dev/server && npm start
    ↓ Yes
    ↓
Check browser console for errors?
    ↓ Has errors → See error-specific fixes above
    ↓ No errors
    ↓
Clear localStorage and reload:
    localStorage.clear()
    location.reload()
```

---

## 🎉 You're Done!

If all tests pass, your Atlas memory system is working perfectly!

**What to try next:**
1. Have longer conversations
2. Ask Atlas to remember complex information
3. Test memory with different topics
4. See how Atlas learns your communication style over time

**For more details:**
- See `MEMORY_ENHANCEMENT_IMPLEMENTATION.md` for technical details
- See `MEMORY_ARCHITECTURE_ANALYSIS.md` for deep dive
- See `MEMORY_ENHANCEMENT_ROADMAP.md` for future improvements

Enjoy your enhanced Atlas with true long-term memory! 🧠✨
