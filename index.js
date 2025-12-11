require('./setting.js')
const { downloadContentFromMessage } = require('@dappaoffc/baileys')
const fs = require('fs')
const os = require('os')
const path = require('path')
const moment = require('moment-timezone')
const fetch = require('node-fetch')
const FormData = require('form-data')

moment.tz.setDefault('Asia/Jakarta').locale('id')

const indoMonths = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
function parseIndoDate(value) {
  if (!value) return null
  const cleaned = String(value).replace(/\s+/g, ' ').trim()
  const mDate = moment(cleaned, 'D MMMM YYYY', 'id', true)
  if (mDate.isValid()) return mDate
  const match = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (!match) return null
  const monthIdx = indoMonths.indexOf(match[2].toLowerCase())
  if (monthIdx === -1) return null
  const rebuild = `${match[1]} ${indoMonths[monthIdx]} ${match[3]}`
  const fallback = moment(rebuild, 'D MMMM YYYY', 'id', true)
  return fallback.isValid() ? fallback : null
}

function sanitizeFilenamePart(name) {
  return String(name || '').replace(/\.pdf$/i, '').trim()
}

function extractFromFilename(fileName = '') {
  const clean = sanitizeFilenamePart(fileName)
  const rangeMatch = clean.match(/\(([^)]+)\)/)
  let start = null
  let end = null
  if (rangeMatch) {
    const parts = rangeMatch[1].split('-').map((p) => p.trim()).filter(Boolean)
    start = parts[0] || null
    end = parts[1] || null
  }
  const durationMatch = clean.match(/(\d+)\s*bulan/i)
  const amountMatch = clean.match(/(\d[\d.]*)\s*jt/i)
  const amountMillion = amountMatch ? parseInt(amountMatch[1].replace(/[^\d]/g, ''), 10) : null
  return {
    start,
    end,
    durationLabel: durationMatch ? durationMatch[1] : null,
    amountRupiah: amountMillion ? amountMillion * 1000000 : null
  }
}

async function downloadPdfBuffer(documentMessage) {
  const stream = await downloadContentFromMessage(documentMessage, 'document')
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

async function extractPdfWithOpenAI(pdfBuffer) {
  const key = process.env.OPENAI_KEY
  if (!key) return null
  
  try {
    // Step 1: Upload PDF to OpenAI files
    const form = new FormData()
    form.append('file', pdfBuffer, { filename: 'mou.pdf', contentType: 'application/pdf' })
    form.append('purpose', 'assistants')
    
    const uploadRes = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form
    })
    
    if (!uploadRes.ok) return null
    const uploadData = await uploadRes.json()
    const fileId = uploadData.id
    
    // Step 2: Create assistant with file_search
    const assistantRes = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ type: 'file_search' }],
        tool_resources: { file_search: { vector_stores: [{ file_ids: [fileId] }] } }
      })
    })
    
    if (!assistantRes.ok) return null
    const assistant = await assistantRes.json()
    
    // Step 3: Create thread and run
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    
    if (!threadRes.ok) return null
    const thread = await threadRes.json()
    
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: `Ekstrak dari PDF MoU ini dalam format JSON:
{
  "start_date": "tanggal pembukaan akad (format: '7 Desember 2025')",
  "end_date": "tanggal akhir kontrak (di Pasal 3)",
  "duration_days": angka hari (integer),
  "duration_months": angka bulan (integer),
  "amount_rupiah": nominal modal dalam rupiah (angka penuh, contoh: 100000000),
  "sign_date": "tanggal tanda tangan (format: '7 Desember 2025')"
}
Ekstrak dari bagian pembukaan, Pasal 3 (jangka waktu), dan bagian PIHAK KETIGA (modal).
Isi null jika tidak ditemukan. Kembalikan JSON saja tanpa penjelasan.`
      })
    })
    
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ assistant_id: assistant.id })
    })
    
    if (!runRes.ok) return null
    const run = await runRes.json()
    
    // Step 4: Poll run status
    let runStatus = run.status
    let attempts = 0
    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${key}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })
      const statusData = await statusRes.json()
      runStatus = statusData.status
      attempts++
    }
    
    if (runStatus !== 'completed') return null
    
    // Step 5: Get messages
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    
    const messages = await messagesRes.json()
    const lastMessage = messages.data.find(m => m.role === 'assistant')
    if (!lastMessage) return null
    
    const content = lastMessage.content[0]?.text?.value || ''
    const jsonText = content.trim().replace(/```json|```/g, '')
    return JSON.parse(jsonText)
  } catch (err) {
    console.error('OpenAI extraction error:', err)
    return null
  }
}

function buildReportSuccess(fnMeta, llmData) {
  const startDate = llmData?.start_date || fnMeta.start || '-'
  const endDate = llmData?.end_date || fnMeta.end || '-'
  const durationDays = llmData?.duration_days || '-'
  const durationMonths = llmData?.duration_months || '-'
  const amount = llmData?.amount_rupiah || fnMeta.amountRupiah || '-'
  const amountFormatted = amount !== '-' ? `Rp${Number(amount).toLocaleString('id-ID')}` : '-'
  
  return `✅ Validasi MoU LENGKAP: Detail file telah diverifikasi dan sesuai dengan isi dokumen.

📅 Tanggal Awal: ${startDate}
📅 Tanggal Akhir: ${endDate}
⏱️ Durasi: ${durationDays} hari / ${durationMonths} bulan
💰 Nominal: ${amountFormatted}

Mohon CEO tinjau dan approve.`
}

