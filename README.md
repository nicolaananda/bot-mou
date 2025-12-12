<div align="center">

# 🤖 Bot Admin MoU Validator

**Automated MoU (Memorandum of Understanding) Validation for WhatsApp**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)](https://openai.com)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Business_API-25D366?logo=whatsapp)](https://www.whatsapp.com/business/api)

*Say goodbye to manual document verification. Let AI handle your MoU validations in seconds.*

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

**Bot Admin MoU Validator** is an intelligent WhatsApp bot that automatically validates Memorandum of Understanding (MoU) documents. Simply upload your PDF to a WhatsApp group, and the bot will:

- 📥 **Download** the PDF instantly
- 🔍 **Extract** critical data using OpenAI GPT-4o-mini
- ✅ **Validate** dates, duration, amounts, and signatures
- 📊 **Report** detailed results with actionable feedback

Perfect for legal teams, finance departments, and business operations that handle multiple MoU agreements daily.

---

## ✨ Features

<table>
<tr>
<td width="33%">

### 🚀 Instant Processing
Upload PDF → Get validated in **15-40 seconds**. Real-time reactions keep you informed.

</td>
<td width="33%">

### 🧠 AI-Powered
Leverages OpenAI's GPT-4o-mini with file search for accurate data extraction.

</td>
<td width="33%">

### 📋 Comprehensive Checks
- Start & end dates
- Contract duration
- Capital amount
- Signature dates

</td>
</tr>
<tr>
<td colspan="3">

### 🖥️ Server Monitoring
Type `server` in WhatsApp to get real-time server status: CPU, RAM, disk usage, bot uptime, and PM2 status.

</td>
</tr>
</table>

### What Gets Validated?

| Validation | Description | Source |
|------------|-------------|--------|
| **📅 Start Date** | Contract commencement date | Pembukaan + Filename |
| **📅 End Date** | Contract termination date | Pasal 3 + Filename |
| **⏱️ Duration** | Days & months (e.g., 180 days / 6 months) | Pasal 3 + Filename |
| **💰 Amount** | Capital/investment amount (e.g., Rp100.000.000) | PIHAK KETIGA + Filename |
| **✍️ Signature Date** | Document signing date | Closing section |

---

## 🎬 Demo

### Expected Flow

```
1️⃣ Admin uploads PDF to WhatsApp group
   ↓
2️⃣ Bot reacts with ⏳ (Processing...)
   ↓
3️⃣ OpenAI extracts data from PDF
   ↓
4️⃣ Bot validates against filename
   ↓
5️⃣ Bot reacts with ✅ or ❌
   ↓
6️⃣ Detailed report sent to group
```

### Success Example

```
✅ Validasi MoU LENGKAP: Detail file telah diverifikasi dan sesuai dengan isi dokumen.

📅 Tanggal Awal: 7 Desember 2025
📅 Tanggal Akhir: 7 Juni 2026
⏱️ Durasi: 180 hari / 6 bulan
💰 Nominal: Rp100.000.000

Mohon CEO tinjau dan approve.
```

### Failure Example

```
❌ Validasi MoU GAGAL. Admin 1/2, mohon cek kembali file PDF *MoU [...].pdf*. Rincian:
- Tanggal awal di PDF tidak sama dengan tanggal di nama file
- Nominal di PDF (Rp50.000.000) tidak cocok dengan nama file (Rp100.000.000)

Mohon perbaiki file atau nama file sebelum diunggah kembali.
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **OpenAI API Key** ([Get yours](https://platform.openai.com/api-keys))
- **WhatsApp** Business or Personal account
- **PM2** for production deployment ([Install guide](./PM2-SETUP.md))

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/nicolaananda/bot-mou.git
cd bot-mou

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment
cp env.example .env
nano .env  # Add your OPENAI_KEY

# 4. Start the bot (development)
npm start
```

### Production Setup (Recommended)

For production deployment, use PM2:

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Setup and start bot
npm run pm2:start

# 3. Enable auto-start on boot
pm2 save
pm2 startup
```

📖 **Full production guide:** [QUICK-START.md](./QUICK-START.md) or [PM2-SETUP.md](./PM2-SETUP.md)

### First Run

1. **Scan QR Code**: Open WhatsApp on your phone and scan the QR code displayed in terminal
   - Development: Watch terminal output
   - Production: Run `npm run pm2:logs`
2. **Join Test Group**: Add the bot to a WhatsApp group
3. **Test Upload**: Send a test MoU PDF to validate setup

---

## 💬 Commands

### 🖥️ Server Monitoring

Simply type `server` in the WhatsApp group to get detailed server status:

```
server
```

**Response includes:**
- 📊 System info (OS, architecture, uptime)
- 💻 CPU details (model, cores)
- 🧠 Memory usage (total, used, free)
- 💾 Disk usage
- 🤖 Bot info (Node.js version, uptime, PM2 status)
- 📈 Bot memory usage

Perfect for remote monitoring without SSH! 🎯

For complete command documentation, see **[COMMANDS.md](./COMMANDS.md)**

---

## 📝 Filename Convention

The bot requires a specific filename format for validation:

```
MoU [Party A] - [Party B] [Amount] jt, [Duration] Bulan ([Start Date] - [End Date]) I-[Initials].pdf
```

### ✅ Valid Examples

```
MoU Hasan - Umi 100 jt, 6 Bulan (7 Desember 2025 - 7 Juni 2026) I-Adie.pdf
MoU PT ABC - PT XYZ 500 jt, 12 Bulan (1 Jan 2026 - 1 Jan 2027) I-Admin1.pdf
```

### ❌ Invalid Examples

```
MoU-Hasan-Umi.pdf                    # Missing all metadata
Contract 100jt.pdf                    # Doesn't contain "MoU"
MoU Test (no dates).pdf               # Missing date range
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required
OPENAI_KEY=sk-proj-your-api-key-here
```

### Bot Settings

Edit `setting.js` to customize:

```javascript
// Bot identity
global.botName = "MoU Validator Bot"
global.owner = ["628xxxxxxxxxx"]

// Owner info
global.ownerName = "Your Name"
```

---

## 📚 Documentation

For comprehensive documentation, see **[PRD-Bot-Admin-MoU-Validator.md](./PRD-Bot-Admin-MoU-Validator.md)**

Topics covered:
- 🏗️ Technical Architecture
- 🔄 Detailed Workflow
- 🧪 Testing Guidelines
- 🚢 Deployment Instructions
- 🔐 Security Best Practices
- 💰 Cost Analysis
- ❓ FAQ & Troubleshooting

**Commands:** See **[COMMANDS.md](./COMMANDS.md)** for all available bot commands

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nodejs" width="48" height="48" alt="Node.js" />
<br>Node.js
</td>
<td align="center" width="96">
<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="48" height="48" alt="WhatsApp" />
<br>WhatsApp
</td>
<td align="center" width="96">
<img src="https://cdn.worldvectorlogo.com/logos/openai-2.svg" width="48" height="48" alt="OpenAI" />
<br>OpenAI
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=javascript" width="48" height="48" alt="JavaScript" />
<br>JavaScript
</td>
</tr>
</table>

**Core Dependencies:**
- `@dappaoffc/baileys` - WhatsApp Web API client
- `openai` - OpenAI API integration (via fetch)
- `moment-timezone` - Date/time parsing & validation
- `form-data` - Multipart form handling for file uploads

---

## 📊 Project Structure

```
bot-mou/
├── 📄 nicola.js              # Entry point (npm start)
├── 📄 main.js                # WhatsApp bot initialization
├── 📄 index.js               # Message handler (MoU validation + commands)
├── 📄 setting.js             # Bot configuration
├── 📦 package.json           # Dependencies & scripts
├── 📄 ecosystem.config.js    # PM2 configuration
├── 📁 session/               # WhatsApp authentication data
├── 📁 pdf/                   # Test MoU files
│   └── MoU Hasan - Umi...pdf
├── 📁 logs/                  # PM2 logs directory
├── 📄 README.md              # Main documentation
├── 📄 COMMANDS.md            # Bot commands reference
├── 📄 QUICK-START.md         # Quick deployment guide
├── 📄 PM2-SETUP.md           # Complete PM2 guide
├── 📄 README-PM2.md          # PM2 vs Systemd vs Docker
├── 📄 SETUP.md               # Development setup guide
├── 📄 PRD-Bot-Admin-MoU-Validator.md  # Product requirements
└── 📄 .gitignore             # Git ignore rules
```

---

## 🧪 Testing

### Manual Test

1. **Start the bot**: `npm start`
2. **Scan QR code** with WhatsApp
3. **Upload test PDF** from `pdf/` folder to a group
4. **Observe**:
   - ⏳ reaction appears immediately
   - Processing completes in <1 minute
   - ✅ or ❌ reaction appears
   - Detailed message sent

### Sample Test File

A test MoU is included in `pdf/` folder:
```
MoU Hasan - Umi 100 jt, 6 Bulan (7 Desember 2025 - 7 Juni 2026) I-Adie.pdf
```

---

## 🐛 Troubleshooting

### Bot doesn't respond to PDF?

**Check:**
- ✅ Filename contains "MoU" (case-insensitive)
- ✅ File is PDF format (not image or Word doc)
- ✅ `OPENAI_KEY` is set in `.env`
- ✅ Bot has been added to the group

### "Ekstraksi OpenAI gagal" error?

**Solutions:**
- Verify OpenAI API key is valid
- Check API quota hasn't been exceeded
- Ensure stable internet connection
- Try again (OpenAI API may be temporarily unavailable)

### Validation always fails?

**Common issues:**
- Filename doesn't follow convention
- PDF content incomplete (missing dates, amount, or signatures)
- Date format inconsistent (use "7 Desember 2025" not "07/12/2025")

---

## 💰 Cost & Performance

### Cost per Validation
- **File Upload**: Free
- **Assistant Creation**: Free
- **File Search Tool**: ~$0.10 per GB-day (minimal for 1 PDF)
- **GPT-4o-mini Tokens**: ~$0.15-0.60 per 1M tokens

**Estimated: $0.01 - $0.05 per validation**

### Performance
- **PDF Download**: 1-2 seconds
- **OpenAI Processing**: 10-30 seconds
- **Total Response Time**: 15-40 seconds

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Ideas for Contributions
- 🌍 Multi-language support (English MoUs)
- 📧 Email notifications
- 📊 Validation history dashboard
- 🔐 Digital signature integration
- 🖼️ OCR support for scanned PDFs

---

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for providing GPT-4o-mini API
- **Baileys** for WhatsApp Web API client
- **Moment.js** for robust date parsing
- All contributors and users of this bot

---

## 📞 Support

- 📧 **Email**: gmail@Nicola.id
- 💬 **Issues**: [Create an issue](https://github.com/nicolaananda/bot-mou/issues)
- 📖 **Docs**: [PRD Documentation](./PRD-Bot-Admin-MoU-Validator.md)

---

<div align="center">

**Made with ❤️ by Nicola Ananda**

⭐ Star this repo if you find it helpful!

[Back to Top](#-bot-admin-mou-validator)

</div>
