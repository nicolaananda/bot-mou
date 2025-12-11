# 🚀 Setup Guide - Bot Admin MoU Validator

## ✅ Fixed: OPENAI_KEY Loading Issue

Bot sekarang sudah di-update untuk load `OPENAI_KEY` dari file `.env`.

## 🔧 Setup Steps

### 1. Pastikan `.env` File Ada

File `.env` sudah ada dengan OPENAI_KEY yang valid:
```
OPENAI_KEY=sk-proj-...
```

### 2. Restart Bot

**Stop bot yang sedang running** (Ctrl+C di terminal), lalu start ulang:

```bash
npm start
```

### 3. Test Validasi

Kirim PDF MoU ke grup WhatsApp dengan format nama file:
```
MoU [Party A] - [Party B] [Amount] jt, [Duration] Bulan ([Start Date] - [End Date]) - [Initial].pdf
```

Contoh:
```
MoU Hasan - Fiqih 30 jt, 6 Bulan (30 Januari 2026 - 30 Juli 2026) - Adie.pdf
```

### 4. Verifikasi Bot Berjalan

Bot akan:
1. ⏳ React dengan emoji processing saat PDF diterima
2. 🤖 Upload PDF ke OpenAI dan ekstrak data
3. ✅ atau ❌ React sesuai hasil validasi
4. 📝 Kirim laporan detail ke grup

## 🐛 Troubleshooting

### Bot masih error "OPENAI_KEY tidak tersedia"?

1. **Check .env file:**
   ```bash
   cat .env
   ```
   Pastikan ada baris `OPENAI_KEY=sk-proj-...`

2. **Verify dotenv loaded:**
   Buka `main.js` dan pastikan baris pertama adalah:
   ```javascript
   require('dotenv').config()
   ```

3. **Restart bot completely:**
   - Stop dengan Ctrl+C
   - Start ulang dengan `npm start`

### OpenAI API Error?

Check API key masih valid:
- Login ke https://platform.openai.com/api-keys
- Verify key belum expired atau quota habis

### PDF Tidak Terdeteksi?

Pastikan:
- Filename mengandung "MoU" (case-insensitive)
- File adalah PDF asli (bukan foto/scan)
- Bot sudah ada di grup WhatsApp

## 📊 Expected Behavior

Setelah restart, bot akan:
```
✅ Load OPENAI_KEY dari .env
✅ Connect ke WhatsApp
✅ Siap validasi PDF MoU
```

Test dengan PDF yang sudah ada:
```
pdf/MoU Hasan - Umi 100 jt, 6 Bulan (7 Desember 2025 - 7 Juni 2026) I-Adie.pdf
```

## 🎯 Next Steps

1. **Restart bot sekarang**
2. **Kirim ulang PDF** untuk test
3. **Monitor logs** untuk debug jika masih ada error

---

**Bot Version:** 2.0  
**Last Updated:** 11 Desember 2025

