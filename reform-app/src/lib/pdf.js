// Professional PDF transcript export for REFORM assessment sessions.
// Uses jspdf + jspdf-autotable (already installed).

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from '../assets/reform-logo.png'
import { sections, answerableQuestions, optionsForQuestion, CONSENT_SECTION_ID, SCORECARD_SECTION_ID } from '../data/questions.js'
import { formatTs } from './audit.js'

// ─── Brand colours (RGB) ────────────────────────────────────────────────────
const GREEN  = [12,  53,  18]   // #0C3512 deep green
const BLUE   = [15,  71,  97]   // #0F4761 section blue
const ORANGE = [242, 159,  5]   // #f29f05 orange accent
const WHITE  = [255, 255, 255]
const LIGHT_GREY = [245, 246, 247]
const MID_GREY   = [180, 185, 190]
const DARK_GREY  = [80,  85,  90]
const BLACK  = [30,  30,  30]

// ─── Page geometry ───────────────────────────────────────────────────────────
const PAGE_W = 210   // A4 mm
const PAGE_H = 297
const MARGIN_L = 14
const MARGIN_R = 14
const MARGIN_T = 14
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

// ─── Helper utilities ────────────────────────────────────────────────────────
function safe(v) {
  return v == null || v === '' ? '—' : String(v)
}

function safeDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString() } catch { return String(v) }
}

function todayStamp() {
  return new Date().toLocaleString()
}

function fileName(session) {
  const p   = session?.profile || {}
  const id  = (p.prisonerId || p.name || session?.id || 'unknown').replace(/\s+/g, '_')
  const d   = (p.date || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '')
  return `REFORM_Report_${id}_${d}.pdf`
}

// ─── Low-level drawing helpers ────────────────────────────────────────────────
function setFont(doc, size, style = 'normal', rgb = BLACK) {
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(...rgb)
}

function hRule(doc, y, rgb = GREEN, thick = 0.5) {
  doc.setDrawColor(...rgb)
  doc.setLineWidth(thick)
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
}

// Returns true if adding `needed` mm would overflow the page.
function wouldOverflow(doc, y, needed = 10) {
  return y + needed > PAGE_H - 18
}

function ensureSpace(doc, y, needed = 10) {
  if (wouldOverflow(doc, y, needed)) {
    doc.addPage()
    return MARGIN_T + 4
  }
  return y
}

// ─── Page footer (called after every autoTable and on manual draws) ───────────
function addFooters(doc) {
  const total = doc.getNumberOfPages()
  const stamp = todayStamp()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const y = PAGE_H - 8
    setFont(doc, 7, 'normal', DARK_GREY)
    doc.text('REFORM — Confidential · Authorized Use Only', MARGIN_L, y)
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN_R, y, { align: 'right' })
    doc.text(`Generated: ${stamp}`, PAGE_W / 2, y, { align: 'center' })
  }
}

// ─── Section banner ───────────────────────────────────────────────────────────
function sectionBanner(doc, y, text) {
  y = ensureSpace(doc, y, 14)
  doc.setFillColor(...BLUE)
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 10, 1.5, 1.5, 'F')
  setFont(doc, 11, 'bold', WHITE)
  doc.text(text, MARGIN_L + 4, y + 7)
  return y + 14
}

// ─── Group heading ────────────────────────────────────────────────────────────
function groupHeading(doc, y, text) {
  y = ensureSpace(doc, y, 10)
  setFont(doc, 9, 'bold', GREEN)
  doc.text(text.toUpperCase(), MARGIN_L, y)
  doc.setDrawColor(...MID_GREY)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_L, y + 1.5, PAGE_W - MARGIN_R, y + 1.5)
  return y + 6
}

