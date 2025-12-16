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

  return `👌🏻 Validasi MoU LENGKAP: Detail file telah diverifikasi dan sesuai dengan isi dokumen.

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

// Server monitoring function
async function handleServerCommand(ronzz, m) {
  try {
    const startTime = Date.now()
    await ronzz.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // System info
    const platform = os.platform()
    const osRelease = os.release()
    const osType = os.type()
    const arch = os.arch()
    const hostname = os.hostname()

    // Uptime
    const systemUptime = os.uptime()
    const systemUptimeDays = Math.floor(systemUptime / 86400)
    const systemUptimeHours = Math.floor((systemUptime % 86400) / 3600)
    const systemUptimeMinutes = Math.floor((systemUptime % 3600) / 60)

    const processUptime = process.uptime()
    const botUptimeDays = Math.floor(processUptime / 86400)
    const botUptimeHours = Math.floor((processUptime % 86400) / 3600)
    const botUptimeMinutes = Math.floor((processUptime % 3600) / 60)

    // CPU info
    const cpus = os.cpus()
    const cpuModel = cpus[0]?.model || 'Unknown'
    const cpuCores = cpus.length

    // Memory info
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1)

    // Process memory
    const processMem = process.memoryUsage()
    const processMemMB = (processMem.rss / 1024 / 1024).toFixed(2)
    const heapUsedMB = (processMem.heapUsed / 1024 / 1024).toFixed(2)
    const heapTotalMB = (processMem.heapTotal / 1024 / 1024).toFixed(2)

    // Node.js version
    const nodeVersion = process.version

    // PM2 status (if available)
    let pm2Status = 'Not running with PM2'
    if (process.env.pm_id !== undefined) {
      pm2Status = `👌🏻 Running (ID: ${process.env.pm_id}, Instance: ${process.env.NODE_APP_INSTANCE || 0})`
    }

    // Check disk space (Linux/Mac only)
    let diskInfo = 'N/A'
    if (platform !== 'win32') {
      try {
        const { execSync } = require('child_process')
        const dfOutput = execSync('df -h / | tail -1').toString()
        const parts = dfOutput.split(/\s+/)
        diskInfo = `${parts[4]} used (${parts[2]} / ${parts[1]})`
      } catch (e) {
        diskInfo = 'Unable to fetch'
      }
    }

    // Format bytes
    const formatBytes = (bytes) => {
      const gb = (bytes / 1024 / 1024 / 1024).toFixed(2)
      return `${gb} GB`
    }

    // Calculate response time
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Check group whitelist status
    const allowedGroupNames = (process.env.GRUP_ALLOW || '').split(',').map(g => g.trim()).filter(Boolean)
    const groupWhitelistStatus = allowedGroupNames.length > 0
      ? `👌🏻 Enabled (${allowedGroupNames.length} group${allowedGroupNames.length > 1 ? 's' : ''})`
      : '⚠️ Disabled (All groups allowed)'

    // Get current group name
    let currentGroupStatus = '👌🏻 Whitelisted'
    if (allowedGroupNames.length > 0) {
      try {
        const groupMetadata = await ronzz.groupMetadata(m.chat)
        const groupName = (groupMetadata?.subject || '').toLowerCase()
        const isWhitelisted = allowedGroupNames.some(allowed => groupName.toLowerCase().includes(allowed.toLowerCase()))
        currentGroupStatus = isWhitelisted ? '👌🏻 Whitelisted' : '❌ Not whitelisted'
      } catch (e) {
        currentGroupStatus = '⚠️ Unable to check'
      }
    }

    const report = `🖥️ *SERVER & BOT STATUS REPORT*

━━━━━━━━━━━━━━━━━━━━━━
📊 *SYSTEM INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━
🔹 OS: ${osType} ${osRelease} (${platform})
🔹 Architecture: ${arch}
🔹 Hostname: ${hostname}
🔹 Uptime: ${systemUptimeDays}d ${systemUptimeHours}h ${systemUptimeMinutes}m

━━━━━━━━━━━━━━━━━━━━━━
💻 *CPU INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━
🔹 Model: ${cpuModel}
🔹 Cores: ${cpuCores}

