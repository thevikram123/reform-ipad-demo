import { useEffect, useRef, useState } from 'react'
import '../components/assessment.css'
import { useSession } from '../context/SessionContext'
import {
  sections,
  sectionStats,
  CONSENT_SECTION_ID,
  SCORECARD_SECTION_ID,
} from '../data/questions'
import SectionView from '../components/SectionView'
import PhotoCapture from '../components/PhotoCapture'
import ConsentForm from '../components/ConsentForm'
import AuditLog from '../components/AuditLog'
import Icon from '../components/Icon'
import { exportPdf } from '../lib/pdf'
import { useLanguage } from '../i18n.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import NodalDecision from './NodalDecision.jsx'
import HomeDecision from './HomeDecision.jsx'
import AssessorDeclaration from './AssessorDeclaration.jsx'

// Flow steps (ordered)
const STEP = {
  START_PHOTO: 'start_photo',
  CONSENT: 'consent',
  QUESTIONNAIRE: 'questionnaire',
  SCORECARD: 'scorecard',
  END_PHOTO: 'end_photo',
  CONSENT_COPY: 'consent_copy',
  SUBMIT: 'submit',
}

// Sections rendered via SectionView (not special screens)
const QUESTIONNAIRE_SECTIONS = sections
  .filter((s) => s.id !== CONSENT_SECTION_ID && s.id !== SCORECARD_SECTION_ID)

function getSectionStatus(section, answers, reviewedSections) {
  if (reviewedSections && reviewedSections[section.id]) return 'done'
  const stats = sectionStats(section, answers)
  if (stats.answered > 0) return 'partial'
  return 'todo'
}

