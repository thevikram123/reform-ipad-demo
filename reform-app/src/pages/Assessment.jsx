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
import BiometricCapture from '../components/BiometricCapture'
import ConsentForm from '../components/ConsentForm'
import AuditLog from '../components/AuditLog'
import Scorecard from './Scorecard'
import Icon from '../components/Icon'
import { exportPdf } from '../lib/pdf'
import { useLanguage } from '../i18n.jsx'

// Flow steps (ordered)
const STEP = {
  START_PHOTO: 'start_photo',
  CONSENT: 'consent',
  QUESTIONNAIRE: 'questionnaire',
  SCORECARD: 'scorecard',
  END_PHOTO: 'end_photo',
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
    setBiometric,
    markReviewed,
    logExport,
    submit,
  } = useSession()
  const { t, tr } = useLanguage()

  const [activeStep, setActiveStep] = useState(STEP.START_PHOTO)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [showAudit, setShowAudit] = useState(false)
  const [submitWarning, setSubmitWarning] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const mainRef = useRef(null)

  if (!session) return null

  const answers = session.answers || {}
  const reviewedSections = session.reviewedSections || {}
  const photos = session.photos || {}
  const consents = session.consents || {}

  // Gate checks
  const hasStartPhoto = !!photos.start
  const hasConsents = !!(consents.C1 && consents.C2)
  const hasEndPhoto = !!photos.end

  // Derive current flow step based on session state
  const allQuestionnaireReviewed = QUESTIONNAIRE_SECTIONS.every((s) => reviewedSections[s.id])
  const scorecardDone = !!reviewedSections[SCORECARD_SECTION_ID]

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeStep, activeSectionId])

  // Signature: "dawn horizon" — progress across the full assessment journey,
  // night (intake) → dawn (reintegration), echoing the REFORM rising-figure logo.
  const journey = [
    hasStartPhoto,
    !!(consents.C1 && consents.C2),
    ...QUESTIONNAIRE_SECTIONS.map((s) => !!reviewedSections[s.id]),
    scorecardDone,
    hasEndPhoto,
  ]
  const stagesDone = journey.filter(Boolean).length
  const progressPct = Math.round((stagesDone / journey.length) * 100)

  function canAccessStep(step) {
    switch (step) {
      case STEP.START_PHOTO: return true
      case STEP.CONSENT: return hasStartPhoto
      case STEP.QUESTIONNAIRE: return hasStartPhoto && hasConsents
      // Scorecard only after every questionnaire section is reviewed/submitted
      case STEP.SCORECARD: return hasStartPhoto && hasConsents && allQuestionnaireReviewed
      // End photo only after the scorecard is completed
      case STEP.END_PHOTO: return hasStartPhoto && hasConsents && allQuestionnaireReviewed && scorecardDone
      case STEP.SUBMIT: return hasStartPhoto && hasConsents && allQuestionnaireReviewed && scorecardDone && hasEndPhoto
      default: return false
    }
  }

  // ── Sequential progression ──
  // A section cannot be opened until the previous section has been completed
  // (reviewed/submitted). Order: Consent → A,B,D,E,F,G,H → Scorecard.
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
    if (sec.id === SCORECARD_SECTION_ID) {
      // scorecard unlocks only after all questionnaire sections are reviewed
      return !order.every((s) => reviewedSections[s.id])
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
      setActiveStep(STEP.SCORECARD)
    }
  }

  function handleExportPdf() {
    logExport()
    exportPdf(session)
  }

  function handleSubmit() {
    // Warn if sections not all reviewed
    const unreviewedQuestionnaire = QUESTIONNAIRE_SECTIONS.filter(
      (s) => !reviewedSections[s.id]
    )
    if (unreviewedQuestionnaire.length > 0) {
      const names = unreviewedQuestionnaire.map((s) => `${s.letter}: ${s.title}`).join(', ')
      setSubmitWarning(`Warning: these sections have not been fully reviewed: ${names}. You may still submit.`)
    } else {
      setSubmitWarning('')
    }
    submit()
    setSubmitted(true)
  }

  // Render the main panel content
  function renderMain() {
    if (submitted) {
      return (
        <div className="submit-screen card">
          <h2 className="submit-title">Assessment Submitted</h2>
          <p>The session has been marked as submitted. You may now export the PDF report.</p>
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

    switch (activeStep) {
      case STEP.START_PHOTO:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 1 — Start Photo &amp; Biometric</h2>
            <p className="step-desc">
              Capture the prisoner's photo and optional biometric at the beginning of the session.
            </p>
            <PhotoCapture
              label="Start Photo"
              value={photos.start}
              onCapture={(dataUrl) => setPhoto('start', dataUrl)}
            />
            <div className="biometric-row">
              <BiometricCapture
                label="Start Biometric (optional)"
                value={session.biometric?.start}
                onCapture={(data) => setBiometric('start', data)}
              />
            </div>
            {hasStartPhoto && (
              <div className="step-done-msg">
                Start photo captured.{' '}
                <button
                  className="btn-primary"
                  onClick={() => setActiveStep(STEP.CONSENT)}
                >
                  Proceed to consent <Icon name="arrow-right" />
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
        if (sec.id === SCORECARD_SECTION_ID) {
          return (
            <div className="step-panel">
              <Scorecard onDone={() => { markReviewed(SCORECARD_SECTION_ID); setActiveSectionId(null) }} />
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
        return (
          <div className="step-panel">
            <Scorecard onDone={() => { markReviewed(SCORECARD_SECTION_ID); setActiveStep(STEP.END_PHOTO) }} />
          </div>
        )

      case STEP.END_PHOTO:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 5 — End Photo &amp; Biometric</h2>
            <p className="step-desc">
              Capture the prisoner's photo and optional biometric at the end of the session.
            </p>
            <PhotoCapture
              label="End Photo"
              value={photos.end}
              onCapture={(dataUrl) => setPhoto('end', dataUrl)}
            />
            <div className="biometric-row">
              <BiometricCapture
                label="End Biometric (optional)"
                value={session.biometric?.end}
                onCapture={(data) => setBiometric('end', data)}
              />
            </div>
            {hasEndPhoto && (
              <div className="step-done-msg">
                End photo captured.{' '}
                <button
                  className="btn-primary"
                  onClick={() => setActiveStep(STEP.SUBMIT)}
                >
                  Proceed to submit <Icon name="arrow-right" />
                </button>
              </div>
            )}
          </div>
        )

      case STEP.SUBMIT:
        return (
          <div className="step-panel card">
            <h2 className="step-panel-title">Step 6 — Final Submit</h2>
            <p>Review that all sections are complete before submitting.</p>
            <div className="submit-checklist">
              <CheckItem ok={hasStartPhoto} label="Start photo captured" />
              <CheckItem ok={hasConsents} label="Consent obtained (C1 &amp; C2)" />
              <CheckItem
                ok={QUESTIONNAIRE_SECTIONS.every((s) => reviewedSections[s.id])}
                label="All questionnaire sections reviewed"
                warn
              />
              <CheckItem ok={!!reviewedSections[SCORECARD_SECTION_ID]} label="Scorecard completed" warn />
              <CheckItem ok={hasEndPhoto} label="End photo captured" />
            </div>
            {submitWarning && (
              <p className="submit-warning">{submitWarning}</p>
            )}
            <div className="submit-actions">
              <button
                className="btn-accent"
                disabled={!hasStartPhoto || !hasConsents || !hasEndPhoto}
                onClick={handleSubmit}
              >
                Submit Assessment
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
    const steps = [
      { key: STEP.START_PHOTO, label: `1. ${t('startPhoto')}` },
      { key: STEP.CONSENT, label: `2. ${t('consent')}` },
      { key: STEP.QUESTIONNAIRE, label: `3. ${t('questionnaire')}` },
      { key: STEP.SCORECARD, label: `4. ${t('scorecard')}` },
      { key: STEP.END_PHOTO, label: `5. ${t('endPhoto')}` },
      { key: STEP.SUBMIT, label: `6. ${t('submit')}` },
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
    <div className="assessment-shell">
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
            {sections.map((sec) => {
              const isSpecial =
                sec.id === CONSENT_SECTION_ID || sec.id === SCORECARD_SECTION_ID
              const complete = isSectionComplete(sec)
              const status = isSpecial
                ? (complete ? 'done' : 'todo')
                : getSectionStatus(sec, answers, reviewedSections)
              const locked = isSectionLocked(sec)

              const isActive =
                (activeSectionId === sec.id && activeStep === STEP.QUESTIONNAIRE) ||
                (sec.id === CONSENT_SECTION_ID && activeStep === STEP.CONSENT) ||
                (sec.id === SCORECARD_SECTION_ID && activeStep === STEP.SCORECARD)

              return (
                <li key={sec.id}>
                  <button
                    className={`rail-item${isActive ? ' rail-item--active' : ''}${locked ? ' rail-item--locked' : ''}`}
                    disabled={locked}
                    title={locked ? t('completePrevious') : ''}
                    onClick={() => {
                      if (locked) return
                      if (sec.id === SCORECARD_SECTION_ID) {
                        setActiveStep(STEP.SCORECARD)
                        setActiveSectionId(null)
                        setShowAudit(false)
                      } else if (sec.id === CONSENT_SECTION_ID) {
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
            <span className={`badge badge-${session.status === 'submitted' ? 'done' : 'partial'}`}>
              {session.status === 'submitted' ? t('submitted') : t('inProgress')}
            </span>
          </div>
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
