import { useSession } from '../context/SessionContext'
import { sections, sectionStats, CONSENT_SECTION_ID, SCORECARD_SECTION_ID } from '../data/questions'
import Icon from '../components/Icon'
import '../components/admin.css'
import { useLanguage } from '../i18n.jsx'

// Sections to include in the coverage summary (skip C and I per spec)
const SUMMARY_SECTIONS = sections.filter(
  (s) => s.id !== CONSENT_SECTION_ID && s.id !== SCORECARD_SECTION_ID
)

function CoverageChip({ section, answers }) {
  const { total, answered } = sectionStats(section, answers)
  const pct = total === 0 ? 100 : Math.round((answered / total) * 100)
  const cls =
    pct === 100 ? 'chip chip-done' : pct > 0 ? 'chip chip-partial' : 'chip chip-empty'
  return (
    <span className={cls} title={`${section.title} — ${answered}/${total} answered`}>
      <span className="chip-section-id">{section.id}</span>
      {total > 0 ? ` ${answered}/${total}` : ' —'}
    </span>
  )
}

export default function Scorecard({ onDone }) {
  const { session, updateScorecard } = useSession()
  const { language } = useLanguage()
  const L = (english, hindi) => language === 'hi' ? hindi : english
  if (!session) return null

  const sc = session.scorecard || {}
  const answers = session.answers || {}
  const profile = session.profile || {}

  function handle(field) {
    return (e) => updateScorecard({ [field]: e.target.value })
  }

  return (
    <div className="scorecard-wrapper">
      {/* Header */}
      <div className="scorecard-header">
        <span className="section-pill">{L('Section I', 'खंड I')}</span>
        <h1>{L('Individual Rehabilitation Scorecard & Decision Form', 'व्यक्तिगत पुनर्वास स्कोरकार्ड और निर्णय प्रपत्र')}</h1>
      </div>

      {/* Coverage summary — read-only chips */}
      <div className="coverage-row">
        <span className="coverage-row-label">{L('Section coverage:', 'खंडों की प्रगति:')}</span>
        {SUMMARY_SECTIONS.map((sec) => (
          <CoverageChip key={sec.id} section={sec} answers={answers} />
        ))}
      </div>

      {/* ── Risk &amp; Potential ────────────────────────────────────── */}
      <fieldset className="sc-fieldset">
        <legend>{L('Risk & Criminal Potential', 'जोखिम और आपराधिक प्रवृत्ति')}</legend>
        <div className="sc-grid">
          <div className="sc-field">
            <label htmlFor="sc-risk-level">{L('Overall Risk Level', 'कुल जोखिम स्तर')}</label>
            <select
              id="sc-risk-level"
              value={sc.riskLevel || ''}
              onChange={handle('riskLevel')}
            >
              <option value="">— Select —</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-criminal-potential">{L('Criminal Potential (static / dynamic)', 'आपराधिक प्रवृत्ति (स्थिर / बदलने योग्य)')}</label>
            <input
              id="sc-criminal-potential"
              type="text"
              placeholder="e.g. Static 12 / Dynamic 8"
              value={sc.criminalPotential || ''}
              onChange={handle('criminalPotential')}
            />
          </div>
        </div>
      </fieldset>

      {/* ── Protective &amp; Reliability ───────────────────────────── */}
      <fieldset className="sc-fieldset">
        <legend>{L('Protective Factors & Response Reliability', 'सुरक्षा कारक और जवाबों की विश्वसनीयता')}</legend>
        <div className="sc-grid">
          <div className="sc-field">
            <label htmlFor="sc-protective">{L('Protective Factor Strength', 'सुरक्षा कारकों की मज़बूती')}</label>
            <select
              id="sc-protective"
              value={sc.protectiveStrength || ''}
              onChange={handle('protectiveStrength')}
            >
              <option value="">— Select —</option>
              <option value="Weak">Weak</option>
              <option value="Moderate">Moderate</option>
              <option value="Strong">Strong</option>
            </select>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-reliability">{L('Response Reliability / Validity Concern', 'जवाबों की विश्वसनीयता / चिंता')}</label>
            <select
              id="sc-reliability"
              value={sc.reliabilityConcern || ''}
              onChange={handle('reliabilityConcern')}
            >
              <option value="">— Select —</option>
              <option value="None">None</option>
              <option value="Some">Some</option>
              <option value="Significant">Significant</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Pathway &amp; Readiness ────────────────────────────────── */}
      <fieldset className="sc-fieldset">
        <legend>{L('Rehabilitation Pathway & Readiness', 'पुनर्वास का रास्ता और तैयारी')}</legend>
        <div className="sc-grid">
          <div className="sc-field">
            <label htmlFor="sc-pathway">{L('Recommended Pathway', 'सुझाया गया रास्ता')}</label>
            <select
              id="sc-pathway"
              value={sc.recommendedPathway || ''}
              onChange={handle('recommendedPathway')}
            >
              <option value="">— Select —</option>
              <option value="Standard rehabilitation">Standard rehabilitation</option>
              <option value="Intensive intervention">Intensive intervention</option>
              <option value="Mental health referral">Mental health referral</option>
              <option value="Close supervision">Close supervision</option>
            </select>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-readiness">{L('Reintegration Readiness', 'समाज में दोबारा जुड़ने की तैयारी')}</label>
            <select
              id="sc-readiness"
              value={sc.reintegrationReadiness || ''}
              onChange={handle('reintegrationReadiness')}
            >
              <option value="">— Select —</option>
              <option value="Not ready">Not ready</option>
              <option value="Developing">Developing</option>
              <option value="Ready">Ready</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Clinical narratives ───────────────────────────────────── */}
      <fieldset className="sc-fieldset">
        <legend>{L('Clinical Summary & Narrative', 'विशेषज्ञ का सार और विवरण')}</legend>
        <div className="sc-grid">
          <div className="sc-field span-2">
            <label htmlFor="sc-summary">{L('Assessor Clinical Summary', 'मूल्यांकनकर्ता का क्लिनिकल सार')}</label>
            <textarea
              id="sc-summary"
              className="tall"
              placeholder="Summarise key clinical observations and interview findings…"
              value={sc.clinicalSummary || ''}
              onChange={handle('clinicalSummary')}
            />
          </div>

          <div className="sc-field span-2">
            <label htmlFor="sc-recommendations">{L('Recommendations & Next Steps', 'सुझाव और अगले कदम')}</label>
            <textarea
              id="sc-recommendations"
              placeholder="Specific programmes, referrals, conditions, timelines…"
              value={sc.recommendations || ''}
              onChange={handle('recommendations')}
            />
          </div>

          <div className="sc-field span-2">
            <label htmlFor="sc-decision">{L('Decision / Disposition', 'निर्णय / व्यवस्था')}</label>
            <textarea
              id="sc-decision"
              placeholder="Formal decision and any conditions attached…"
              value={sc.decision || ''}
              onChange={handle('decision')}
            />
          </div>
        </div>
      </fieldset>

      {/* ── Assessor sign-off ─────────────────────────────────────── */}
      <fieldset className="sc-fieldset">
        <legend>{L('Assessor Sign-off', 'मूल्यांकनकर्ता की पुष्टि')}</legend>
        <div className="sc-grid">
          <div className="sc-field">
            <label htmlFor="sc-assessor-name">{L('Assessor Name', 'मूल्यांकनकर्ता का नाम')}</label>
            <input
              id="sc-assessor-name"
              type="text"
              value={sc.assessorName ?? (profile.assessedBy || '')}
              onChange={handle('assessorName')}
            />
          </div>

          <div className="sc-field">
            <label htmlFor="sc-assessor-date">{L('Date of Assessment', 'मूल्यांकन की तारीख')}</label>
            <input
              id="sc-assessor-date"
              type="date"
              value={sc.assessorDate ?? (profile.date || '')}
              onChange={handle('assessorDate')}
            />
          </div>
        </div>
      </fieldset>

      {/* Save bar */}
      <div className="scorecard-save-bar">
        <button className="btn-primary" onClick={onDone}>
          {L('Save & continue', 'सहेजें और आगे बढ़ें')} <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  )
}
