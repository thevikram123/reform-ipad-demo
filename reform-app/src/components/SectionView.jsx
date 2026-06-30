import { useState, useEffect } from 'react'
import './assessment.css'
import { useSession } from '../context/SessionContext'
import { optionsForQuestion } from '../data/questions'
import Question from './Question'
import ReviewSection from './ReviewSection'
import Icon from './Icon'
import { useLanguage } from '../i18n.jsx'

/**
 * Paged within-section navigator.
 * Shows ONE GROUP per page, then a ReviewSection screen.
 * On ReviewSection confirm: calls markReviewed(section.id) then onComplete().
 *
 * Props:
 *   section    — section object (with .groups[])
 *   onComplete — fn() called after the interviewer confirms the review
 */
export default function SectionView({ section, onComplete }) {
  const { session, setAnswer, markReviewed, logOpen } = useSession()
  const { t, tr } = useLanguage()
  const [groupIdx, setGroupIdx] = useState(0)
  const [reviewing, setReviewing] = useState(false)

  // Log section open once on mount
  useEffect(() => {
    if (section) logOpen(section.id)
    // reset page when section changes
    setGroupIdx(0)
    setReviewing(false)
  }, [section?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!session || !section) return null

  const groups = section.groups || []
  const totalGroups = groups.length
  const currentGroup = groups[groupIdx] || null
  const currentQuestions = (currentGroup?.questions || []).filter((q) => q.type !== 'label')
  const answeredInGroup = currentQuestions.filter((q) => {
    const answer = (session.answers || {})[q.id]
    if (!answer) return false
    return q.type === 'pair'
      ? Boolean(answer.choiceA && answer.choiceB)
      : Boolean(answer.choice)
  }).length
  const groupPct = currentQuestions.length
    ? Math.round((answeredInGroup / currentQuestions.length) * 100)
    : 100

  function handlePrev() {
    if (reviewing) {
      setReviewing(false)
    } else if (groupIdx > 0) {
      setGroupIdx((i) => i - 1)
    }
  }

  function handleNext() {
    if (groupIdx < totalGroups - 1) {
      setGroupIdx((i) => i + 1)
    } else {
      // last group → go to review screen
      setReviewing(true)
    }
  }

  function handleConfirmReview() {
    markReviewed(section.id)
    onComplete()
  }

  if (reviewing) {
    return (
      <ReviewSection
        section={section}
        onBack={() => setReviewing(false)}
        onConfirm={handleConfirmReview}
      />
    )
  }

  return (
    <div className="section-view">
      {/* Section header */}
      <div className="section-view-header">
        <span className="section-pill">{section.letter || section.id}</span>
        <div>
          <span className="section-kicker">{t('assessmentSection')}</span>
          <h2 className="section-view-title">{tr(section.title)}</h2>
        </div>
      </div>

      {/* Group progress */}
      <div className="group-progress">
        <div className="group-progress-copy">
          <span className="group-progress-label">{t('group')} {groupIdx + 1} {t('of')} {totalGroups}</span>
          {currentGroup && <span className="group-title">{tr(currentGroup.title)}</span>}
          <span className="group-answer-count">{answeredInGroup} {t('of')} {currentQuestions.length} {t('answered')}</span>
        </div>
        <div className="group-progress-track" aria-hidden="true">
          <span style={{ width: `${groupPct}%` }} />
        </div>
      </div>

      {/* Questions */}
      <div className="questions-list">
        {currentGroup &&
          currentGroup.questions.map((q) => (
            <Question
              key={q.id}
              question={q}
              answer={(session.answers || {})[q.id]}
              options={optionsForQuestion(q)}
              onChange={(patch) => setAnswer(q, patch, section.id)}
            />
          ))}
      </div>

      {/* Navigation */}
      <div className="section-nav">
        <button
          className="btn-secondary"
          onClick={handlePrev}
          disabled={groupIdx === 0}
        >
          <Icon name="arrow-left" /> {t('previous')}
        </button>
        <button
          className="btn-primary"
          onClick={handleNext}
        >
          {groupIdx === totalGroups - 1 ? t('reviewAnswers') : t('next')} <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  )
}
