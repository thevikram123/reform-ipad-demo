import { createContext, useContext, useState, useCallback } from 'react'
import * as store from '../lib/storage'
import { logAction, ACTIONS } from '../lib/audit'
import { prefillAnswers } from '../data/questions'
import { saveCloudSession, submitCloudSession, submitHomeCloudSession, submitNodalCloudSession } from '../lib/supabase'

const Ctx = createContext(null)
export const useSession = () => useContext(Ctx)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)
  const [syncError, setSyncError] = useState('')

  const persist = useCallback((s) => {
    const saved = store.saveSession(s)
    saveCloudSession(saved).catch((error) => setSyncError(error.message || 'Cloud sync failed'))
    return saved
  }, [])

  // persist + refresh state
  const commit = useCallback((s) => {
    const saved = persist(s)
    setSession({ ...saved })
  }, [persist])

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

  const load = useCallback((source) => {
    const s = typeof source === 'object' ? source : store.getSession(source)
    if (s) setSession({ ...s })
    return s
  }, [])

  const close = useCallback(() => setSession(null), [])

  const updateProfile = useCallback((patch) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const s = { ...prev, profile: { ...prev.profile, ...patch } }
      logAction(s, ACTIONS.PROFILE_UPDATED, Object.keys(patch).join(', '))
      return persist(s)
    })
  }, [persist])

  // Record an answer. value = { choice?, note? } merged into existing.
  const setAnswer = useCallback((question, value, sectionId) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const answers = { ...prev.answers }
      const existing = answers[question.id] || {}
      answers[question.id] = { ...existing, ...value }
      const s = { ...prev, answers }
      const isNote = 'note' in value && !('choice' in value || 'choiceA' in value || 'choiceB' in value)
      logAction(s, isNote ? ACTIONS.NOTE_SET : ACTIONS.ANSWER_SET,
        truncate(question.text), { sectionId, questionId: question.id })
      return persist(s)
    })
  }, [persist])

  const setConsent = useCallback((key, data) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const consents = { ...prev.consents, [key]: data }
      const s = { ...prev, consents }
      logAction(s, ACTIONS.CONSENT, `${key}: ${data.agreed ? 'Agreed' : 'Declined'}`)
      return persist(s)
    })
  }, [persist])

  const setPhoto = useCallback((which, dataUrl) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const photos = { ...prev.photos, [which]: dataUrl }
      const s = { ...prev, photos }
      const action = which === 'start' || which === 'startAssessor'
        ? ACTIONS.PHOTO_START
        : which === 'end' || which === 'endAssessor'
        ? ACTIONS.PHOTO_END
        : ACTIONS.CONSENT_COPY
      const detail = which.includes('Assessor')
        ? 'Assessor'
        : which === 'consentCopyC1' || which === 'consentCopy'
        ? 'C1'
        : which === 'consentCopyC2'
        ? 'C2'
        : 'Prisoner'
      logAction(s, action, detail)
      return persist(s)
    })
  }, [persist])

  const setBiometric = useCallback((which, data) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const biometric = { ...prev.biometric, [which]: data }
      const s = { ...prev, biometric }
      logAction(s, ACTIONS.BIOMETRIC, which)
      return persist(s)
    })
  }, [persist])

  const markReviewed = useCallback((sectionId) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const reviewedSections = { ...prev.reviewedSections, [sectionId]: true }
      const s = { ...prev, reviewedSections }
      logAction(s, ACTIONS.SECTION_REVIEWED, sectionId, { sectionId })
      return persist(s)
    })
  }, [persist])

  const logOpen = useCallback((sectionId) => {
    setSession((prev) => {
      if (!prev) return prev
      if (prev.status !== 'open') return prev
      const s = { ...prev }
      logAction(s, ACTIONS.SECTION_OPENED, sectionId, { sectionId })
      return persist(s)
    })
  }, [persist])

  const updateScorecard = useCallback((patch) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const s = { ...prev, scorecard: { ...prev.scorecard, ...patch } }
      logAction(s, ACTIONS.SCORECARD_UPDATED, Object.keys(patch).join(', '))
      return persist(s)
    })
  }, [persist])

  const updateAssessorDeclaration = useCallback((patch) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'open') return prev
      const s = { ...prev, assessorDeclaration: { ...prev.assessorDeclaration, ...patch } }
      logAction(s, 'Assessor declaration updated', Object.keys(patch).join(', '))
      return persist(s)
    })
  }, [persist])

  const logExport = useCallback(() => {
    setSession((prev) => {
      const s = { ...prev }
      logAction(s, ACTIONS.EXPORT_PDF)
      return persist(s)
    })
  }, [persist])

  const submit = useCallback(async () => {
    if (!session) return null
    const saved = await saveCloudSession(session)
    const remote = await submitCloudSession(saved.id)
    const s = { ...saved, ...remote, status: 'pending_nodal', submittedAt: remote.assessorSubmittedAt || Date.now() }
    logAction(s, ACTIONS.SUBMITTED, 'Submitted to Nodal Officer; answers frozen')
    store.saveSession(s); setSession({ ...s }); return s
  }, [session])

  const submitNodal = useCallback(async (nodalEntry) => {
    if (!session) return null
    const remote = await submitNodalCloudSession(session.id, nodalEntry)
    const s = { ...session, ...remote, status: 'pending_home', nodalEntry }
    logAction(s, 'Nodal rehabilitation entry submitted', nodalEntry.recommendedPathway, { actorRole: 'nodal_officer' })
    store.saveSession(s); setSession({ ...s }); return s
  }, [session])

  const submitHome = useCallback(async (homeEntry) => {
    if (!session) return null
    const remote = await submitHomeCloudSession(session.id, homeEntry)
    const s = { ...session, ...remote, status: 'final_submitted', homeEntry, finalDecision: remote.finalDecision }
    logAction(s, 'Home Department release decision submitted', remote.finalDecision, { actorRole: 'home_department' })
    store.saveSession(s); setSession({ ...s }); return s
  }, [session])

  const value = {
    session, start, load, close, commit,
    updateProfile, setAnswer, setConsent, setPhoto, setBiometric,
    markReviewed, logOpen, updateScorecard, updateAssessorDeclaration, logExport, submit, submitNodal, submitHome,
    syncError, clearSyncError: () => setSyncError(''),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function truncate(t, n = 60) {
  return t && t.length > n ? t.slice(0, n) + '…' : t
}