━━━━━━━━━━━━━━━━━━━━━━
🧠 *MEMORY USAGE*
━━━━━━━━━━━━━━━━━━━━━━
🔹 Total: ${formatBytes(totalMem)}
🔹 Used: ${formatBytes(usedMem)} (${memUsagePercent}%)
🔹 Free: ${formatBytes(freeMem)}

━━━━━━━━━━━━━━━━━━━━━━
💾 *DISK USAGE*
━━━━━━━━━━━━━━━━━━━━━━
🔹 Root: ${diskInfo}

━━━━━━━━━━━━━━━━━━━━━━
🤖 *BOT INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━
🔹 Node.js: ${nodeVersion}
🔹 Bot Name: ${global.botName || 'MoU Validator Bot'}
🔹 Bot Uptime: ${botUptimeDays}d ${botUptimeHours}h ${botUptimeMinutes}m
🔹 PM2 Status: ${pm2Status}
🔹 Group Whitelist: ${groupWhitelistStatus}
🔹 Current Group: ${currentGroupStatus}

━━━━━━━━━━━━━━━━━━━━━━
📈 *BOT MEMORY USAGE*
━━━━━━━━━━━━━━━━━━━━━━
🔹 RSS: ${processMemMB} MB
🔹 Heap Used: ${heapUsedMB} MB / ${heapTotalMB} MB

━━━━━━━━━━━━━━━━━━━━━━
📶 *BOT PERFORMANCE*
━━━━━━━━━━━━━━━━━━━━━━
🔹 Response Time: ${responseTime}ms
🔹 Status: ${responseTime < 1000 ? '🟢 Excellent' : responseTime < 3000 ? '🟡 Good' : '🔴 Slow'}

━━━━━━━━━━━━━━━━━━━━━━
⏰ *Timestamp: ${moment().format('DD MMM YYYY HH:mm:ss')}*