export default function Assessment({ onExit }) {
  const {
    session,
    setPhoto,
    markReviewed,
    logExport,
    submit,
  } = useSession()
  const { t, tr } = useLanguage()
  const { profile: account } = useAuth()

  const [activeStep, setActiveStep] = useState(() => session?.status && session.status !== 'open' ? STEP.SCORECARD : STEP.START_PHOTO)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [showAudit, setShowAudit] = useState(false)
  const [submitWarning, setSubmitWarning] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const mainRef = useRef(null)

  if (!session) return null

  const answers = session.answers || {}
  const reviewedSections = session.reviewedSections || {}
  const photos = session.photos || {}
  const consents = session.consents || {}
  const declaration = session.assessorDeclaration || {}

  // Gate checks
  const hasStartPhoto = !!photos.start && !!photos.startAssessor
  const hasConsents = !!(consents.C1 && consents.C2)
  const hasEndPhoto = !!photos.end && !!photos.endAssessor
  // Keep the legacy C1 key readable for assessments created before the
  // two-document capture step was introduced.
  const hasC1ConsentCopy = !!(photos.consentCopyC1 || photos.consentCopy)
  const hasC2ConsentCopy = !!photos.consentCopyC2
  const hasConsentCopies = hasC1ConsentCopy && hasC2ConsentCopy

  // Derive current flow step based on session state
  const allQuestionnaireReviewed = QUESTIONNAIRE_SECTIONS.every((s) => reviewedSections[s.id])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeStep, activeSectionId])

  // Signature: "dawn horizon" — progress across the full assessment journey,
  // night (intake) → dawn (reintegration), echoing the REFORM rising-figure logo.
  const journey = [
    hasStartPhoto,
    !!(consents.C1 && consents.C2),
    ...QUESTIONNAIRE_SECTIONS.map((s) => !!reviewedSections[s.id]),
    hasEndPhoto,
    hasConsentCopies,
  ]
  const stagesDone = journey.filter(Boolean).length
  const progressPct = Math.round((stagesDone / journey.length) * 100)

  function canAccessStep(step) {
    if (session.status !== 'open') return true
    switch (step) {
      case STEP.START_PHOTO: return true
      case STEP.CONSENT: return hasStartPhoto
      case STEP.QUESTIONNAIRE: return hasStartPhoto && hasConsents
      case STEP.SCORECARD: return false
      case STEP.END_PHOTO: return hasStartPhoto && hasConsents && allQuestionnaireReviewed
      case STEP.CONSENT_COPY: return hasStartPhoto && hasConsents && allQuestionnaireReviewed && hasEndPhoto
      case STEP.SUBMIT: return hasStartPhoto && hasConsents && allQuestionnaireReviewed && hasEndPhoto && hasConsentCopies
      default: return false
    }
  }

  // ── Sequential progression ──
  // A section cannot be opened until the previous section has been completed
  // (reviewed/submitted). Order: Consent → A,B,D,E,F,G,H → evidence → declaration.
  function isSectionComplete(sec) {
    if (sec.id === CONSENT_SECTION_ID) return hasConsents
    return !!reviewedSections[sec.id] // questionnaire sections + scorecard
  }

  function isSectionLocked(sec) {
    if (!hasStartPhoto) return true
    if (sec.id === CONSENT_SECTION_ID) return false // consent unlocks right after the start photo
    if (!hasConsents) return true // everything else needs consent first
    const order = QUESTIONNAIRE_SECTIONS // [A,B,D,E,F,G,H] in document order
    const idx = order.findIndex((s) => s.id === sec.id)
    if (idx >= 0) {
      // locked until every earlier questionnaire section is reviewed
      return !order.slice(0, idx).every((s) => reviewedSections[s.id])
    }
    return false
  }

  function openSection(sectionId) {
    const sec = sections.find((s) => s.id === sectionId)
    if (!sec || isSectionLocked(sec)) return
    setActiveSectionId(sectionId)
    setActiveStep(STEP.QUESTIONNAIRE)
    setShowAudit(false)
  }

  function goToQuestionnaire() {
    const nextSection = QUESTIONNAIRE_SECTIONS.find((s) => !reviewedSections[s.id])
      || QUESTIONNAIRE_SECTIONS[0]
    setActiveStep(STEP.QUESTIONNAIRE)
    setActiveSectionId(nextSection?.id || null)
    setShowAudit(false)
  }

  function handleQuestionnaireSectionComplete(sectionId) {
    const currentIndex = QUESTIONNAIRE_SECTIONS.findIndex((s) => s.id === sectionId)
    const nextSection = QUESTIONNAIRE_SECTIONS[currentIndex + 1]
    if (nextSection) {
      setActiveStep(STEP.QUESTIONNAIRE)
      setActiveSectionId(nextSection.id)
    } else {
      setActiveSectionId(null)
      setActiveStep(STEP.END_PHOTO)
    }
  }

  function handleExportPdf() {
    logExport()
    exportPdf(session)
  }

  async function handleSubmit() {
    // Warn if sections not all reviewed
    const unreviewedQuestionnaire = QUESTIONNAIRE_SECTIONS.filter(
      (s) => !reviewedSections[s.id]
    )
    if (unreviewedQuestionnaire.length > 0) {
      const names = unreviewedQuestionnaire.map((s) => `${s.letter}: ${s.title}`).join(', ')
      setSubmitWarning(`Complete and confirm these sections before submission: ${names}.`)
      return
    }
    setSubmitWarning('')
    try {
      setSubmitting(true)
      await submit()
    } catch (error) {
      setSubmitWarning(error.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Render the main panel content
  function renderMain() {
    if (session.status === 'final_submitted' && activeStep === STEP.SUBMIT) {
      return (
        <div className="submit-screen card">
          <span className="section-pill">Final submitted</span>
          <h2 className="submit-title">Final Decision Recorded</h2>
          <p><strong>{session.finalDecision}</strong></p>
          <p>This assessment is permanently view-only. The complete report remains available below.</p>
          <div className="submit-actions">
            <button className="btn-accent" onClick={handleExportPdf}>
              <Icon name="download" /> Export PDF report
            </button>
            <button className="btn-secondary" onClick={onExit}>
              <Icon name="arrow-left" /> Back to registry
            </button>
          </div>
        </div>
      )
    }

    if (session.status === 'pending_nodal' && activeStep === STEP.SUBMIT) {
      return (
        <div className="submit-screen card">
          <span className="section-pill">Awaiting review</span>
          <h2 className="submit-title">Submitted to Nodal Officer</h2>
          <p>The assessor’s answers, evidence and declaration are frozen. A Nodal Officer must now add the rehabilitation entry without changing the assessor’s record.</p>
          <div className="submit-actions">{account?.role === 'nodal_officer' && <button className="btn-accent" onClick={() => setActiveStep(STEP.SCORECARD)}>Open Nodal Officer entry <Icon name="arrow-right" /></button>}<button className="btn-secondary" onClick={handleExportPdf}><Icon name="download" /> Export current report</button><button className="btn-secondary" onClick={onExit}><Icon name="arrow-left" /> Back to registry</button></div>
        </div>
      )
    }

    if (session.status === 'pending_home' && activeStep === STEP.SUBMIT) {
      return <div className="submit-screen card"><span className="section-pill">Stage 2 complete</span><h2 className="submit-title">Submitted to Home Department</h2><p>The assessor record and Nodal Officer rehabilitation entry are locked. The Home Department must now record the release decision.</p><div className="submit-actions"><button className="btn-secondary" onClick={handleExportPdf}><Icon name="download" /> Export current report</button><button className="btn-secondary" onClick={onExit}><Icon name="arrow-left" /> Back to registry</button></div></div>
    }

    if (session.status === 'pending_nodal' && activeStep === STEP.SCORECARD) {
      return <NodalDecision canSubmit={account?.role === 'nodal_officer'} />
    }
    if ((session.status === 'pending_home' || session.status === 'final_submitted') && activeStep === STEP.SCORECARD) {
      return <HomeDecision canSubmit={session.status === 'pending_home' && account?.role === 'home_department'} />
    }

    switch (activeStep) {
      case STEP.START_PHOTO:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 1 — Start Photo</h2>
            <p className="step-desc">{t('captureBothStart')}</p>
            <div className="dual-capture-grid">
              <div className="capture-person-card">
                <span className="capture-person-role">{t('prisonerRole')}</span>
                <PhotoCapture label={t('prisonerStartPhoto')} value={photos.start} onCapture={(dataUrl) => setPhoto('start', dataUrl)} allowUpload={false} />
              </div>
              <div className="capture-person-card">
                <span className="capture-person-role">{t('assessorRole')}</span>
                <PhotoCapture label={t('assessorStartPhoto')} value={photos.startAssessor} onCapture={(dataUrl) => setPhoto('startAssessor', dataUrl)} allowUpload={false} />
              </div>
            </div>
            {hasStartPhoto && (
              <div className="step-done-msg">
                {t('bothStartCaptured')}{' '}
                <button
                  className="btn-primary"
                  onClick={() => setActiveStep(STEP.CONSENT)}
                >
                  {t('proceedConsent')} <Icon name="arrow-right" />
                </button>
              </div>
            )}
          </div>
        )

      case STEP.CONSENT:
        return (
          <div className="step-panel">
            <ConsentForm
              onDone={() => {
                markReviewed(CONSENT_SECTION_ID)
                goToQuestionnaire()
              }}
            />
          </div>
        )

      case STEP.QUESTIONNAIRE: {
        const sec = sections.find((s) => s.id === activeSectionId)
          || QUESTIONNAIRE_SECTIONS.find((s) => !reviewedSections[s.id])
          || QUESTIONNAIRE_SECTIONS[0]
        if (!sec) {
          return (
            <div className="step-panel card">
              <h2 className="step-panel-title">Step 3 — Questionnaire</h2>
              <p>Select a section from the left rail to begin.</p>
            </div>
          )
        }
        if (sec.id === CONSENT_SECTION_ID) {
          return (
            <div className="step-panel">
              <ConsentForm onDone={() => setActiveSectionId(null)} />
            </div>
          )
        }
        return (
          <SectionView
            key={sec.id}
            section={sec}
            onComplete={() => handleQuestionnaireSectionComplete(sec.id)}
          />
        )
      }

      case STEP.SCORECARD:
        return session.status === 'pending_nodal'
          ? <NodalDecision canSubmit={account?.role === 'nodal_officer'} />
          : <HomeDecision canSubmit={session.status === 'pending_home' && account?.role === 'home_department'} />

      case STEP.END_PHOTO:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 4 — End Photo</h2>
            <p className="step-desc">{t('captureBothEnd')}</p>
            <div className="dual-capture-grid">
              <div className="capture-person-card">
                <span className="capture-person-role">{t('prisonerRole')}</span>
                <PhotoCapture label={t('prisonerEndPhoto')} value={photos.end} onCapture={(dataUrl) => setPhoto('end', dataUrl)} allowUpload={false} />
              </div>
              <div className="capture-person-card">
                <span className="capture-person-role">{t('assessorRole')}</span>
                <PhotoCapture label={t('assessorEndPhoto')} value={photos.endAssessor} onCapture={(dataUrl) => setPhoto('endAssessor', dataUrl)} allowUpload={false} />
              </div>
            </div>
            {hasEndPhoto && (
              <div className="step-done-msg">
                {t('bothEndCaptured')}{' '}
                <button
                  className="btn-primary"
                  onClick={() => setActiveStep(STEP.CONSENT_COPY)}
                >
                  {t('proceedConsentCopy')} <Icon name="arrow-right" />
                </button>
              </div>
            )}
          </div>
        )

      case STEP.CONSENT_COPY:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 5 — {t('signedConsentCopies')}</h2>
            <p className="step-desc">{t('captureConsentCopies')}</p>
            <div className="dual-capture-grid consent-copy-grid">
              <div className="capture-person-card">
                <span className="capture-person-role">C1</span>
                <PhotoCapture
                  label={t('c1ConsentCopy')}
                  hint={t('consentCopyHint')}
                  value={photos.consentCopyC1 || photos.consentCopy}
                  onCapture={(dataUrl) => setPhoto('consentCopyC1', dataUrl)}
                  allowUpload={false}
                  variant="document"
                  captureLabel={t('captureC1Copy')}
                />
              </div>
              <div className="capture-person-card">
                <span className="capture-person-role">C2</span>
                <PhotoCapture
                  label={t('c2ConsentCopy')}
                  hint={t('consentCopyHint')}
                  value={photos.consentCopyC2}
                  onCapture={(dataUrl) => setPhoto('consentCopyC2', dataUrl)}
                  allowUpload={false}
                  variant="document"
                  captureLabel={t('captureC2Copy')}
                />
              </div>
            </div>
            {hasConsentCopies && (
              <div className="step-done-msg">
                {t('bothConsentCopiesCaptured')}{' '}
                <button
                  className="btn-primary"
                  onClick={() => setActiveStep(STEP.SUBMIT)}
                >
                  {t('proceedSubmit')} <Icon name="arrow-right" />
                </button>
              </div>
            )}
          </div>
        )

      case STEP.SUBMIT:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 6 — Declaration and Submit</h2>
            <p>Review that all sections are complete, then sign the assessor declaration.</p>
            <div className="submit-checklist">
              <CheckItem ok={hasStartPhoto} label="Start photo captured" />
              <CheckItem ok={hasConsents} label="Consent obtained (C1 &amp; C2)" />
              <CheckItem
                ok={QUESTIONNAIRE_SECTIONS.every((s) => reviewedSections[s.id])}
                label="All questionnaire sections reviewed"
              />
              <CheckItem ok={hasEndPhoto} label="End photo captured" />
              <CheckItem ok={hasC1ConsentCopy} label="Signed C1 consent copy captured" />
              <CheckItem ok={hasC2ConsentCopy} label="Signed C2 consent copy captured" />
            </div>
            <AssessorDeclaration />
            {submitWarning && (
              <p className="submit-warning">{submitWarning}</p>
            )}
            <div className="submit-actions">
              <button
                className="btn-accent"
                disabled={submitting || !hasStartPhoto || !hasConsents || !allQuestionnaireReviewed || !hasEndPhoto || !hasConsentCopies || !declaration.accepted || !declaration.signature}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting…' : 'Submit to Nodal Officer'}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Step strip item
  function StepStrip() {
    const steps = session.status === 'open' ? [
      { key: STEP.START_PHOTO, label: `1. ${t('startPhoto')}` },
      { key: STEP.CONSENT, label: `2. ${t('consent')}` },
      { key: STEP.QUESTIONNAIRE, label: `3. ${t('questionnaire')}` },
      { key: STEP.END_PHOTO, label: `4. ${t('endPhoto')}` },
      { key: STEP.CONSENT_COPY, label: `5. ${t('signedConsentCopies')}` },
      { key: STEP.SUBMIT, label: '6. Declaration & Submit' },
    ] : [
      { key: STEP.START_PHOTO, label: 'Evidence: Start' },
      { key: STEP.CONSENT, label: 'Consent' },
      { key: STEP.QUESTIONNAIRE, label: 'Assessment record' },
      { key: STEP.END_PHOTO, label: 'Evidence: End' },
      { key: STEP.CONSENT_COPY, label: 'Signed consent copies' },
      { key: STEP.SCORECARD, label: session.status === 'pending_nodal' ? 'Nodal Officer Entry' : 'Home Department Decision' },
      { key: STEP.SUBMIT, label: 'Submission status' },
    ]
    return (
      <div className="step-strip">
        {steps.map((s, i) => {
          const accessible = canAccessStep(s.key)
          const active = activeStep === s.key
          return (
            <button
              key={s.key}
              className={`step-item${active ? ' step-item--active' : ''}${!accessible ? ' step-item--locked' : ''}`}
              disabled={!accessible}
              onClick={() => {
                if (accessible) {
                  if (s.key === STEP.QUESTIONNAIRE) {
                    goToQuestionnaire()
                  } else {
                    setActiveStep(s.key)
                    setActiveSectionId(null)
                    setShowAudit(false)
                  }
                }
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`assessment-shell${session.status !== 'open' ? ' assessment-readonly' : ''}`}>
      {/* Step strip */}
      <StepStrip />

      {/* Signature: dawn-horizon progress (night → reintegration) */}
      <div className="horizon-wrap" title={`${t('reintegrationProgress')} — ${progressPct}%`}>
        <div className="horizon" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="horizon-fill" style={{ width: `${Math.max(progressPct, 2)}%` }} />
          <span className="horizon-sun" style={{ left: `${progressPct}%` }} />
        </div>
        <span className="horizon-cap mono">{t('reintegrationProgress')} · {stagesDone}/{journey.length} {t('stages')} · {progressPct}%</span>
      </div>

      <div className="assessment-body">
        {/* Left rail */}
        <aside className="assessment-rail">
          <div className="rail-head">{t('sections')}</div>
          <ul className="rail-list">
            {sections.filter((sec) => sec.id !== SCORECARD_SECTION_ID).map((sec) => {
              const isSpecial =
                sec.id === CONSENT_SECTION_ID
              const complete = isSectionComplete(sec)
              const status = isSpecial
                ? (complete ? 'done' : 'todo')
                : getSectionStatus(sec, answers, reviewedSections)
              const locked = isSectionLocked(sec)

              const isActive =
                (activeSectionId === sec.id && activeStep === STEP.QUESTIONNAIRE) ||
                (sec.id === CONSENT_SECTION_ID && activeStep === STEP.CONSENT)

              return (
                <li key={sec.id}>
                  <button
                    className={`rail-item${isActive ? ' rail-item--active' : ''}${locked ? ' rail-item--locked' : ''}`}
                    disabled={locked}
                    title={locked ? t('completePrevious') : ''}
                    onClick={() => {
                      if (locked) return
                      if (sec.id === CONSENT_SECTION_ID) {
                        setActiveStep(STEP.CONSENT)
                        setActiveSectionId(null)
                        setShowAudit(false)
                      } else {
                        openSection(sec.id)
                      }
                    }}
                  >
                    <span className="rail-letter">{sec.letter || sec.id}</span>
                    <span className="rail-title">{tr(sec.title)}</span>
                    {locked
                      ? <span className="rail-lock" aria-label={t('locked')}><Icon name="lock" size={14} /></span>
                      : <span className={`badge badge-${status}`}>
                          {status === 'done' ? t('done') : status === 'partial' ? t('partial') : t('todo')}
                        </span>}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="rail-footer">
            <button
              className={`rail-item${showAudit ? ' rail-item--active' : ''} rail-audit-btn`}
              onClick={() => setShowAudit((v) => !v)}
            >
              <Icon name="clipboard" size={15} /> {t('auditLog')}
              <Icon name={showAudit ? 'chevron-right' : 'chevron-left'} size={14} style={{ marginLeft: 'auto' }} />
            </button>
            <button
              className="btn-secondary rail-export"
              onClick={handleExportPdf}
            >
              <Icon name="download" size={15} /> {t('exportPdf')}
            </button>
            <button className="btn-ghost rail-exit" onClick={onExit}>
              <Icon name="arrow-left" size={15} /> {t('backRegistry')}
            </button>
          </div>
        </aside>

        {/* Main panel */}
        <main className="assessment-main" ref={mainRef}>
          <div className="assessment-prisoner-bar">
            <span className="muted">
              {session.profile?.name && <><strong>{session.profile.name}</strong> · </>}
              ID: <span className="pid">{session.profile?.prisonerId || '—'}</span>
              {session.profile?.assessedBy && <> · {t('assessedByInline')} {session.profile.assessedBy}</>}
            </span>
            <span className={`badge badge-${session.status === 'final_submitted' ? 'done' : session.status === 'pending_nodal' || session.status === 'pending_home' ? 'review' : 'partial'}`}>
              {session.status === 'final_submitted' ? 'Final submitted' : session.status === 'pending_nodal' ? 'Awaiting Nodal entry' : session.status === 'pending_home' ? 'Awaiting Home Department' : 'Open'}
            </span>
          </div>
          {session.status !== 'open' && (
            <div className="readonly-banner"><Icon name="lock" size={14} /><span><strong>View-only record</strong> — interview answers and evidence are frozen after assessor submission.</span></div>
          )}
          {renderMain()}
        </main>
      </div>

      {/* Collapsible audit-log sidebar (drawer) */}
      {!showAudit && (
        <button
          className="audit-tab"
          onClick={() => setShowAudit(true)}
          title={t('auditLog')}
        >
          <Icon name="clipboard" size={15} />
          <span>{t('auditLog')}</span>
        </button>
      )}
      {showAudit && <div className="audit-backdrop" onClick={() => setShowAudit(false)} />}
      <aside className={`audit-drawer${showAudit ? ' audit-drawer--open' : ''}`} aria-hidden={!showAudit}>
        <div className="audit-drawer-head">
          <span>{t('auditLog')}</span>
          <button className="btn-ghost audit-drawer-close" onClick={() => setShowAudit(false)} aria-label="Close audit log"><Icon name="x" size={18} /></button>
        </div>
        <div className="audit-drawer-body">
          <AuditLog />
        </div>
      </aside>
    </div>
  )
}

function CheckItem({ ok, label, warn }) {
  return (
    <div className={`check-item${ok ? ' check-item--ok' : warn ? ' check-item--warn' : ' check-item--no'}`}>
      <span className="check-icon"><Icon name={ok ? 'check' : 'circle'} size={16} /></span>
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  )
}
