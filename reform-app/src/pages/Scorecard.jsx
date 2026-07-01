import { useSession } from '../context/SessionContext'
import { sections, sectionStats, CONSENT_SECTION_ID, SCORECARD_SECTION_ID } from '../data/questions'
import Icon from '../components/Icon'
import '../components/admin.css'
import { useLanguage } from '../i18n.jsx'

// Sections to include in the coverage summary (skip C and I per spec)
const SUMMARY_SECTIONS = sections.filter(
  (s) => s.id !== CONSENT_SECTION_ID && s.id !== SCORECARD_SECTION_ID
)

const TAMIL = {
  'Section I': 'பிரிவு I',
  'Individual Rehabilitation Scorecard & Decision Form': 'தனிநபர் மறுவாழ்வு மதிப்பெண் அட்டை மற்றும் முடிவுப் படிவம்',
  'Section coverage:': 'பிரிவு நிறைவு:',
  'Risk & Criminal Potential': 'ஆபத்து மற்றும் குற்றச் சாத்தியம்',
  'Overall Risk Level': 'ஒட்டுமொத்த ஆபத்து நிலை',
  'Criminal Potential (static / dynamic)': 'குற்றச் சாத்தியம் (மாறாத / மாற்றக்கூடிய)',
  'Protective Factors & Response Reliability': 'பாதுகாப்புக் காரணிகள் மற்றும் பதில் நம்பகத்தன்மை',
  'Protective Factor Strength': 'பாதுகாப்புக் காரணிகளின் வலிமை',
  'Response Reliability / Validity Concern': 'பதில் நம்பகத்தன்மை / செல்லுபடியாகுமா என்ற கவலை',
  'Rehabilitation Pathway & Readiness': 'மறுவாழ்வுப் பாதை மற்றும் தயார்நிலை',
  'Recommended Pathway': 'பரிந்துரைக்கப்படும் பாதை',
  'Reintegration Readiness': 'சமூகத்தில் மீண்டும் இணையத் தயார்நிலை',
  'Clinical Summary & Narrative': 'மருத்துவச் சுருக்கம் மற்றும் விவரம்',
  'Assessor Clinical Summary': 'மதிப்பீட்டாளரின் மருத்துவச் சுருக்கம்',
  'Recommendations & Next Steps': 'பரிந்துரைகள் மற்றும் அடுத்த நடவடிக்கைகள்',
  'Decision / Disposition': 'முடிவு / தீர்மானம்',
  'Assessor Sign-off': 'மதிப்பீட்டாளர் உறுதிப்படுத்தல்',
  'Assessor Name': 'மதிப்பீட்டாளர் பெயர்',
  'Date of Assessment': 'மதிப்பீட்டு தேதி',
  'Save & continue': 'சேமித்து தொடரவும்',
  '— Select —': '— தேர்ந்தெடுக்கவும் —', Low: 'குறைவு', Moderate: 'மிதமானது', High: 'அதிகம்', 'Very High': 'மிக அதிகம்',
  Weak: 'குறைவு', Strong: 'வலுவானது', None: 'எதுவுமில்லை', Some: 'சிறிதளவு', Significant: 'குறிப்பிடத்தக்கது',
  'Standard rehabilitation': 'வழக்கமான மறுவாழ்வு', 'Intensive intervention': 'தீவிரத் தலையீடு', 'Mental health referral': 'மனநலப் பரிந்துரை', 'Close supervision': 'நெருக்கமான கண்காணிப்பு',
  'Not ready': 'தயாராக இல்லை', Developing: 'முன்னேறுகிறது', Ready: 'தயார்',
  'e.g. Static 12 / Dynamic 8': 'எ.கா. மாறாதது 12 / மாற்றக்கூடியது 8',
  'Summarise key clinical observations and interview findings…': 'முக்கிய மருத்துவக் கவனிப்புகள் மற்றும் நேர்காணல் கண்டறிதல்களைச் சுருக்கவும்…',
  'Specific programmes, referrals, conditions, timelines…': 'குறிப்பிட்ட திட்டங்கள், பரிந்துரைகள், நிபந்தனைகள், காலக்கெடுகள்…',
  'Formal decision and any conditions attached…': 'அதிகாரப்பூர்வ முடிவும் அதனுடன் இணைந்த நிபந்தனைகளும்…',
}

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
  const L = (english, hindi) => language === 'hi' ? hindi : language === 'ta' ? (TAMIL[english] || english) : english
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
              <option value="">{L('— Select —', '— चुनें —')}</option>
              <option value="Low">{L('Low', 'कम')}</option>
              <option value="Moderate">{L('Moderate', 'मध्यम')}</option>
              <option value="High">{L('High', 'उच्च')}</option>
              <option value="Very High">{L('Very High', 'बहुत उच्च')}</option>
            </select>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-criminal-potential">{L('Criminal Potential (static / dynamic)', 'आपराधिक प्रवृत्ति (स्थिर / बदलने योग्य)')}</label>
            <input
              id="sc-criminal-potential"
              type="text"
              placeholder={L('e.g. Static 12 / Dynamic 8', 'उदा. स्थिर 12 / परिवर्तनशील 8')}
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
              <option value="">{L('— Select —', '— चुनें —')}</option>
              <option value="Weak">{L('Weak', 'कमज़ोर')}</option>
              <option value="Moderate">{L('Moderate', 'मध्यम')}</option>
              <option value="Strong">{L('Strong', 'मज़बूत')}</option>
            </select>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-reliability">{L('Response Reliability / Validity Concern', 'जवाबों की विश्वसनीयता / चिंता')}</label>
            <select
              id="sc-reliability"
              value={sc.reliabilityConcern || ''}
              onChange={handle('reliabilityConcern')}
            >
              <option value="">{L('— Select —', '— चुनें —')}</option>
              <option value="None">{L('None', 'कोई नहीं')}</option>
              <option value="Some">{L('Some', 'कुछ')}</option>
              <option value="Significant">{L('Significant', 'महत्वपूर्ण')}</option>
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
              <option value="">{L('— Select —', '— चुनें —')}</option>
              <option value="Standard rehabilitation">{L('Standard rehabilitation', 'मानक पुनर्वास')}</option>
              <option value="Intensive intervention">{L('Intensive intervention', 'गहन हस्तक्षेप')}</option>
              <option value="Mental health referral">{L('Mental health referral', 'मानसिक स्वास्थ्य रेफरल')}</option>
              <option value="Close supervision">{L('Close supervision', 'कड़ी निगरानी')}</option>
            </select>
          </div>

          <div className="sc-field">
            <label htmlFor="sc-readiness">{L('Reintegration Readiness', 'समाज में दोबारा जुड़ने की तैयारी')}</label>
            <select
              id="sc-readiness"
              value={sc.reintegrationReadiness || ''}
              onChange={handle('reintegrationReadiness')}
            >
              <option value="">{L('— Select —', '— चुनें —')}</option>
              <option value="Not ready">{L('Not ready', 'तैयार नहीं')}</option>
              <option value="Developing">{L('Developing', 'विकसित हो रहा है')}</option>
              <option value="Ready">{L('Ready', 'तैयार')}</option>
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
              placeholder={L('Summarise key clinical observations and interview findings…', 'मुख्य नैदानिक टिप्पणियों और साक्षात्कार निष्कर्षों का सार लिखें…')}
              value={sc.clinicalSummary || ''}
              onChange={handle('clinicalSummary')}
            />
          </div>

          <div className="sc-field span-2">
            <label htmlFor="sc-recommendations">{L('Recommendations & Next Steps', 'सुझाव और अगले कदम')}</label>
            <textarea
              id="sc-recommendations"
              placeholder={L('Specific programmes, referrals, conditions, timelines…', 'विशिष्ट कार्यक्रम, रेफरल, शर्तें और समय-सीमा…')}
              value={sc.recommendations || ''}
              onChange={handle('recommendations')}
            />
          </div>

          <div className="sc-field span-2">
            <label htmlFor="sc-decision">{L('Decision / Disposition', 'निर्णय / व्यवस्था')}</label>
            <textarea
              id="sc-decision"
              placeholder={L('Formal decision and any conditions attached…', 'औपचारिक निर्णय और उससे जुड़ी शर्तें…')}
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
