# Atlas Server Auto-Start Setup

## ✅ Current Status: AUTO-START CONFIGURED

Your Atlas server is now managed by **PM2** (Process Manager 2) and will:
- ✅ Start automatically when you open your terminal
- ✅ Restart automatically if it crashes
- ✅ Run in the background
- ✅ Keep logs of all activity

---

## 📊 Server Status

Check if the server is running:
```bash
pm2 status
```

You should see:
```
┌────┬──────────────┬─────────┬─────────┬──────┬───────────┐
│ id │ name         │ mode    │ pid     │ ↺    │ status    │
├────┼──────────────┼─────────┼─────────┼──────┼───────────┤
│ 0  │ atlas-server │ fork    │ 31003   │ 0    │ online    │
└────┴──────────────┴─────────┴─────────┴──────┴───────────┘
```

---

## 🎮 Useful PM2 Commands

### View Server Status
```bash
pm2 status
```

### View Live Logs
```bash
pm2 logs atlas-server
```

### View Last 50 Lines of Logs
```bash
pm2 logs atlas-server --lines 50
```

### Restart Server
```bash
pm2 restart atlas-server
```

### Stop Server
```bash
pm2 stop atlas-server
```

### Start Server (if stopped)
```bash
pm2 start atlas-server
```

### View Server Info
```bash
pm2 info atlas-server
```

### View CPU/Memory Usage
```bash
pm2 monit
```

---

## 🚀 Complete Boot Auto-Start (Optional Final Step)

The server will auto-start in your terminal, but to make it start even when you reboot your Mac, run this command **ONCE**:

```bash
sudo env PATH=$PATH:/opt/homebrew/Cellar/node/24.10.0/bin /opt/homebrew/lib/node_modules/pm2/bin/pm2 startup launchd -u ekodevapps --hp /Users/ekodevapps
```

**Note:** This requires your Mac password and will make the server start automatically on system boot.

---

## 🔧 Troubleshooting

### Server Not Running
```bash
pm2 start atlas-server
```

### Server Keeps Crashing
```bash
pm2 logs atlas-server --err
```

### Port Already in Use
```bash
lsof -i:8787
# Then kill the process using that port:
kill -9 <PID>
pm2 restart atlas-server
```

### Reset Everything
```bash
pm2 delete atlas-server
pm2 start /Users/ekodevapps/atlas-extension/atlas-extension-chat-voice/dev/server/server.js --name atlas-server
pm2 save
```

---

## 📝 Server Location

Your Atlas server is running from:
```
/Users/ekodevapps/atlas-extension/atlas-extension-chat-voice/dev/server/
```

Port: **8787**

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Check status | `pm2 status` |
| View logs | `pm2 logs atlas-server` |
| Restart | `pm2 restart atlas-server` |
| Stop | `pm2 stop atlas-server` |
| Start | `pm2 start atlas-server` |

---

**Your server is now set up to auto-start! 🎉**

Just open a terminal and the server will be running automatically.
