// Audit log: every interviewer action is recorded with an ISO timestamp.
// Entries live on session.audit[] and are persisted with the session.
//
// Entry shape: { ts, action, detail, sectionId? , questionId? }
export function makeEntry(action, detail = '', extra = {}) {
  return { ts: new Date().toISOString(), action, detail, ...extra }
}

// Append an audit entry to a session object (mutates + returns the session).
export function logAction(session, action, detail = '', extra = {}) {
  if (!session.audit) session.audit = []
  session.audit.push(makeEntry(action, detail, extra))
  return session
}

export const ACTIONS = {
  SESSION_CREATED: 'Session created',
  PROFILE_UPDATED: 'Profile updated',
  PHOTO_START: 'Start photo captured',
  PHOTO_END: 'End photo captured',
  BIOMETRIC: 'Biometric captured',
  ANSWER_SET: 'Answer recorded',
  NOTE_SET: 'Note recorded',
  CONSENT: 'Consent recorded',
  SECTION_OPENED: 'Section opened',
  SECTION_REVIEWED: 'Section review confirmed',
  EXPORT_PDF: 'PDF report exported',
  SUBMITTED: 'Assessment submitted',
  SCORECARD_UPDATED: 'Scorecard updated',
}

export function formatTs(ts, locale = 'en-IN') {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(ts))
  } catch {
    return ts
  }
}
