import { useState } from 'react'
import { useSession } from '../context/SessionContext'
import Icon from './Icon'
import './capture.css'
import { useLanguage } from '../i18n.jsx'

/* ── Clause data ──────────────────────────────────────────────────────────── */

const C1_CLAUSES = [
  {
    num: '01',
    heading: 'Nature of Participation',
    body:
      'You are being invited to take part in a mental health assessment. This may include answering questions about your thoughts, feelings, behaviour, and life experiences.',
  },
  {
    num: '02',
    heading: 'Purpose',
    body:
      'The purpose of this assessment is to better understand your needs and support appropriate planning for rehabilitation and well-being.',
  },
  {
    num: '03',
    heading: 'Procedures',
    body:
      'The assessment will involve interviews and/or questionnaires conducted by trained personnel. It will take approximately the allocated time.',
  },
  {
    num: '04',
    heading: 'Voluntary Participation',
    body:
      'Your participation is completely voluntary. You may choose not to answer any question or stop the assessment at any time without any negative consequences.',
  },
  {
    num: '05',
    heading: 'Confidentiality',
    body:
      'The information you provide will be kept confidential and used only for assessment, case management, and program-related purposes. It will not be shared outside authorised personnel.',
  },
  {
    num: '06',
    heading: 'Limits of Confidentiality',
    body:
      'If there is a risk of harm to yourself or others, or if required by law, relevant information may be shared with appropriate authorities.',
  },
  {
    num: '07',
    heading: 'No Impact on Legal Status',
    body:
      'Your decision to participate or not participate will not affect your legal case, sentence, or privileges.',
  },
  {
    num: '08',
    heading: 'Benefits and Risks',
    body:
      'There are no direct risks expected. Some questions may feel personal or uncomfortable; you may choose to skip such questions.',
  },
  {
    num: '09',
    heading: 'Consent Declaration',
    body:
      'I confirm that the assessment has been explained to me in a language I understand. I have had the opportunity to ask questions and understand my rights.',
  },
]

const C2_CLAUSES = [
  {
    num: '01',
    heading: 'Nature of Participation',
    body:
      'You are being invited to participate in a structured program that includes assessments and rehabilitation activities aimed at supporting behavioural and personal development.',
  },
  {
    num: '02',
    heading: 'Purpose',
    body:
      'The program aims to help improve well-being, develop skills, and support reintegration into society.',
  },
  {
    num: '03',
    heading: 'Program Components',
    body:
      'This may include psychological and behavioural assessments, group or individual sessions, skill-development or counselling programs, and regular monitoring or follow-up.',
  },
  {
    num: '04',
    heading: 'Voluntary Participation',
    body:
      'Your participation is voluntary. You may choose to withdraw at any time without penalty or loss of rights.',
  },
  {
    num: '05',
    heading: 'Responsibilities',
    body:
      'You are encouraged to participate honestly and engage in program activities to the best of your ability.',
  },
  {
    num: '06',
    heading: 'Confidentiality',
    body:
      'All information will be kept confidential and used only for program and case management purposes.',
  },
  {
    num: '07',
    heading: 'Limits of Confidentiality',
    body:
      'Information may be shared if required by law or if there is a risk of harm to yourself or others.',
  },
  {
    num: '08',
    heading: 'No Impact on Legal Status',
    body:
      'Participation or non-participation will not affect your legal standing, sentence, or rights within the institution.',
  },
  {
    num: '09',
    heading: 'Potential Benefits',
    body:
      'Participation may support personal development, skill-building, and access to rehabilitation services.',
  },
  {
    num: '10',
    heading: 'Consent Declaration',
    body:
      'I confirm that I understand the purpose, nature, and conditions of this program. I have had the opportunity to ask questions and have received satisfactory explanations.',
  },
]

/* ── Helper: blank form state ─────────────────────────────────────────────── */
function blankForm(profile, saved) {
  return {
    agreed: saved?.agreed ?? null, // true | false | null
    name: saved?.name ?? profile?.name ?? '',
    signature: saved?.signature ?? '',
    place: saved?.place ?? profile?.location ?? '',
    datetime:
      saved?.datetime ??
      (() => {
        const d = profile?.date ?? ''
        const t = profile?.time ?? ''
        return d && t ? `${d} ${t}` : d || ''
      })(),
  }
}