_Monitoring by ${global.ownerName || 'Admin'}_`

    await ronzz.sendMessage(m.chat, { react: { text: '👌🏻', key: m.key } })
    await ronzz.sendMessage(m.chat, { text: report }, { quoted: m })
  } catch (err) {
    console.error('Server command error:', err)
    await ronzz.sendMessage(m.chat, { text: '❌ Gagal mendapatkan informasi server' }, { quoted: m })
  }
}

module.exports = async (ronzz, m, mek) => {
  try {
    if (m.fromMe) return
    const isGroup = m.isGroup
    if (!isGroup) return

    // Check if group is allowed (by group name)
    const allowedGroupNames = (process.env.GRUP_ALLOW || '').split(',').map(g => g.trim().toLowerCase()).filter(Boolean)

    if (allowedGroupNames.length > 0) {
      // Get group metadata to check name
      let groupMetadata
      try {
        groupMetadata = await ronzz.groupMetadata(m.chat)
      } catch (e) {
        console.log(`[GROUP CHECK] Failed to get group metadata: ${e.message}`)
        return
      }

      const groupName = (groupMetadata?.subject || '').toLowerCase()

      if (!allowedGroupNames.some(allowed => groupName.includes(allowed))) {
        console.log(`[GROUP CHECK] Bot ignored message from non-whitelisted group: "${groupMetadata?.subject}" (${m.chat})`)
        return
      }

      console.log(`[GROUP CHECK] Message from whitelisted group: "${groupMetadata?.subject}"`)
    }

    // Handle text commands
    const text = (m.text || '').toLowerCase().trim()

    // Server monitoring command
    if (text === 'server' || text === '.server' || text === '!server') {
      return await handleServerCommand(ronzz, m)
    }

    // Handle PDF documents for MoU validation
    const docMessage = mek.message?.documentMessage
    if (!docMessage || !(docMessage.mimetype || '').includes('pdf')) return

    const fileName = docMessage.fileName || 'document.pdf'
    const looksLikeMou = /mou/i.test(fileName)
    if (!looksLikeMou) return

    console.log(`\n[MoU VALIDATOR] 🔄 Memproses file: ${fileName}`)
    console.log(`[MoU VALIDATOR] ⏰ Waktu: ${moment().format('DD MMM YYYY HH:mm:ss')}`)

    try {
      await ronzz.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    } catch { }

    const issues = []
    const fileMeta = extractFromFilename(fileName)

    // Download PDF buffer
    let pdfBuffer = null
    try {
      console.log('[MoU VALIDATOR] 📥 Mengunduh PDF...')
      pdfBuffer = await downloadPdfBuffer(docMessage)
      console.log('[MoU VALIDATOR] ✅ Download selesai')
    } catch (err) {
      console.log(`[MoU VALIDATOR] ❌ Gagal mengunduh PDF: ${err.message}`)
      issues.push(`Gagal mengunduh PDF: ${err.message}`)
    }

    // Extract with OpenAI
    let llmData = null
    if (pdfBuffer && process.env.OPENAI_KEY) {
      try {
        console.log('[MoU VALIDATOR] 🔍 Mengekstrak data dari PDF dengan OpenAI...')
        llmData = await extractPdfWithOpenAI(pdfBuffer)
        console.log('[MoU VALIDATOR] ✅ Ekstraksi selesai')
        console.log('[MoU VALIDATOR] 📊 Data yang diekstrak:', JSON.stringify(llmData, null, 2))
      } catch (err) {
        console.log(`[MoU VALIDATOR] ❌ Ekstraksi OpenAI gagal: ${err.message}`)
        issues.push(`Ekstraksi OpenAI gagal: ${err.message}`)
      }
    } else if (!process.env.OPENAI_KEY) {
      console.log('[MoU VALIDATOR] ⚠️  OPENAI_KEY tidak tersedia')
      issues.push('OPENAI_KEY tidak tersedia; tidak bisa membaca PDF')
    }

    if (!llmData) {
      console.log('[MoU VALIDATOR] ❌ Gagal mengekstrak data dari PDF')
      issues.push('Gagal mengekstrak data dari PDF')
    }

    const startCandidate = llmData?.start_date || fileMeta.start
    const endCandidate = llmData?.end_date || fileMeta.end
    const signCandidate = llmData?.sign_date || startCandidate
    const amountCandidate = llmData?.amount_rupiah
    const durationDaysCandidate = llmData?.duration_days
    const durationMonthsCandidate = llmData?.duration_months

    console.log('[MoU VALIDATOR] 🔍 Memvalidasi data...')

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

    // Log validation result
    if (issues.length > 0) {
      console.log(`[MoU VALIDATOR] ❌ Validasi GAGAL - ${issues.length} masalah ditemukan:`)
      issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`)
      })
    } else {
      console.log('[MoU VALIDATOR] ✅ Validasi BERHASIL - Semua data sesuai')
    }

    // Send reaction to group
    if (issues.length > 0) {
      try { await ronzz.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch { }
    } else {
      try { await ronzz.sendMessage(m.chat, { react: { text: '👌🏻', key: m.key } }) } catch { }
    }

    // Build final report
    const finalReport = issues.length > 0
      ? buildReportFailure(fileName, issues)
      : buildReportSuccess(fileMeta, llmData)

    // Send detailed validation report to bot's own number (for records)
    const botNumber = ronzz.user.id
    const reportHeader = `📋 *VALIDATION REPORT*\n━━━━━━━━━━━━━━━━━━━━━━\n📁 File: ${fileName}\n👥 Group: ${m.chat}\n⏰ Time: ${moment().format('DD MMM YYYY HH:mm:ss')}\n━━━━━━━━━━━━━━━━━━━━━━\n\n`

    try {
      await ronzz.sendMessage(botNumber, { text: reportHeader + finalReport })
      console.log('[MoU VALIDATOR] 📤 Laporan dikirim ke bot number untuk record')
    } catch (err) {
      console.log(`[MoU VALIDATOR] ⚠️  Gagal mengirim laporan ke bot number: ${err.message}`)
    }

    console.log('[MoU VALIDATOR] ✅ Proses selesai\n')
  } catch (err) {
    console.error('[MoU VALIDATOR] ❌ Error:', err)
  }
}

