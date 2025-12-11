# Product Requirements Document (PRD)
## Bot Admin MoU Validator - WhatsApp

**Version:** 2.0  
**Last Updated:** 11 Desember 2025  
**Status:** Production Ready

---

## 1. Executive Summary

Bot Admin MoU Validator adalah bot WhatsApp yang secara otomatis memvalidasi dokumen Memorandum of Understanding (MoU) berformat PDF yang diunggah dalam grup. Bot menggunakan OpenAI API untuk mengekstrak data dari PDF dan memvalidasi kesesuaian antara isi dokumen dengan konvensi penamaan file.

### 1.1 Tujuan
- Otomatisasi validasi dokumen MoU sebelum approval CEO
- Memastikan konsistensi data antara nama file dan isi dokumen
- Mengurangi human error dalam proses verifikasi dokumen

### 1.2 Stakeholders
- **CEO**: Pengambil keputusan akhir
- **Admin 1 & Admin 2**: Pengunggah dokumen MoU
- **Bot Admin**: Pelaksana validasi otomatis
- **Developer/Operator**: Pemelihara sistem bot

---

## 2. Technical Architecture

### 2.1 Technology Stack
- **Platform**: WhatsApp Business API via Baileys
- **Runtime**: Node.js
- **AI Service**: OpenAI GPT-4o-mini dengan File Search
- **Dependencies**:
  - `@dappaoffc/baileys` - WhatsApp client
  - `moment-timezone` - Date/time handling
  - `node-fetch` - HTTP requests
  - `form-data` - Multipart form handling

### 2.2 Environment Requirements
```bash
OPENAI_KEY=sk-...  # Required: OpenAI API key
```

### 2.3 File Structure
```
bot-admin/
├── index.js           # Main validator handler
├── main.js            # WhatsApp bot initialization
├── setting.js         # Bot configuration
├── package.json       # Dependencies
└── session/           # WhatsApp session data
```

---

## 3. Feature Specifications

### 3.1 Trigger Conditions
Bot akan aktif ketika:
1. ✅ File PDF dikirim di grup WhatsApp
2. ✅ Nama file mengandung kata "MoU" (case-insensitive)
3. ✅ Pengirim bukan bot sendiri

### 3.2 Filename Convention
Format yang diharapkan:
```
MoU [Pihak A] - [Pihak B] [Nominal] jt, [Durasi] Bulan ([Tanggal Mulai] - [Tanggal Akhir]) I-[Inisial].pdf
```

**Contoh:**
```
MoU Hasan - Umi 100 jt, 6 Bulan (7 Desember 2025 - 7 Februari 2026) I-Adie.pdf
MoU PT ABC - PT XYZ 500 jt, 12 Bulan (1 Januari 2026 - 1 Januari 2027) I-Admin1.pdf
```

**Data yang diekstrak dari filename:**
- Tanggal mulai: `7 Desember 2025`
- Tanggal akhir: `7 Februari 2026`
- Durasi: `6` bulan
- Nominal: `100` juta → Rp100.000.000

---

## 4. Validation Workflow

