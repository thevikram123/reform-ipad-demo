// Local persistence for prisoner assessment sessions (localStorage-backed).
// A "session" is one prisoner's full assessment record.
const KEY = 'reform.sessions.v1'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}
function writeAll(map) {
  localStorage.setItem(KEY, JSON.stringify(map))
}

export function uid() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

export function listSessions() {
  return Object.values(readAll()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getSession(id) {
  return readAll()[id] || null
}

export function createSession(profile = {}) {
  const id = uid()
  const now = Date.now()
  const session = {
    id,
    createdAt: now,
    updatedAt: now,
    status: 'in_progress', // in_progress | submitted
    profile, // office-use fields: name, prisonerId, gender, age, location, district, state, pin, assessedBy, designation, date, time
    answers: {}, // questionId -> { choice, note } | { choiceA, choiceB, note }
    consents: {}, // C1 / C2 -> { agreed, name, signature, place, datetime }
    scorecard: {}, // section I free-form decision fields
    photos: {
      start: null,
      startAssessor: null,
      end: null,
      endAssessor: null,
      consentCopy: null,
    }, // dataURL strings; start/end are prisoner photos for backward compatibility
    biometric: { start: null, end: null }, // placeholder for future thumbprint integration
    reviewedSections: {}, // sectionId -> true once interviewer confirms review
    audit: [], // see audit.js
  }
  const all = readAll()
  all[id] = session
  writeAll(all)
  return session
}

export function saveSession(session) {
  session.updatedAt = Date.now()
  const all = readAll()
  all[session.id] = session
  writeAll(all)
  return session
}

export function deleteSession(id) {
  const all = readAll()
  delete all[id]
  writeAll(all)
}
