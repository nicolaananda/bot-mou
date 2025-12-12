# 📋 Bot Commands Documentation

## Available Commands

### 🖥️ Server Monitoring

**Command:** `server`, `.server`, or `!server`

**Description:** Get detailed server and bot status information for remote monitoring

**Usage:** Simply send the word "server" in a WhatsApp group where the bot is present

**What it shows:**
- 📊 **System Information**
  - Operating System details
  - System architecture
  - Hostname
  - System uptime

- 💻 **CPU Information**
  - CPU model
  - Number of cores

- 🧠 **Memory Usage**
  - Total RAM
  - Used RAM (with percentage)
  - Free RAM

- 💾 **Disk Usage**
  - Root partition usage (Linux/Mac)

- 🤖 **Bot Information**
  - Node.js version
  - Bot name
  - Bot uptime
  - PM2 status (if running with PM2)

- 📈 **Bot Memory Usage**
  - RSS (Resident Set Size)
  - Heap usage

- 📶 **Bot Performance**
  - Response time in milliseconds
  - Status indicator (🟢 Excellent / 🟡 Good / 🔴 Slow)

**Example:**

```
User: server
Bot: [Displays detailed server report]
```

**Sample Output:**

```
🖥️ SERVER & BOT STATUS REPORT

━━━━━━━━━━━━━━━━━━━━━━
📊 SYSTEM INFORMATION
━━━━━━━━━━━━━━━━━━━━━━
🔹 OS: Darwin 23.1.0 (darwin)
🔹 Architecture: arm64
🔹 Hostname: server-prod
🔹 Uptime: 15d 8h 42m

━━━━━━━━━━━━━━━━━━━━━━
💻 CPU INFORMATION
━━━━━━━━━━━━━━━━━━━━━━
🔹 Model: Apple M1
🔹 Cores: 8

━━━━━━━━━━━━━━━━━━━━━━
🧠 MEMORY USAGE
━━━━━━━━━━━━━━━━━━━━━━
🔹 Total: 16.00 GB
🔹 Used: 12.50 GB (78.1%)
🔹 Free: 3.50 GB

━━━━━━━━━━━━━━━━━━━━━━
💾 DISK USAGE
━━━━━━━━━━━━━━━━━━━━━━
🔹 Root: 65% used (130 GB / 200 GB)

━━━━━━━━━━━━━━━━━━━━━━
🤖 BOT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━
🔹 Node.js: v18.17.0
🔹 Bot Name: MoU Validator Bot
🔹 Bot Uptime: 5d 12h 30m
🔹 PM2 Status: ✅ Running (ID: 0)

━━━━━━━━━━━━━━━━━━━━━━
📈 BOT MEMORY USAGE
━━━━━━━━━━━━━━━━━━━━━━
🔹 RSS: 245.32 MB
🔹 Heap Used: 128.45 MB / 180.00 MB

━━━━━━━━━━━━━━━━━━━━━━
📶 BOT PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━
🔹 Response Time: 324ms
🔹 Status: 🟢 Excellent

━━━━━━━━━━━━━━━━━━━━━━
⏰ Timestamp: 12 Dec 2025 21:30:45

Monitoring by Nicola Ananda
```

---

### 📄 MoU Validation

**Trigger:** Upload PDF with "MoU" in filename

**Description:** Automatically validates MoU (Memorandum of Understanding) documents

**How it works:**
1. Upload a PDF document to the group
2. Filename must contain "MoU" (case-insensitive)
3. Bot will:
   - React with ⏳ (processing)
   - Extract data using OpenAI
   - Validate dates, duration, and amount
   - React with 👌🏻 (success) or ❌ (failure)
   - Send detailed validation report to bot's own number (for records)

**Note**: Group members only see the reaction emoji. Full validation report is sent to the bot's number privately for record-keeping.

