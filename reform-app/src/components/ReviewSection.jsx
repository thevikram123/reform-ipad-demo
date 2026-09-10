import './assessment.css'
import { useSession } from '../context/SessionContext'
import { answerableQuestions } from '../data/questions'
import Icon from './Icon'
import { useLanguage } from '../i18n.jsx'

/**
 * Review screen shown at the end of a section before marking it complete.
 * Props:
 *   section   — section object
 *   onBack    — fn() → return to last group
 *   onConfirm — fn() → mark reviewed & advance
 */
export default function ReviewSection({ section, onBack, onConfirm }) {
  const { session } = useSession()
  const { t, tr } = useLanguage()
  if (!session || !section) return null

  const answers = session.answers || {}
  const allAnswerable = answerableQuestions(section)
  const questionNumbers = new Map(allAnswerable.map((q, index) => [q.id, index + 1]))
  const answeredCount = allAnswerable.filter((q) => {
    const a = answers[q.id]
    if (!a) return false
    if (q.type === 'pair') return a.choiceA || a.choiceB || a.note
    return a.choice || a.note
  }).length

  return (
    <div className="review-screen">
      <div className="review-header">
        <span className="section-pill">{section.letter || section.id}</span>
        <h2 className="review-title">{t('reviewYourAnswers')} — {tr(section.title)}</h2>
      </div>

      <p className="review-summary">
        <strong>{answeredCount}</strong> {t('of')} <strong>{allAnswerable.length}</strong> {t('questionsAnswered')}.
      </p>

      {(section.groups || []).map((group) => {
        const groupAnswerable = group.questions.filter((q) => q.type !== 'label')
        if (groupAnswerable.length === 0) return null
        return (
          <div key={group.id} className="review-group card">
            <h3 className="review-group-title">{tr(group.title)}</h3>
            <table className="review-table">
              <thead>
                <tr>
                  <th>{t('question')}</th>
                  <th>{t('response')}</th>
                  <th>{t('note')}</th>
                </tr>
              </thead>
              <tbody>
                {group.questions.map((q) => {
                  if (q.type === 'label') {
                    return (
                      <tr key={q.id} className="review-label-row">
                        <td colSpan={3}><em>{tr(q.text)}</em></td>
                      </tr>
                    )
                  }

                  const a = answers[q.id]

                  if (q.type === 'pair') {
                    return (
                      <tr key={q.id}>
                        <td>
                          <div className="review-q-text"><strong>{questionNumbers.get(q.id)}.</strong> {t('rateStatements')}</div>
                          {q.statementA && (
                            <div className="review-sub">A: {tr(q.statementA)}</div>
                          )}
                          {q.statementB && (
                            <div className="review-sub">B: {tr(q.statementB)}</div>
                          )}
                        </td>
                        <td>
                          {a && (a.choiceA || a.choiceB) ? (
                            <>
                              {a.choiceA && <div>A: {tr(a.choiceA)}</div>}
                              {a.choiceB && <div>B: {tr(a.choiceB)}</div>}
                            </>
                          ) : (
                            <span className="muted">— {t('notAnswered')} —</span>
                          )}
                        </td>
                        <td>
                          {a && a.note
                            ? <span className="review-note">{a.note}</span>
                            : <span className="muted">—</span>}
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={q.id}>
                      <td className="review-q-text"><strong>{questionNumbers.get(q.id)}.</strong> {String(tr(q.text)).replace(/^\s*\d+[.)]\s*/, '')}</td>
                      <td>
                        {a && a.choice
                          ? tr(a.choice)
                          : <span className="muted">— {t('notAnswered')} —</span>}
                      </td>
                      <td>
                        {a && a.note
                          ? <span className="review-note">{a.note}</span>
                          : <span className="muted">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      <div className="review-actions">
        <button className="btn-secondary" onClick={onBack}>
          <Icon name="arrow-left" /> {t('backEdit')}
        </button>
        <button className="btn-primary" onClick={onConfirm}>
          <Icon name="check" /> {t('completeContinue')}
        </button>
      </div>
    </div>
  )
}
