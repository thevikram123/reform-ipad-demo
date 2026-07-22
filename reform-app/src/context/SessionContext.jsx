import { createContext, useContext, useState, useCallback } from 'react'
import * as store from '../lib/storage'
import { logAction, ACTIONS } from '../lib/audit'
import { prefillAnswers } from '../data/questions'

const Ctx = createContext(null)
export const useSession = () => useContext(Ctx)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)

  // persist + refresh state
  const commit = useCallback((s) => {
    const saved = store.saveSession(s)
    setSession({ ...saved })
  }, [])

  const start = useCallback((profile) => {
    let s = store.createSession(profile)
    logAction(s, ACTIONS.SESSION_CREATED, profile.prisonerId ? `Prisoner ID ${profile.prisonerId}` : '')
    // Carry intake data into questions that would otherwise re-ask it.
    const seed = prefillAnswers(profile)
    if (Object.keys(seed).length) {
      s.answers = { ...s.answers, ...seed }
      logAction(s, ACTIONS.PROFILE_UPDATED, `Intake data carried into ${Object.keys(seed).length} question(s)`)
    }
    commit(s)
    return s
  }, [commit])

  const load = useCallback((id) => {
    const s = store.getSession(id)
    if (s) setSession({ ...s })
    return s
  }, [])

  const close = useCallback(() => setSession(null), [])

  const updateProfile = useCallback((patch) => {
    setSession((prev) => {
      const s = { ...prev, profile: { ...prev.profile, ...patch } }
      logAction(s, ACTIONS.PROFILE_UPDATED, Object.keys(patch).join(', '))
      return store.saveSession(s)
    })
  }, [])

  // Record an answer. value = { choice?, note? } merged into existing.
  const setAnswer = useCallback((question, value, sectionId) => {
    setSession((prev) => {
      const answers = { ...prev.answers }
      const existing = answers[question.id] || {}
      answers[question.id] = { ...existing, ...value }
      const s = { ...prev, answers }
      const isNote = 'note' in value && !('choice' in value || 'choiceA' in value || 'choiceB' in value)
      logAction(s, isNote ? ACTIONS.NOTE_SET : ACTIONS.ANSWER_SET,
        truncate(question.text), { sectionId, questionId: question.id })
      return store.saveSession(s)
    })
  }, [])

  const setConsent = useCallback((key, data) => {
    setSession((prev) => {
      const consents = { ...prev.consents, [key]: data }
      const s = { ...prev, consents }
      logAction(s, ACTIONS.CONSENT, `${key}: ${data.agreed ? 'Agreed' : 'Declined'}`)
      return store.saveSession(s)
    })
  }, [])

  const setPhoto = useCallback((which, dataUrl) => {
    setSession((prev) => {
      const photos = { ...prev.photos, [which]: dataUrl }
      const s = { ...prev, photos }
      const action = which === 'start'
        ? ACTIONS.PHOTO_START
        : which === 'end'
        ? ACTIONS.PHOTO_END
        : ACTIONS.CONSENT_COPY
      logAction(s, action)
      return store.saveSession(s)
    })
  }, [])

  const setBiometric = useCallback((which, data) => {
    setSession((prev) => {
      const biometric = { ...prev.biometric, [which]: data }
      const s = { ...prev, biometric }
      logAction(s, ACTIONS.BIOMETRIC, which)
      return store.saveSession(s)
    })
  }, [])

  const markReviewed = useCallback((sectionId) => {
    setSession((prev) => {
      const reviewedSections = { ...prev.reviewedSections, [sectionId]: true }
      const s = { ...prev, reviewedSections }
      logAction(s, ACTIONS.SECTION_REVIEWED, sectionId, { sectionId })
      return store.saveSession(s)
    })
  }, [])

  const logOpen = useCallback((sectionId) => {
    setSession((prev) => {
      if (!prev) return prev
      const s = { ...prev }
      logAction(s, ACTIONS.SECTION_OPENED, sectionId, { sectionId })
      return store.saveSession(s)
    })
  }, [])

  const updateScorecard = useCallback((patch) => {
    setSession((prev) => {
      const s = { ...prev, scorecard: { ...prev.scorecard, ...patch } }
      logAction(s, ACTIONS.SCORECARD_UPDATED, Object.keys(patch).join(', '))
      return store.saveSession(s)
    })
  }, [])

  const logExport = useCallback(() => {
    setSession((prev) => {
      const s = { ...prev }
      logAction(s, ACTIONS.EXPORT_PDF)
      return store.saveSession(s)
    })
  }, [])

  const submit = useCallback(() => {
    setSession((prev) => {
      const s = { ...prev, status: 'submitted', submittedAt: Date.now() }
      logAction(s, ACTIONS.SUBMITTED)
      return store.saveSession(s)
    })
  }, [])

  const value = {
    session, start, load, close, commit,
    updateProfile, setAnswer, setConsent, setPhoto, setBiometric,
    markReviewed, logOpen, updateScorecard, logExport, submit,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function truncate(t, n = 60) {
  return t && t.length > n ? t.slice(0, n) + '…' : t
}
