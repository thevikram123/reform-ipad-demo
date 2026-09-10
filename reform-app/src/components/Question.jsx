import './assessment.css'
import { SELECT_PLACEHOLDER } from '../data/questions'
import { useLanguage } from '../i18n.jsx'

export default function Question({ question, number, answer, options, onChange }) {
  const { t, tr } = useLanguage()
  if (!question) return null

  const { type, text, guidance, reverse, statementA, statementB } = question
  const ans = answer || {}

  if (type === 'label') {
    return (
      <div className="question-label">
        <h4 className="question-label-heading">{tr(text)}</h4>
      </div>
    )
  }

  if (type === 'text') {
    const longish = (ans.choice || '').length > 60
    return (
      <div className="question-card card">
        <div className="question-header">
          <QuestionTitle number={number} text={tr(text)} />
          {question.prefill && <span className="badge badge-prefill">{t('fromIntake')}</span>}
        </div>
        {guidance && <p className="question-guidance">{guidance}</p>}
        <div className="field">
          <label>{t('answer')}</label>
          {longish ? (
            <textarea
              rows={3}
              value={ans.choice || ''}
              onChange={(e) => onChange({ choice: e.target.value })}
              placeholder={t('typeResponse')}
            />
          ) : (
            <input
              type="text"
              value={ans.choice || ''}
              onChange={(e) => onChange({ choice: e.target.value })}
              placeholder={t('typeResponse')}
            />
          )}
          {question.prefill && (
            <span className="prefill-hint">{t('carriedFromIntake')}</span>
          )}
        </div>
      </div>
    )
  }

  if (type === 'pair') {
    const pairOptions = ['Yes', 'No', 'Not sure']
    return (
      <div className="question-card card">
        <div className="question-header">
          <QuestionTitle number={number} text={t('rateStatements')} />
          {reverse && <span className="badge badge-reverse">{t('reverseScored')}</span>}
        </div>
        {guidance && <p className="question-guidance">{guidance}</p>}

        <div className="pair-row">
          <label className="pair-label">{t('statementA')}</label>
          <p className="pair-statement">{tr(statementA)}</p>
          <ChoiceControl
            label={`Statement A: ${statementA}`}
            options={pairOptions.map((option) => ({ value: option, label: tr(option) }))}
            value={ans.choiceA || ''}
            onChange={(choiceA) => onChange({ choiceA })}
            placeholder={t('select')}
          />
        </div>

        <div className="pair-row">
          <label className="pair-label">{t('statementB')}</label>
          <p className="pair-statement">{tr(statementB)}</p>
          <ChoiceControl
            label={`Statement B: ${statementB}`}
            options={pairOptions.map((option) => ({ value: option, label: tr(option) }))}
            value={ans.choiceB || ''}
            onChange={(choiceB) => onChange({ choiceB })}
            placeholder={t('select')}
          />
        </div>

        <InterviewerNote value={ans.note || ''} onChange={(note) => onChange({ note })} t={t} />
      </div>
    )
  }

  const responseOptions = options || []
  return (
    <div className="question-card card">
      <div className="question-header">
        <QuestionTitle number={number} text={tr(text)} />
        {reverse && <span className="badge badge-reverse">{t('reverseScored')}</span>}
      </div>
      {guidance && <p className="question-guidance">{guidance}</p>}

      <div className="field">
        <label>{t('response')}</label>
        <ChoiceControl
          label={text}
          options={responseOptions.map((option) => ({ value: option, label: tr(option) }))}
          value={ans.choice || ''}
          onChange={(choice) => onChange({ choice })}
          placeholder={t('select')}
        />
      </div>

      <InterviewerNote value={ans.note || ''} onChange={(note) => onChange({ note })} t={t} />
    </div>
  )
}

function QuestionTitle({ number, text }) {
  const cleanText = String(text || '').replace(/^\s*\d+[.)]\s*/, '')
  return (
    <span className="question-title-row">
      {number && <span className="question-number" aria-label={`Question ${number}`}>{number}</span>}
      <span className="question-text">{cleanText}</span>
    </span>
  )
}

function ChoiceControl({ label, options, value, onChange, placeholder = SELECT_PLACEHOLDER }) {
  if (options.length <= 5) {
    return (
      <div className="choice-grid" role="group" aria-label={label}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          return (
          <button
            type="button"
            key={optionValue}
            className={`choice-option${value === optionValue ? ' choice-option--selected' : ''}`}
            aria-pressed={value === optionValue}
            onClick={() => onChange(optionValue)}
          >
            {optionLabel}
          </button>
          )
        })}
      </div>
    )
  }

  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value
        const optionLabel = typeof option === 'string' ? option : option.label
        return <option key={optionValue} value={optionValue}>{optionLabel}</option>
      })}
    </select>
  )
}

function InterviewerNote({ value, onChange, t }) {
  return (
    <details className="note-disclosure" open={value ? true : undefined}>
      <summary>{value ? t('noteAdded') : t('addNote')}</summary>
      <div className="note-row">
        <label>{t('optionalContext')}</label>
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('addContext')}
        />
      </div>
    </details>
  )
}