// ─── autoTable wrapper ────────────────────────────────────────────────────────
function runTable(doc, y, head, body, colWidths) {
  let finalY = y

  const styles = {
    fontSize: 8.5,
    cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
    lineColor: [220, 222, 224],
    lineWidth: 0.2,
    overflow: 'linebreak',
    minCellHeight: 7,
  }

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_L, right: MARGIN_R },
    tableWidth: CONTENT_W,
    columnStyles: colWidths,
    head: head,
    body: body,
    theme: 'grid',
    styles,
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    bodyStyles: { textColor: BLACK },
    showHead: 'everyPage',
    didDrawPage: () => { /* footer added in one pass at the end */ },
  })

  finalY = doc.lastAutoTable.finalY + 6
  return finalY
}

// ─── 1. Branded header ────────────────────────────────────────────────────────
function drawHeader(doc, session) {
  let y = MARGIN_T

  // Logo (top-left, 30 × ~12 mm)
  try {
    doc.addImage(logo, 'PNG', MARGIN_L, y, 32, 13)
  } catch (_) {
    // logo missing — skip gracefully
  }

  // Title block (right of logo)
  setFont(doc, 15, 'bold', GREEN)
  doc.text('Offender Assessment Report', MARGIN_L + 36, y + 6)
  setFont(doc, 10, 'bold', BLUE)
  doc.text('REFORM — Rehabilitation & Evaluation Framework for Offender Risk Management', MARGIN_L + 36, y + 12)

  y += 17
  hRule(doc, y, GREEN, 0.8)
  y += 5

  // Subtitle / status
  const status = session?.status === 'submitted' ? 'SUBMITTED' : 'IN PROGRESS'
  setFont(doc, 8.5, 'italic', DARK_GREY)
  doc.text(`Assessment Status: ${status}  ·  Report ID: ${safe(session?.id)}`, MARGIN_L, y)
  y += 6

  return y
}

// ─── 2. "For Office Use" profile block ───────────────────────────────────────
function drawProfile(doc, y, session) {
  const p = session?.profile || {}

  y = sectionBanner(doc, y, 'A — For Office Use')

  const rows = [
    ['Name',        safe(p.name),        'Prisoner ID',  safe(p.prisonerId)],
    ['Gender',      safe(p.gender),      'Age',          safe(p.age)],
    ['Location',    safe(p.location),    'District',     safe(p.district)],
    ['State',       safe(p.state),       'PIN',          safe(p.pin)],
    ['Assessed By', safe(p.assessedBy),  'Designation',  safe(p.designation)],
    ['Date',        safe(p.date),        'Time',         safe(p.time)],
  ]

  const body = rows.map(([l1, v1, l2, v2]) => [
    { content: l1, styles: { fontStyle: 'bold', textColor: DARK_GREY, fillColor: LIGHT_GREY } },
    { content: v1 },
    { content: l2, styles: { fontStyle: 'bold', textColor: DARK_GREY, fillColor: LIGHT_GREY } },
    { content: v2 },
  ])

  y = runTable(doc, y, [], body, {
    0: { cellWidth: 35 },
    1: { cellWidth: 57 },
    2: { cellWidth: 35 },
    3: { cellWidth: 55 },
  })

  return y
}

// ─── 3. Identity verification photos ────────────────────────────────────────
function drawPhotos(doc, y, session) {
  const photos    = session?.photos   || {}

  const hasStart = !!(photos.start)
  const hasEnd   = !!(photos.end)

  if (!hasStart && !hasEnd) return y

  y = sectionBanner(doc, y, 'B — Identity Verification')

  const photoW  = 50
  const photoH  = 60
  const gap     = 10
  const labelH  = 6

  if (hasStart || hasEnd) {
    y = ensureSpace(doc, y, photoH + labelH + 10)

    // Start photo
    if (hasStart) {
      try {
        doc.addImage(photos.start, 'JPEG', MARGIN_L, y, photoW, photoH)
        setFont(doc, 8, 'bold', DARK_GREY)
        doc.text('Start Photo', MARGIN_L + photoW / 2, y + photoH + labelH, { align: 'center' })
      } catch (_) { /* skip broken image */ }
    }

    // End photo
    if (hasEnd) {
      const xEnd = MARGIN_L + photoW + gap
      try {
        doc.addImage(photos.end, 'JPEG', xEnd, y, photoW, photoH)
        setFont(doc, 8, 'bold', DARK_GREY)
        doc.text('End Photo', xEnd + photoW / 2, y + photoH + labelH, { align: 'center' })
      } catch (_) { /* skip broken image */ }
    }

    y += photoH + labelH + 6
  }

  return y
}

