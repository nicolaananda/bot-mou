# 🔍 How to Configure Group Whitelist

## Method 1: Using Group Name (Easiest) ✨

### Steps:

1. **Check your WhatsApp group name**
   - Open WhatsApp
   - Go to the group
   - Check the group name at the top (e.g., "MoU Test", "Finance Team")

2. **Add to `.env` file** using the group name:
   ```bash
   GRUP_ALLOW=MoU Test
   ```

3. **For multiple groups** (comma-separated):
   ```bash
   GRUP_ALLOW=MoU Test,Finance Team,Legal Department
   ```

4. **Restart bot**:
   ```bash
   npm run pm2:restart
   ```

**Note**: Group name matching is **case-insensitive** and uses **partial match**:
- `GRUP_ALLOW=MoU` will match "MoU Test", "MoU Production", "Team MoU", etc.
- `GRUP_ALLOW=test` will match "MoU Test", "Test Group", "Testing", etc.

---

## Method 2: Using `server` Command

### Steps:

1. **Temporarily disable whitelist**:
   - Comment out or remove `GRUP_ALLOW` from `.env`
   - Restart bot: `npm run pm2:restart`

2. **Go to target WhatsApp group**

3. **Send command**: `server`

4. **Bot will respond with server info**
   - Look for "Current Group: ✅ Whitelisted"
   - Group ID is in the chat ID (`m.chat`)

5. **Check PM2 logs for the group ID**:
   ```bash
   npm run pm2:logs
   ```

6. **Re-enable whitelist** with the correct group ID

---

## Method 3: Add Debug Code (Advanced)

### Temporary Debug Mode:

1. **Edit `index.js`**, add this at the beginning of the module:
   ```javascript
   module.exports = async (ronzz, m, mek) => {
     try {
       if (m.fromMe) return
       const isGroup = m.isGroup
       if (!isGroup) return
   
       // DEBUG: Print group ID
       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
       console.log('🔍 GROUP ID:', m.chat)
       console.log('📝 GROUP NAME:', m.isGroup ? 'Group Chat' : 'Private')
       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
   
       // ... rest of code
   ```

2. **Restart bot**: `npm run pm2:restart`

3. **Send message** in the target group

4. **Check logs**: `npm run pm2:logs`

5. **Copy the Group ID** and remove debug code

---

## Format Examples

### Single Group:
```bash
GRUP_ALLOW=MoU Test
```

### Multiple Groups (Comma Separated):
```bash
GRUP_ALLOW=MoU Test,Finance Team,Legal Department
```

### With Spaces (Will be auto-trimmed):
```bash
GRUP_ALLOW=MoU Test, Finance Team, Legal Department
```

### Partial Match (Flexible):
```bash
# This will match any group containing "MoU"
GRUP_ALLOW=MoU

# Matches: "MoU Test", "MoU Production", "Team MoU Finance", etc.
```

---

## 🔒 Security Best Practices

### 1. **Always Use Whitelist in Production**
```bash
# Bad - Bot works everywhere
# GRUP_ALLOW=

# Good - Bot only in specific groups
GRUP_ALLOW=120363420561752464@g.us,120363281630609187@g.us
```

### 2. **Keep Group IDs Private**
- Don't share group IDs publicly
- Add `.env` to `.gitignore` (already done)
- Use separate `.env` for different environments

### 3. **Test After Adding**
```bash
# 1. Add GRUP_ALLOW to .env
# 2. Restart bot
npm run pm2:restart

# 3. Test in allowed group - should work
# Send: server

# 4. Test in non-allowed group - should be ignored
# Bot won't respond at all
```

---

## 🧪 Verification Steps

### Test if Whitelist is Working:

1. **In Allowed Group**:
   - Send: `server`
   - Bot should respond with server info
   - Should see: "Current Group: ✅ Whitelisted"

2. **In Non-Allowed Group**:
   - Send: `server`
   - Bot should NOT respond
   - Check logs: `[GROUP CHECK] Bot ignored message from...`

3. **Upload MoU PDF**:
   - In allowed group: Bot validates ✅
   - In non-allowed group: Bot ignores ❌

---

## 🐛 Troubleshooting

### Bot Not Working in Any Group?

**Check 1**: Verify `.env` format
```bash
# Wrong
GRUP_ALLOW="120363420561752464@g.us"  # Remove quotes

# Correct
GRUP_ALLOW=120363420561752464@g.us
```

**Check 2**: Restart bot after changing `.env`
```bash
npm run pm2:restart
```

**Check 3**: Verify group ID is correct
```bash
# Group ID must end with @g.us
✅ 120363420561752464@g.us
❌ 120363420561752464
❌ 6281234567890@s.whatsapp.net (this is user ID, not group)
```

### Bot Working in All Groups?

**Reason**: `GRUP_ALLOW` is empty or not set

**Fix**:
```bash
# Check .env file
cat .env | grep GRUP_ALLOW

# Should see:
GRUP_ALLOW=120363420561752464@g.us

# If missing or empty, add it and restart
```

---

## 📝 Quick Reference

| Group Type | ID Format | Example |
|------------|-----------|---------|
| **WhatsApp Group** | `[numbers]@g.us` | `120363420561752464@g.us` |
| Private Chat | `[numbers]@s.whatsapp.net` | `6281234567890@s.whatsapp.net` |
| Broadcast | `status@broadcast` | `status@broadcast` |

**Note**: Bot only works in groups (`@g.us`), not private chats.

---

## 🎯 Recommended Setup

### For Production:

```bash
# .env file
OPENAI_KEY=sk-proj-your-actual-key
GRUP_ALLOW=120363420561752464@g.us,120363281630609187@g.us

# Comments for team reference:
# Group 1: 120363420561752464@g.us - Finance Team
# Group 2: 120363281630609187@g.us - Legal Team
```

### For Development:

```bash
# .env file
OPENAI_KEY=sk-proj-your-actual-key
GRUP_ALLOW=120363999888777666@g.us

# Dev group only - test before deploying to production groups
```

---

**Last Updated:** 12 Desember 2025  
**Version:** 2.0