function buildReportFailure(fileName, issues) {
  const list = issues.map((i) => `- ${i}`).join('\n')
  return `❌ Validasi MoU GAGAL. Admin 1/2, mohon cek kembali file PDF *${fileName}*. Rincian:
${list}
Mohon perbaiki file atau nama file sebelum diunggah kembali.`
}

module.exports = async (ronzz, m, mek) => {
  try {
    if (m.fromMe) return
    const isGroup = m.isGroup
    if (!isGroup) return

    const docMessage = mek.message?.documentMessage
    if (!docMessage || !(docMessage.mimetype || '').includes('pdf')) return

    const fileName = docMessage.fileName || 'document.pdf'
    const looksLikeMou = /mou/i.test(fileName)
    if (!looksLikeMou) return

    try {
      await ronzz.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    } catch {}

    const issues = []
    const fileMeta = extractFromFilename(fileName)
    
    // Download PDF buffer
    let pdfBuffer = null
    try {
      pdfBuffer = await downloadPdfBuffer(docMessage)
    } catch (err) {
      issues.push(`Gagal mengunduh PDF: ${err.message}`)
    }
    
    // Extract with OpenAI
    let llmData = null
    if (pdfBuffer && process.env.OPENAI_KEY) {
      try {
        llmData = await extractPdfWithOpenAI(pdfBuffer)
      } catch (err) {
        issues.push(`Ekstraksi OpenAI gagal: ${err.message}`)
      }
    } else if (!process.env.OPENAI_KEY) {
      issues.push('OPENAI_KEY tidak tersedia; tidak bisa membaca PDF')
    }
    
    if (!llmData) {
      issues.push('Gagal mengekstrak data dari PDF')
    }

    const startCandidate = llmData?.start_date || fileMeta.start
    const endCandidate = llmData?.end_date || fileMeta.end
    const signCandidate = llmData?.sign_date || startCandidate
    const amountCandidate = llmData?.amount_rupiah
    const durationDaysCandidate = llmData?.duration_days
    const durationMonthsCandidate = llmData?.duration_months

    const startPdfMoment = parseIndoDate(startCandidate)
    const startFileMoment = parseIndoDate(fileMeta.start)
    if (!startCandidate) issues.push('Tanggal awal akad di PDF tidak ditemukan')
    if (!fileMeta.start) issues.push('Tanggal awal tidak ada di nama file')
    if (startPdfMoment && startFileMoment && !startPdfMoment.isSame(startFileMoment, 'day')) {
      issues.push('Tanggal awal di PDF tidak sama dengan tanggal di nama file')
    }

    const endPdfMoment = parseIndoDate(endCandidate)
    const endFileMoment = parseIndoDate(fileMeta.end)
    if (!endCandidate) issues.push('Tanggal akhir di PDF tidak ditemukan')
    if (!fileMeta.end) issues.push('Tanggal akhir tidak ada di nama file')
    if (endPdfMoment && endFileMoment && !endPdfMoment.isSame(endFileMoment, 'day')) {
      issues.push('Tanggal akhir di PDF tidak sama dengan tanggal di nama file')
    }

    // Validasi durasi: cek apakah PDF punya info durasi
    if (!durationDaysCandidate && !durationMonthsCandidate) {
      issues.push('Durasi (hari/bulan) tidak ditemukan di PDF')
    }
    
    // Jika filename punya durasi, cek apakah cocok dengan PDF
    if (fileMeta.durationLabel && durationMonthsCandidate) {
      const expectedMonths = parseInt(fileMeta.durationLabel, 10)
      if (durationMonthsCandidate !== expectedMonths) {
        issues.push(`Durasi di PDF (${durationMonthsCandidate} bulan) tidak cocok dengan nama file (${expectedMonths} bulan)`)
      }
    }

    const signMoment = parseIndoDate(signCandidate)
    if (signMoment && startPdfMoment && !signMoment.isSame(startPdfMoment, 'day')) {
      issues.push('Tanggal tanda tangan berbeda dengan tanggal awal akad')
    }

    // Validasi nominal: cek apakah ada di PDF
    if (!amountCandidate) {
      issues.push('Nominal modal tidak ditemukan di PDF')
    }
    
    // Jika filename punya nominal, cek apakah cocok dengan PDF
    if (fileMeta.amountRupiah && amountCandidate && fileMeta.amountRupiah !== amountCandidate) {
      issues.push(`Nominal di PDF (Rp${Number(amountCandidate).toLocaleString('id-ID')}) tidak cocok dengan nama file (Rp${Number(fileMeta.amountRupiah).toLocaleString('id-ID')})`)
    } else if (!fileMeta.amountRupiah) {
      issues.push('Nominal tidak tertulis di nama file')
    }

    if (issues.length > 0) {
      try { await ronzz.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
      await ronzz.sendMessage(m.chat, { text: buildReportFailure(fileName, issues) }, { quoted: m })
    } else {
      try { await ronzz.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}
      await ronzz.sendMessage(m.chat, { text: buildReportSuccess(fileMeta, llmData) }, { quoted: m })
    }
  } catch (err) {
    console.error('MoU validator error:', err)
  }
}
