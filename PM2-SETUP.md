# 🚀 PM2 Production Setup Guide

## 📦 Installation

### 1. Install PM2 Globally

```bash
npm install -g pm2
```

### 2. Verify Installation

```bash
pm2 -v
```

## 🎯 Running the Bot

### Start Bot

```bash
pm2 start ecosystem.config.js
```

### Alternative Commands

```bash
# Start directly with nicola.js
pm2 start nicola.js --name bot-mou-admin

# Start with ecosystem file (recommended)
pm2 start ecosystem.config.js
```

## 📊 Monitoring & Management

### Check Status

```bash
pm2 status
pm2 list
```

### View Logs

```bash
# Real-time logs
pm2 logs bot-mou-admin

# Last 100 lines
pm2 logs bot-mou-admin --lines 100

# Error logs only
pm2 logs bot-mou-admin --err

# Output logs only
pm2 logs bot-mou-admin --out
```

### Monitor Resources

```bash
# Real-time monitoring dashboard
pm2 monit

# Detailed info
pm2 show bot-mou-admin
```

## 🔄 Update & Restart

### Restart Bot

```bash
# Restart specific app
pm2 restart bot-mou-admin

# Restart all apps
pm2 restart all

# Reload with zero-downtime (if supported)
pm2 reload bot-mou-admin
```

### Stop Bot

```bash
# Stop specific app
pm2 stop bot-mou-admin

# Stop all apps
pm2 stop all
```

### Delete from PM2

```bash
pm2 delete bot-mou-admin
```

## 🔧 Configuration Options

### Current Setup (`ecosystem.config.js`)

| Setting | Value | Description |
|---------|-------|-------------|
| **name** | `bot-mou-admin` | App identifier in PM2 |
| **script** | `nicola.js` | Entry point |
| **instances** | `1` | Single instance (WhatsApp session limitation) |
| **autorestart** | `true` | Auto-restart on crash |
| **max_memory_restart** | `500M` | Restart if memory exceeds 500MB |
| **max_restarts** | `10` | Max 10 restarts in `min_uptime` window |
| **restart_delay** | `4000ms` | Wait 4s before restart |

### Memory & Performance Tuning

```javascript
// Edit ecosystem.config.js
max_memory_restart: '500M',  // Increase if bot uses more memory
min_uptime: '10s',           // Minimum uptime before considered stable
```

### Enable Auto-restart Schedule (Optional)

```javascript
// Restart every day at 3 AM (to prevent memory leaks)
cron_restart: '0 3 * * *',
```

## 🚀 Auto-start on Server Boot

### Save PM2 Process List

```bash
pm2 save
```

### Generate Startup Script

```bash
# Detect init system and generate startup script
pm2 startup

# Follow the instructions shown (usually requires sudo)
# Example output:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u yourusername --hp /home/yourusername
```

### Disable Auto-start

```bash
pm2 unstartup
```

## 📁 Log Management

### Log Locations

- **Output logs**: `logs/pm2-out.log`
- **Error logs**: `logs/pm2-error.log`

### Rotate Logs (Prevent Large Files)

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M        # Rotate when log reaches 10MB
pm2 set pm2-logrotate:retain 7            # Keep 7 rotated logs
pm2 set pm2-logrotate:compress true       # Compress old logs
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### Clear Logs

```bash
pm2 flush bot-mou-admin
```

## 🔒 Security Best Practices

### 1. Run as Non-root User

```bash
# Create dedicated user
sudo adduser botuser
sudo su - botuser

# Install PM2 for this user
npm install -g pm2
cd /path/to/bot-admin
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Protect .env File

```bash
chmod 600 .env
```

### 3. Restrict Session Folder

```bash
chmod 700 session/
```

## 🐛 Troubleshooting

### Bot Won't Start

```bash
# Check logs
pm2 logs bot-mou-admin --lines 50

# Check detailed info
pm2 show bot-mou-admin

# Try starting in no-daemon mode (debug)
pm2 start ecosystem.config.js --no-daemon
```

### Bot Keeps Restarting

```bash
# Check error logs
pm2 logs bot-mou-admin --err