**Filename Format:**
```
MoU [Party A] - [Party B] [Amount] jt, [Duration] Bulan ([Start Date] - [End Date]) I-[Initials].pdf
```

**Example:**
```
MoU Hasan - Umi 100 jt, 6 Bulan (7 Desember 2025 - 7 Juni 2026) I-Adie.pdf
```

**What it validates:**
- ✅ Start date (from PDF vs filename)
- ✅ End date (from PDF vs filename)
- ✅ Duration (days and months)
- ✅ Amount (capital/investment)
- ✅ Signature date

**Group Response (Reaction Only):**
- Success: 👌🏻
- Failure: ❌

**Bot's Private Chat (Full Report):**

Success:
```
📋 VALIDATION REPORT
━━━━━━━━━━━━━━━━━━━━━━
📁 File: MoU Hasan - Umi 100 jt...pdf
👥 Group: 120363420561752464@g.us
⏰ Time: 12 Dec 2025 22:15:30
━━━━━━━━━━━━━━━━━━━━━━

👌🏻 Validasi MoU LENGKAP: Detail file telah diverifikasi dan sesuai dengan isi dokumen.

📅 Tanggal Awal: 7 Desember 2025
📅 Tanggal Akhir: 7 Juni 2026
⏱️ Durasi: 180 hari / 6 bulan
💰 Nominal: Rp100.000.000

Mohon CEO tinjau dan approve.
```

Failure:
```
📋 VALIDATION REPORT
━━━━━━━━━━━━━━━━━━━━━━
📁 File: MoU Hasan - Umi 50 jt...pdf
👥 Group: 120363420561752464@g.us
⏰ Time: 12 Dec 2025 22:16:45
━━━━━━━━━━━━━━━━━━━━━━

❌ Validasi MoU GAGAL. Admin 1/2, mohon cek kembali file PDF *MoU [...].pdf*. Rincian:
- Tanggal awal di PDF tidak sama dengan tanggal di nama file
- Nominal di PDF (Rp50.000.000) tidak cocok dengan nama file (Rp100.000.000)

Mohon perbaiki file atau nama file sebelum diunggah kembali.
```

---

## 🔒 Access Control

### Group-Only Commands
All commands work only in WhatsApp groups, not in private chats.

### Bot Owner
Owner numbers are defined in `setting.js`:
```javascript
global.owner = ["6287777657944","6281389592985","6287887842985"]
```

---

## 🛠️ Adding New Commands

To add new commands, edit `index.js` and add new command handlers in the text command section:

```javascript
// Handle text commands
const text = (m.text || '').toLowerCase().trim()

// Your new command
if (text === 'mycommand' || text === '.mycommand') {
  // Handle your command here
  return await handleMyCommand(ronzz, m)
}
```

---

## 📊 Command List Summary

| Command | Type | Description | Access |
|---------|------|-------------|--------|
| `server` | Text | Server & bot monitoring | Group |
| Upload PDF with "MoU" | Document | MoU validation | Group |

---

## 💡 Tips

1. **Server Monitoring**: Use `server` command regularly to check bot health
2. **Response Time Indicators**:
   - 🟢 Excellent: < 1000ms (bot very responsive)
   - 🟡 Good: 1000-3000ms (normal performance)
   - 🔴 Slow: > 3000ms (check server load/network)
3. **MoU Validation**: Ensure filename follows the correct format
4. **Response Time**: 
   - Server command: ~300-800ms (measured in output)
   - MoU validation: ~15-40 seconds (OpenAI processing)

---

## 🐛 Troubleshooting

### Server command not working?
- Check if bot is in the group
- Ensure message is sent in a group (not private chat)
- Try with prefix: `.server` or `!server`

### MoU validation not triggering?
- Filename must contain "MoU" (case-insensitive)
- File must be PDF format
- Check if OPENAI_KEY is set in `.env`

---

**Last Updated:** 12 Desember 2025  
**Bot Version:** 2.0