// ─── 4. Consent summary ──────────────────────────────────────────────────────
const CONSENT_LABELS = {
  C1: 'C1 — Consent to Participate in Assessment',
  C2: 'C2 — Consent for Mental Health Evaluation',
}

function drawConsents(doc, y, session) {
  const consents = session?.consents || {}

  y = sectionBanner(doc, y, 'C — Informed Consent')

  const body = []

  for (const key of ['C1', 'C2']) {
    const c = consents[key]
    if (!c) {
      body.push([
        { content: CONSENT_LABELS[key], colSpan: 2, styles: { fontStyle: 'bold', textColor: DARK_GREY } },
      ])
      body.push([
        { content: 'Status', styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
        { content: 'Not recorded' },
      ])
      continue
    }

    const status = c.agreed ? 'AGREED' : 'DECLINED'
    const statusColor = c.agreed ? [34, 120, 50] : [190, 30, 30]

    body.push([
      { content: CONSENT_LABELS[key], colSpan: 2, styles: { fontStyle: 'bold', textColor: BLUE, fillColor: [235, 242, 248] } },
    ])
    body.push([
      { content: 'Status', styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
      { content: status, styles: { textColor: statusColor, fontStyle: 'bold' } },
    ])
    body.push([
      { content: 'Participant Name', styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
      { content: safe(c.name) },
    ])
    body.push([
      { content: 'Signature', styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
      { content: safe(c.signature) },
    ])
    body.push([
      { content: 'Place', styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
      { content: safe(c.place) },
    ])
    body.push([
      { content: 'Date & Time', styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
      { content: safe(c.datetime) },
    ])
    // spacer row
    body.push([{ content: '', colSpan: 2, styles: { minCellHeight: 2, fillColor: WHITE } }])
  }

  y = runTable(doc, y, [], body, {
    0: { cellWidth: 52 },
    1: { cellWidth: CONTENT_W - 52 },
  })

  return y
}

// ─── 5. Questionnaire transcript ─────────────────────────────────────────────
function formatResponse(q, ans) {
  if (!ans) return '—'

  if (q.type === 'pair') {
    const a = ans.choiceA ? `A: ${ans.choiceA}` : 'A: —'
    const b = ans.choiceB ? `B: ${ans.choiceB}` : 'B: —'
    const parts = [a, b]
    if (ans.note) parts.push(`Note: ${ans.note}`)
    return parts.join('\n')
  }

  const parts = []
  if (ans.choice) parts.push(ans.choice)
  if (ans.note)   parts.push(`Note: ${ans.note}`)
  return parts.length ? parts.join('\n') : '—'
}

function drawQuestionnaire(doc, y, session) {
  const answers = session?.answers || {}

  for (const section of sections) {
    if (!section || !section.id) continue

    // C is handled above; I is handled as scorecard below
    if (section.id === CONSENT_SECTION_ID)   continue
    if (section.id === SCORECARD_SECTION_ID) continue

    const sectionLabel = `${section.letter || section.id} — ${section.title}`
    y = sectionBanner(doc, y, sectionLabel)

    for (const group of (section.groups || [])) {
      // Collect all answerable questions in this group
      const answerable = (group.questions || []).filter(q => q.type !== 'label')
      const labelItems = (group.questions || []).filter(q => q.type === 'label')

      if (group.title) {
        y = groupHeading(doc, y, group.title)
      }

      // Render any label items as text
      for (const lq of labelItems) {
        y = ensureSpace(doc, y, 8)
        setFont(doc, 8.5, 'italic', DARK_GREY)
        const lines = doc.splitTextToSize(lq.text || '', CONTENT_W)
        doc.text(lines, MARGIN_L + 2, y)
        y += lines.length * 5 + 2
      }

      if (answerable.length === 0) continue

      const body = answerable.map((q, idx) => {
        const ans = answers[q.id]
        const response = formatResponse(q, ans)

        const questionText = q.type === 'pair'
          ? `${q.text || ''}\n  A: ${q.statementA || ''}\n  B: ${q.statementB || ''}`
          : (q.text || '')

        return [
          { content: `${idx + 1}. ${questionText}`, styles: { fontSize: 8.5 } },
          { content: response, styles: { fontSize: 8.5, textColor: ans ? BLACK : MID_GREY } },
        ]
      })

      y = runTable(
        doc,
        y,
        [[ { content: 'Question', styles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' } },
           { content: 'Response', styles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' } } ]],
        body,
        { 0: { cellWidth: CONTENT_W * 0.62 }, 1: { cellWidth: CONTENT_W * 0.38 } }
      )
    }
  }

  return y
}

// ─── 6. Scorecard (Section I) ─────────────────────────────────────────────────
function drawScorecard(doc, y, session) {
  const sc = session?.scorecard || {}
  const keys = Object.keys(sc)

  y = sectionBanner(doc, y, 'I — Scorecard & Decision')

  if (keys.length === 0) {
    y = ensureSpace(doc, y, 10)
    setFont(doc, 8.5, 'italic', DARK_GREY)
    doc.text('Scorecard not yet completed.', MARGIN_L, y)
    return y + 8
  }

  const body = keys.map(k => [
    { content: k, styles: { fontStyle: 'bold', fillColor: LIGHT_GREY } },
    { content: safe(sc[k]) },
  ])

  y = runTable(doc, y, [], body, {
    0: { cellWidth: 80 },
    1: { cellWidth: CONTENT_W - 80 },
  })

  return y
}

// ─── 7. Audit trail ──────────────────────────────────────────────────────────
function drawAudit(doc, y, session) {
  const audit = session?.audit || []

  y = sectionBanner(doc, y, 'Audit Trail')

  if (audit.length === 0) {
    y = ensureSpace(doc, y, 10)
    setFont(doc, 8.5, 'italic', DARK_GREY)
    doc.text('No audit entries recorded.', MARGIN_L, y)
    return y + 8
  }

  const head = [[
    { content: 'Timestamp',  styles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' } },
    { content: 'Action',     styles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' } },
    { content: 'Detail',     styles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' } },
  ]]

  const body = audit.map(entry => [
    { content: formatTs(entry.ts), styles: { fontSize: 7.5, textColor: DARK_GREY } },
    { content: safe(entry.action), styles: { fontSize: 7.5 } },
    { content: safe(entry.detail), styles: { fontSize: 7.5 } },
  ])

  y = runTable(doc, y, head, body, {
    0: { cellWidth: 44 },
    1: { cellWidth: 55 },
    2: { cellWidth: CONTENT_W - 99 },
  })

  return y
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function exportPdf(session) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Page 1 header
  let y = drawHeader(doc, session)

  // 2. Profile
  y = drawProfile(doc, y, session)

  // 3. Photos / biometric
  y = drawPhotos(doc, y, session)

  // 4. Consents
  y = drawConsents(doc, y, session)

  // 5. Questionnaire (sections A, B, D, E, F, G, H)
  y = drawQuestionnaire(doc, y, session)

  // 6. Scorecard (section I)
  y = drawScorecard(doc, y, session)

  // 7. Audit trail
  y = drawAudit(doc, y, session)

  // Add footers to ALL pages in one pass
  addFooters(doc)

  // Trigger download
  doc.save(fileName(session))
}
