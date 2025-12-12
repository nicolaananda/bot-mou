# ⚡ Quick Start - PM2 Production Deployment

## 🎯 TL;DR - Deploy in 5 Minutes

```bash
# 1. Install PM2
npm install -g pm2

# 2. Setup environment
cp env.example .env
nano .env  # Add your OPENAI_KEY

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Start with PM2
npm run pm2:start

# 5. Setup auto-start on boot
pm2 save
pm2 startup  # Follow the command it shows

# 6. Check status
npm run pm2:logs
```

## 📦 What's Included

### Files Created:
- ✅ `ecosystem.config.js` - PM2 configuration
- ✅ `PM2-SETUP.md` - Complete PM2 guide
- ✅ `logs/` - Log directory (auto-created)
- ✅ `.gitignore` - Updated for PM2 logs

### New NPM Scripts:
```bash
npm run pm2:start    # Start bot with PM2
npm run pm2:stop     # Stop bot
npm run pm2:restart  # Restart bot
npm run pm2:logs     # View logs (real-time)
npm run pm2:monit    # Monitor resources
npm run pm2:delete   # Remove from PM2
```

## 🚀 First Time Setup

### On Your Server:

```bash
# Clone repository
git clone <your-repo-url> bot-admin
cd bot-admin

# Setup environment
cp env.example .env
nano .env
# Add: OPENAI_KEY=sk-proj-your-actual-key

# Install dependencies
npm install --legacy-peer-deps

# Start with PM2
npm run pm2:start

# Scan WhatsApp QR
npm run pm2:logs

# Save process & enable auto-start
pm2 save
pm2 startup
```

### Connect WhatsApp:

1. Watch logs: `npm run pm2:logs`
2. Scan QR code with WhatsApp
3. Wait for "CONNECTION OPEN" message
4. Bot is ready! 🎉

## 🔍 Daily Operations

### Check Bot Status
```bash
pm2 status
# or
pm2 list
```

### View Logs
```bash
# Real-time logs
npm run pm2:logs

# Last 50 lines
pm2 logs bot-mou-admin --lines 50

# Error logs only
pm2 logs bot-mou-admin --err
```

### Restart Bot
```bash
npm run pm2:restart
```

### Update Bot
```bash
# Pull latest code
git pull

# Install new dependencies (if any)
npm install --legacy-peer-deps

# Restart
npm run pm2:restart
```

## 🐛 Troubleshooting

### Bot Not Starting?
```bash
# Check logs
npm run pm2:logs

# Delete and restart
npm run pm2:delete
npm run pm2:start
```

### WhatsApp Session Expired?
```bash
# Stop bot
npm run pm2:stop

# Remove session
rm -rf session/

# Start again
npm run pm2:start

# Scan new QR code
npm run pm2:logs
```

### Need Clean Slate?
```bash
pm2 delete all
pm2 kill
rm -rf session/
npm run pm2:start
```

## 📊 Monitoring

### Resource Usage
```bash
npm run pm2:monit
```

### Detailed Info
```bash
pm2 show bot-mou-admin
```

### Log Files Location
- Output: `logs/pm2-out.log`
- Errors: `logs/pm2-error.log`

## 🔒 Security Checklist

- [ ] `.env` file has correct permissions (`chmod 600 .env`)
- [ ] Running as non-root user
- [ ] Session folder protected (`chmod 700 session/`)
- [ ] Firewall configured (if needed)
- [ ] PM2 auto-start enabled

## 📚 Full Documentation

For complete guide, see [PM2-SETUP.md](./PM2-SETUP.md)

---

**Ready to deploy?** Run `npm run pm2:start` now! 🚀