# Common issues:
# 1. OPENAI_KEY not set in .env
# 2. WhatsApp session expired (delete session/ folder)
# 3. Port already in use
# 4. Missing dependencies (npm install)
```

### High Memory Usage

```bash
# Monitor memory
pm2 monit

# Restart to clear memory
pm2 restart bot-mou-admin

# Lower max_memory_restart if needed
# Edit ecosystem.config.js:
max_memory_restart: '300M'
```

### Clean Restart

```bash
# Delete PM2 process completely
pm2 delete bot-mou-admin

# Remove session (forces WhatsApp re-login)
rm -rf session/

# Start fresh
pm2 start ecosystem.config.js
pm2 save
```

## 📈 Advanced Features

### Environment Variables

```bash
# Start with different env vars
pm2 start ecosystem.config.js --env production

# Update env without restart
pm2 restart bot-mou-admin --update-env
```

### Multiple Environments

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bot-mou-admin',
    script: 'nicola.js',
    env_development: {
      NODE_ENV: 'development',
      DEBUG: 'true',
    },
    env_production: {
      NODE_ENV: 'production',
      DEBUG: 'false',
    },
  }],
}
```

### PM2 Web Interface (Optional)

```bash
# Install PM2 Plus (free tier available)
pm2 link [secret-key] [public-key]

# Or use local web interface
pm2 web
```

## 🔄 Deployment Workflow

### Standard Update Process

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if updated)
npm install --legacy-peer-deps

# 3. Restart bot
pm2 restart bot-mou-admin

# 4. Check logs
pm2 logs bot-mou-admin --lines 20
```

### Zero-downtime Deployment (if supported)

```bash
git pull
npm install --legacy-peer-deps
pm2 reload bot-mou-admin
```

## 📊 PM2 Commands Cheatsheet

```bash
# Lifecycle
pm2 start ecosystem.config.js    # Start app
pm2 restart bot-mou-admin         # Restart app
pm2 reload bot-mou-admin          # Reload with zero-downtime
pm2 stop bot-mou-admin            # Stop app
pm2 delete bot-mou-admin          # Remove from PM2

# Monitoring
pm2 list                          # List all apps
pm2 status                        # Show status
pm2 monit                         # Real-time monitor
pm2 logs                          # All logs
pm2 logs bot-mou-admin            # App-specific logs
pm2 logs --lines 100              # Last 100 lines

# Management
pm2 save                          # Save process list
pm2 resurrect                     # Restore saved processes
pm2 startup                       # Generate startup script
pm2 unstartup                     # Remove startup script
pm2 update                        # Update PM2

# Info
pm2 show bot-mou-admin            # Detailed info
pm2 describe bot-mou-admin        # Same as show
pm2 env 0                         # Show environment variables
```

## ✅ Quick Start Checklist

- [ ] Install PM2: `npm install -g pm2`
- [ ] Create `.env` file with `OPENAI_KEY`
- [ ] Install dependencies: `npm install --legacy-peer-deps`
- [ ] Create logs directory: `mkdir -p logs`
- [ ] Start bot: `pm2 start ecosystem.config.js`
- [ ] Check status: `pm2 status`
- [ ] View logs: `pm2 logs bot-mou-admin`
- [ ] Save process: `pm2 save`
- [ ] Setup auto-start: `pm2 startup`
- [ ] Test with WhatsApp QR scan
- [ ] Upload test MoU PDF

## 🎯 Production Checklist

- [ ] PM2 auto-start on boot enabled
- [ ] Log rotation configured
- [ ] Memory limits set
- [ ] Error monitoring active
- [ ] Backups automated
- [ ] `.env` file secured (chmod 600)
- [ ] Session folder protected (chmod 700)
- [ ] Running as non-root user
- [ ] Firewall configured
- [ ] Monitoring alerts setup

---

**Bot Version:** 2.0  
**Last Updated:** 12 Desember 2025  
**PM2 Recommended Version:** >= 5.0.0