### 4.1 Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PDF Detected in Group                                    │
│    ├─ Check: Filename contains "MoU"?                       │
│    └─ Check: Not from bot itself?                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Send Processing Reaction ⏳                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Download PDF Buffer from WhatsApp                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Upload PDF to OpenAI Files API                           │
│    ├─ Create Assistant with file_search tool                │
│    ├─ Create Thread & Message                               │
│    └─ Run extraction prompt                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Poll for Completion (max 30 attempts, 2s interval)       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Parse JSON Response                                       │
│    {                                                         │
│      "start_date": "7 Desember 2025",                       │
│      "end_date": "7 Juni 2026",                             │
│      "duration_days": 180,                                   │
│      "duration_months": 6,                                   │
│      "amount_rupiah": 100000000,                            │
│      "sign_date": "7 Desember 2025"                         │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Cross-validation with Filename                           │
│    ├─ Start date match?                                     │
│    ├─ End date match?                                       │
│    ├─ Duration match?                                       │
│    ├─ Amount match?                                         │
│    └─ Sign date = start date?                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Send Result                                               │
│    ├─ ✅ All validations passed → Success report            │
│    └─ ❌ Any validation failed → Error report with details  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Validation Rules

#### Rule 1: Tanggal Awal Akad
- **Source PDF**: Cari di pembukaan dokumen, biasanya format:
  - "tgl [DD] [Bulan] [YYYY] di Pangalengan..."
  - Atau tanggal pertama yang muncul
- **Source Filename**: Ekstrak dari `(7 Desember 2025 - ...)`
- **Validation**: Tanggal di PDF harus sama dengan tanggal di filename
- **Error Message**: `"Tanggal awal di PDF tidak sama dengan tanggal di nama file"`

#### Rule 2: Tanggal Akhir Kontrak
- **Source PDF**: Cari di Pasal 3 "JANGKA WAKTU KERJASAMA"
  - Format: "180 hari (7 Juni 2026)"
- **Source Filename**: Ekstrak dari `(... - 7 Februari 2026)`
- **Validation**: Tanggal di PDF harus sama dengan tanggal di filename
- **Error Message**: `"Tanggal akhir di PDF tidak sama dengan tanggal di nama file"`

#### Rule 3: Durasi Kontrak
- **Source PDF**: 
  - `duration_days` (integer, e.g., 180)
  - `duration_months` (integer, e.g., 6)
- **Source Filename**: Ekstrak dari `6 Bulan`
- **Validation**: 
  - Durasi harus ditemukan di PDF
  - Jika filename ada durasi, harus cocok dengan PDF
- **Error Messages**: 
  - `"Durasi (hari/bulan) tidak ditemukan di PDF"`
  - `"Durasi di PDF (12 bulan) tidak cocok dengan nama file (6 bulan)"`

#### Rule 4: Nominal Modal
- **Source PDF**: Cari di bagian "C. PIHAK KETIGA"
  - Format: "Rp. 100.000.000 (seratus juta rupiah)"
  - Ekstrak sebagai integer: `100000000`
- **Source Filename**: Ekstrak dari `100 jt` → Rp100.000.000
- **Validation**: 
  - Nominal harus ditemukan di PDF
  - Jika filename ada nominal, harus cocok dengan PDF
- **Error Messages**:
  - `"Nominal modal tidak ditemukan di PDF"`
  - `"Nominal di PDF (Rp50.000.000) tidak cocok dengan nama file (Rp100.000.000)"`

#### Rule 5: Tanggal Tanda Tangan
- **Source PDF**: Cari di halaman akhir
  - Format: "Bandung, 7 Desember 2025"
- **Validation**: Tanggal tanda tangan harus sama dengan tanggal awal akad
- **Error Message**: `"Tanggal tanda tangan berbeda dengan tanggal awal akad"`

---

## 5. Output Specifications

### 5.1 Success Response (All Validations Passed)

**Reaction:** ✅

**Message Format:**
```
✅ Validasi MoU LENGKAP: Detail file telah diverifikasi dan sesuai dengan isi dokumen.

📅 Tanggal Awal: 7 Desember 2025
📅 Tanggal Akhir: 7 Juni 2026
⏱️ Durasi: 180 hari / 6 bulan
💰 Nominal: Rp100.000.000

Mohon CEO tinjau dan approve.
```

### 5.2 Failure Response (One or More Validations Failed)

**Reaction:** ❌

**Message Format:**
```
❌ Validasi MoU GAGAL. Admin 1/2, mohon cek kembali file PDF *MoU [...].pdf*. Rincian:
- Tanggal awal di PDF tidak sama dengan tanggal di nama file
- Durasi di PDF (180 hari) tidak cocok dengan nama file (90 hari)
- Nominal di PDF (Rp50.000.000) tidak cocok dengan nama file (Rp100.000.000)

Mohon perbaiki file atau nama file sebelum diunggah kembali.
```

### 5.3 Processing Indicator

**Reaction:** ⏳ (shown during validation process)

---

## 6. Error Handling

### 6.1 PDF Download Error
```
- Gagal mengunduh PDF: [error message]
```

### 6.2 OpenAI API Error
```
- Ekstraksi OpenAI gagal: [error message]
```

### 6.3 Missing Environment Variable
```
- OPENAI_KEY tidak tersedia; tidak bisa membaca PDF
```

### 6.4 Data Extraction Failure
```
- Gagal mengekstrak data dari PDF
```

### 6.5 Missing Data in Filename
```
- Tanggal awal tidak ada di nama file
- Tanggal akhir tidak ada di nama file
- Nominal tidak tertulis di nama file
```

---

## 7. API Integration Details

### 7.1 OpenAI Files API
```javascript
POST https://api.openai.com/v1/files
Headers:
  Authorization: Bearer ${OPENAI_KEY}
Body: 
  FormData with PDF file
  purpose: "assistants"
```

### 7.2 OpenAI Assistants API
```javascript
POST https://api.openai.com/v1/assistants
Headers:
  Authorization: Bearer ${OPENAI_KEY}
  OpenAI-Beta: assistants=v2
Body:
  model: "gpt-4o-mini"
  tools: [{ type: "file_search" }]
  tool_resources: { file_search: { vector_stores: [{ file_ids: [...] }] } }
```

### 7.3 Extraction Prompt
```
Ekstrak dari PDF MoU ini dalam format JSON:
{
  "start_date": "tanggal pembukaan akad (format: '7 Desember 2025')",
  "end_date": "tanggal akhir kontrak (di Pasal 3)",
  "duration_days": angka hari (integer),
  "duration_months": angka bulan (integer),
  "amount_rupiah": nominal modal dalam rupiah (angka penuh, contoh: 100000000),
  "sign_date": "tanggal tanda tangan (format: '7 Desember 2025')"
}
Ekstrak dari bagian pembukaan, Pasal 3 (jangka waktu), dan bagian PIHAK KETIGA (modal).
Isi null jika tidak ditemukan. Kembalikan JSON saja tanpa penjelasan.
```

---

## 8. Performance & Scalability

### 8.1 Expected Response Times
- PDF Download: ~1-2 seconds
- OpenAI Upload: ~2-5 seconds
- OpenAI Processing: ~10-30 seconds (file_search + extraction)
- Total: **~15-40 seconds** per validation

### 8.2 Rate Limits
- OpenAI API: Tergantung tier subscription
- WhatsApp: ~20 messages per second (recommended: batch validations)

### 8.3 Cost Estimation (per validation)
- File upload: Gratis
- Assistant creation: Gratis
- File search tool: ~$0.10 per GB-day (minimal untuk 1 PDF)
- GPT-4o-mini tokens: ~$0.15-0.60 per 1M tokens
- **Estimated cost per validation**: $0.01 - $0.05

---

## 9. Testing & Quality Assurance

### 9.1 Test Cases

#### Happy Path
1. **Valid MoU with all fields matching**
   - Filename: `MoU A - B 100 jt, 6 Bulan (7 Des 2025 - 7 Jun 2026) I-Admin.pdf`
   - PDF content: All dates, duration, and amount match
   - Expected: ✅ Success

#### Error Scenarios
1. **Date mismatch**
   - Filename: `(7 Des 2025 - ...)`
   - PDF: `tgl 8 Des 2025`
   - Expected: ❌ with specific error

2. **Amount mismatch**
   - Filename: `100 jt`
   - PDF: `Rp. 50.000.000`
   - Expected: ❌ with specific error

3. **Missing duration in PDF**
   - PDF: No mention of days/months
   - Expected: ❌ with specific error

4. **Malformed filename**
   - No parentheses, no amount
   - Expected: ❌ with missing data errors

### 9.2 Manual Test Procedure
1. Start bot: `npm start`
2. Join test WhatsApp group with bot
3. Send test PDF with filename
4. Observe:
   - ⏳ reaction appears immediately
   - Processing completes in <1 minute
   - ✅ or ❌ reaction appears
   - Detailed message sent
5. Verify message content accuracy

---

## 10. Deployment & Operations

### 10.1 Installation
```bash
cd /Users/nicolaanandadwiervantoro/SE/bot-admin
npm install --legacy-peer-deps
```

### 10.2 Configuration
1. Create `.env` file:
```bash
OPENAI_KEY=sk-proj-...
```

2. Update `setting.js` (optional):
```javascript
global.owner = ["628..."]
global.botName = "MoU Validator Bot"
```

### 10.3 Running the Bot
```bash
# Development
npm start

# Production (with PM2)
pm2 start main.js --name bot-mou-validator
pm2 save
pm2 startup
```

### 10.4 Monitoring
- Check logs: `pm2 logs bot-mou-validator`
- Monitor errors: Console output includes detailed error traces
- OpenAI usage: Check dashboard.openai.com

### 10.5 Maintenance
- **Weekly**: Review error logs for pattern failures
- **Monthly**: Verify OpenAI API costs
- **As needed**: Update prompt if extraction accuracy drops

---

## 11. Security & Privacy

### 11.1 Data Handling
- PDFs uploaded to OpenAI are stored temporarily for processing
- No persistent storage of PDF content in bot server
- Extracted data only used for validation, not stored long-term

### 11.2 API Key Security
- Store `OPENAI_KEY` in environment variables only
- Never commit to version control
- Use least-privilege API keys if possible

### 11.3 Access Control
- Bot only responds in group chats (not DMs)
- Can add owner-only validation if needed

---

## 12. Future Enhancements

### 12.1 Potential Features
- [ ] Multi-language support (English MoUs)
- [ ] Custom validation rules per client
- [ ] PDF generation with corrections
- [ ] Integration with DocuSign for e-signatures
- [ ] Dashboard for validation history
- [ ] Email notifications to CEO
- [ ] Batch validation for multiple PDFs

### 12.2 Known Limitations
- Requires `OPENAI_KEY` (no offline mode)
- Processing time depends on OpenAI API availability
- Cannot validate scanned/image-only PDFs (needs OCR)
- Filename convention must be strictly followed

---

## 13. Support & Contact

### 13.1 Issue Reporting
Create issue dengan format:
```
**Error Message:** [paste exact error]
**PDF Filename:** [filename]
**Expected Behavior:** [what should happen]
**Actual Behavior:** [what happened]
**Screenshot:** [if applicable]
```

### 13.2 FAQ

**Q: Bot tidak merespon PDF saya?**
A: Pastikan:
- Filename mengandung "MoU" (case-insensitive)
- File adalah PDF, bukan gambar/dokumen lain
- `OPENAI_KEY` tersedia di environment

**Q: Selalu gagal dengan error "Ekstraksi OpenAI gagal"?**
A: Cek:
- OpenAI API quota masih tersedia
- API key valid dan aktif
- Internet connection stabil

**Q: Bisa tambah validasi custom?**
A: Ya, edit fungsi validasi di `index.js` section validation rules

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 7 Dec 2025 | Initial | First draft with pdf-parse |
| 2.0 | 11 Dec 2025 | Refactor | Complete rewrite with OpenAI integration |

---

**End of Document**

