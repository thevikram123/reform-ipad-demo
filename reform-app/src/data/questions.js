// Questionnaire data accessor.
// Source of truth is questionnaire.json (auto-generated from "REFORM Tools.docx").
//
// Question `type` values:
//   "yesno"  -> dropdown: Select / Yes / No / Not sure   (+ free-text note box)  [DEFAULT]
//   "yns"    -> dropdown: Select / Yes / No / Sometimes   (Section D only; "Don't know" removed)
//   "choice" -> dropdown with question-specific `options`  (+ free-text note box)
//   "pair"   -> contradiction-detection paired statements (statementA / statementB)
//   "label"  -> non-answerable sub-heading shown inline (no input)
//
// Every answerable question also has a free-text box for the interviewer's note.
import raw from './questionnaire.json'

export const DEFAULT_OPTIONS = ['Yes', 'No', 'Not sure']
export const SECTION_D_OPTIONS = ['Yes', 'No', 'Sometimes']
export const SELECT_PLACEHOLDER = 'Select'

export const sections = raw.sections

// Sections C (consent) and I (scorecard) are rendered by dedicated screens.
export const CONSENT_SECTION_ID = 'C'
export const SCORECARD_SECTION_ID = 'I'

export function getSection(id) {
  return sections.find((s) => s.id === id)
}

export function optionsForQuestion(q) {
  if (q.type === 'choice' && q.options) return q.options
  if (q.type === 'yns') return SECTION_D_OPTIONS
  return DEFAULT_OPTIONS
}

// Flatten answerable questions of a section (excludes "label" items).
export function answerableQuestions(section) {
  const out = []
  for (const g of section.groups || []) {
    for (const q of g.questions) {
      if (q.type !== 'label') out.push(q)
    }
  }
  return out
}

// Build initial answers carried over from the intake profile, so questions that
// duplicate already-collected data are pre-filled instead of re-asked.
export function prefillAnswers(profile = {}) {
  const seed = {}
  for (const s of sections) {
    for (const g of s.groups || []) {
      for (const q of g.questions) {
        if (!q.prefill) continue
        let v = ''
        if (q.prefill === 'name') v = profile.name || ''
        else if (q.prefill === 'age') v = profile.age || ''
        else if (q.prefill === 'age_gender') {
          v = [profile.age, profile.gender].filter(Boolean).join(', ')
        }
        if (v) seed[q.id] = { choice: String(v) }
      }
    }
  }
  return seed
}

export function sectionStats(section, answers = {}) {
  const qs = answerableQuestions(section)
  let answered = 0
  for (const q of qs) {
    const a = answers[q.id]
    if (q.type === 'pair') {
      if (a && (a.choiceA || a.choiceB || a.note)) answered++
    } else if (a && (a.choice || a.note)) {
      answered++
    }
  }
  return { total: qs.length, answered }
}