/* ── ConsentCard sub-component ────────────────────────────────────────────── */
function ConsentCard({ id, tag, title, clauses, form, onChange, saved }) {
  const { t, tr } = useLanguage()
  const setField = (key, val) => onChange({ ...form, [key]: val })

  const isRecorded = saved?.agreed !== undefined && saved?.agreed !== null

  return (
    <div className="consent-card card">
      <div className="consent-card__header">
        <span className="consent-card__tag">{tag}</span>
        <h2 className="consent-card__title">{title}</h2>
      </div>

      {/* Numbered clauses */}
      <ol className="consent-clauses" start={1}>
        {clauses.map((c) => (
          <li key={c.num} className="consent-clause">
            <span className="consent-clause__num">{c.num}.</span>
            <span>
              <span className="consent-clause__heading">{tr(c.heading)}.</span>
              <span className="consent-clause__body">{tr(c.body)}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Agree / decline */}
      <div className="consent-choices">
        <label
          className={`consent-choice consent-choice--agree${form.agreed === true ? ' selected' : ''}`}
        >
          <input
            type="radio"
            name={`${id}-choice`}
            value="agree"
            checked={form.agreed === true}
            onChange={() => onChange({ ...form, agreed: true })}
          />
          {t('agreeParticipate')}
        </label>

        <label
          className={`consent-choice consent-choice--decline${form.agreed === false ? ' selected' : ''}`}
        >
          <input
            type="radio"
            name={`${id}-choice`}
            value="decline"
            checked={form.agreed === false}
            onChange={() => onChange({ ...form, agreed: false })}
          />
          {t('declineParticipate')}
        </label>
      </div>

      {/* Participant details */}
      <div className="consent-details">
        <div className="consent-field">
          <label htmlFor={`${id}-name`}>{t('nameId')}</label>
          <input
            id={`${id}-name`}
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('fullNameId')}
          />
        </div>

        <div className="consent-field">
          <label htmlFor={`${id}-sig`}>{t('signatureThumb')}</label>
          <input
            id={`${id}-sig`}
            type="text"
            value={form.signature}
            onChange={(e) => setField('signature', e.target.value)}
            placeholder={t('signaturePlaceholder')}
          />
        </div>

        <div className="consent-field">
          <label htmlFor={`${id}-place`}>{t('place')}</label>
          <input
            id={`${id}-place`}
            type="text"
            value={form.place}
            onChange={(e) => setField('place', e.target.value)}
            placeholder={t('location')}
          />
        </div>

        <div className="consent-field">
          <label htmlFor={`${id}-dt`}>{t('dateTime')}</label>
          <input
            id={`${id}-dt`}
            type="text"
            value={form.datetime}
            onChange={(e) => setField('datetime', e.target.value)}
            placeholder="DD/MM/YYYY HH:MM"
          />
        </div>
      </div>

      {/* Confirmation banner */}
      {isRecorded && (
        <div className="consent-confirm">
          <span>
            {saved.agreed
              ? t('consentAgreed')
              : t('consentDeclined')}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── ConsentForm ──────────────────────────────────────────────────────────── */
export default function ConsentForm({ onDone }) {
  const { session, setConsent } = useSession()
  const { t } = useLanguage()
  const profile = session?.profile ?? {}
  const savedConsents = session?.consents ?? {}

  const [c1, setC1] = useState(() => blankForm(profile, savedConsents.C1))
  const [c2, setC2] = useState(() => blankForm(profile, savedConsents.C2))

  // Sync to session whenever a form changes
  const handleC1Change = (form) => {
    setC1(form)
    if (form.agreed !== null) {
      setConsent('C1', {
        agreed: form.agreed,
        name: form.name,
        signature: form.signature,
        place: form.place,
        datetime: form.datetime,
      })
    }
  }

  const handleC2Change = (form) => {
    setC2(form)
    if (form.agreed !== null) {
      setConsent('C2', {
        agreed: form.agreed,
        name: form.name,
        signature: form.signature,
        place: form.place,
        datetime: form.datetime,
      })
    }
  }

  // Continue is enabled once both have an explicit selection
  const canContinue = c1.agreed !== null && c2.agreed !== null

  return (
    <div className="consent-form">
      <ConsentCard
        id="c1"
        tag="C1"
        title={t('consentMentalHealth')}
        clauses={C1_CLAUSES}
        form={c1}
        onChange={handleC1Change}
        saved={savedConsents.C1}
      />

      <ConsentCard
        id="c2"
        tag="C2"
        title={t('consentParticipation')}
        clauses={C2_CLAUSES}
        form={c2}
        onChange={handleC2Change}
        saved={savedConsents.C2}
      />

      <div className="consent-form__footer">
        <button
          type="button"
          className="btn-primary"
          onClick={onDone}
          disabled={!canContinue}
        >
          {t('continue')} <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  )
}
