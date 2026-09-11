import { useState } from 'react'
import { useSession } from '../context/SessionContext'
import Icon from '../components/Icon'
import '../components/admin.css'
import { useLanguage } from '../i18n.jsx'

const ROLE_COPY = {
  'Stage 1 of 3': ['चरण 1 / 3', 'நிலை 1 / 3'], 'Stage 2 of 3': ['चरण 2 / 3', 'நிலை 2 / 3'], 'Stage 3 of 3': ['चरण 3 / 3', 'நிலை 3 / 3'],
  'Nodal Officer Rehabilitation Entry': ['नोडल अधिकारी पुनर्वास प्रविष्टि', 'ஒருங்கிணைப்பு அலுவலர் மறுவாழ்வு பதிவு'],
  'Review the frozen assessment and record rehabilitation tiers, reliability, pathway and readiness. Assessor answers remain unchanged.': ['स्थिर किए गए मूल्यांकन की समीक्षा करें और पुनर्वास स्तर, विश्वसनीयता, मार्ग तथा तैयारी दर्ज करें। मूल्यांकनकर्ता के उत्तर अपरिवर्तित रहेंगे।', 'பூட்டப்பட்ட மதிப்பீட்டை ஆய்வு செய்து மறுவாழ்வு நிலை, நம்பகத்தன்மை, பாதை மற்றும் தயார்நிலையைப் பதிவு செய்யவும். மதிப்பீட்டாளர் பதில்கள் மாறாது.'],
  'Prior stage locked': ['पिछला चरण स्थिर है', 'முந்தைய நிலை பூட்டப்பட்டது'],
  'Risk, Potential and Reliability': ['जोखिम, क्षमता और विश्वसनीयता', 'ஆபத்து, சாத்தியம் மற்றும் நம்பகத்தன்மை'],
  'Overall Risk Level': ['कुल जोखिम स्तर', 'மொத்த ஆபத்து நிலை'], 'Criminal Potential': ['आपराधिक क्षमता', 'குற்றச் சாத்தியம்'],
  'RRI / Reliability Concern': ['RRI / विश्वसनीयता संबंधी चिंता', 'RRI / நம்பகத்தன்மை கவலை'],
  'Protective Factors and Rehabilitation Tier': ['सुरक्षात्मक कारक और पुनर्वास स्तर', 'பாதுகாப்புக் காரணிகள் மற்றும் மறுவாழ்வு நிலை'],
  'Protective Factor Strength': ['सुरक्षात्मक कारकों की मजबूती', 'பாதுகாப்புக் காரணிகளின் வலிமை'],
  'Recommended Rehabilitation Pathway': ['अनुशंसित पुनर्वास मार्ग', 'பரிந்துரைக்கப்பட்ட மறுவாழ்வு பாதை'],
  'Reintegration Readiness': ['पुनः एकीकरण की तैयारी', 'மீள் ஒருங்கிணைப்பு தயார்நிலை'],
  'Nodal Officer Assessment': ['नोडल अधिकारी मूल्यांकन', 'ஒருங்கிணைப்பு அலுவலர் மதிப்பீடு'],
  'Clinical Summary and Observations': ['क्लिनिकल सारांश और अवलोकन', 'மருத்துவச் சுருக்கம் மற்றும் கவனிப்புகள்'],
  'Recommendations and Next Steps': ['अनुशंसाएँ और अगले कदम', 'பரிந்துரைகள் மற்றும் அடுத்த படிகள்'],
  'Nodal Officer Decision / Disposition': ['नोडल अधिकारी निर्णय / निस्तारण', 'ஒருங்கிணைப்பு அலுவலர் முடிவு'],
  'Declaration and sign-off': ['घोषणा और हस्ताक्षर', 'உறுதிமொழி மற்றும் கையொப்பம்'],
  'I certify that this entry reflects my independent review of the assessment record and supporting evidence.': ['मैं प्रमाणित करता/करती हूँ कि यह प्रविष्टि मूल्यांकन अभिलेख और सहायक साक्ष्यों की मेरी स्वतंत्र समीक्षा को दर्शाती है।', 'இந்தப் பதிவு மதிப்பீட்டு ஆவணம் மற்றும் ஆதாரங்களின் எனது சுயாதீன ஆய்வை பிரதிபலிக்கிறது என உறுதிப்படுத்துகிறேன்.'],
  'I confirm this declaration': ['मैं इस घोषणा की पुष्टि करता/करती हूँ', 'இந்த உறுதிமொழியை உறுதிப்படுத்துகிறேன்'],
  'Name': ['नाम', 'பெயர்'], 'Signature / Thumb Impression': ['हस्ताक्षर / अंगूठे का निशान', 'கையொப்பம் / பெருவிரல் ரேகை'], 'Date': ['तारीख', 'தேதி'],
  'Nodal Officer': ['नोडल अधिकारी', 'ஒருங்கிணைப்பு அலுவலர்'], 'Submit to Home Department': ['गृह विभाग को जमा करें', 'உள்துறைக்கு சமர்ப்பிக்கவும்'],
  'This freezes the Nodal Officer entry and sends the record to the Home Department.': ['यह नोडल अधिकारी की प्रविष्टि स्थिर करके अभिलेख गृह विभाग को भेजता है।', 'இது ஒருங்கிணைப்பு அலுவலர் பதிவைப் பூட்டி உள்துறைக்கு அனுப்பும்.'],
  'Low': ['कम', 'குறைவு'], 'Moderate': ['मध्यम', 'மிதமானது'], 'High': ['उच्च', 'அதிகம்'], 'Very High': ['बहुत उच्च', 'மிக அதிகம்'],
  'Weak': ['कमज़ोर', 'பலவீனம்'], 'Strong': ['मज़बूत', 'வலுவானது'], 'None': ['कोई नहीं', 'எதுவுமில்லை'], 'Some': ['कुछ', 'சில'], 'Significant': ['महत्वपूर्ण', 'குறிப்பிடத்தக்கது'],
  'Not ready': ['तैयार नहीं', 'தயாராக இல்லை'], 'Developing': ['विकसित हो रहा है', 'முன்னேறுகிறது'], 'Ready': ['तैयार', 'தயார்'],
  'Standard rehabilitation': ['मानक पुनर्वास', 'நிலையான மறுவாழ்வு'], 'Intensive intervention': ['गहन हस्तक्षेप', 'தீவிரத் தலையீடு'],
  'Mental health referral': ['मानसिक स्वास्थ्य रेफरल', 'மனநலப் பரிந்துரை'], 'Close supervision': ['कड़ी निगरानी', 'நெருக்கமான கண்காணிப்பு'],
  'Home Department Release Decision': ['गृह विभाग का रिहाई निर्णय', 'உள்துறையின் விடுதலை முடிவு'],
  'The assessor record and Nodal Officer rehabilitation entry are locked. Complete the release classification and final departmental sign-off.': ['मूल्यांकनकर्ता का अभिलेख और नोडल अधिकारी की पुनर्वास प्रविष्टि स्थिर हैं। रिहाई वर्गीकरण और अंतिम विभागीय अनुमोदन पूरा करें।', 'மதிப்பீட்டாளர் பதிவு மற்றும் ஒருங்கிணைப்பு அலுவலரின் மறுவாழ்வு பதிவு பூட்டப்பட்டுள்ளன. விடுதலை வகைப்பாட்டையும் இறுதித் துறை ஒப்புதலையும் நிறைவு செய்யவும்.'],
  'Nodal rehabilitation pathway': ['नोडल अधिकारी द्वारा तय पुनर्वास मार्ग', 'ஒருங்கிணைப்பு அலுவலரின் மறுவாழ்வு பாதை'], 'Readiness': ['तैयारी', 'தயார்நிலை'], 'Not recorded': ['दर्ज नहीं', 'பதிவு செய்யப்படவில்லை'],
  'Release Suitability Classification (CPS × PFI × RRI × ASPIRE)': ['रिहाई उपयुक्तता वर्गीकरण (CPS × PFI × RRI × ASPIRE)', 'விடுதலைத் தகுதி வகைப்பாடு (CPS × PFI × RRI × ASPIRE)'],
  'CPS Risk and Range': ['CPS जोखिम और श्रेणी', 'CPS ஆபத்து மற்றும் வரம்பு'], 'Release Decision': ['रिहाई निर्णय', 'விடுதலை முடிவு'],
  'Select CPS, ASPIRE and PFI to calculate the decision': ['निर्णय की गणना के लिए CPS, ASPIRE और PFI चुनें', 'முடிவைக் கணக்கிட CPS, ASPIRE மற்றும் PFI-ஐத் தேர்ந்தெடுக்கவும்'],
  'Home Department Remarks / Conditions': ['गृह विभाग की टिप्पणी / शर्तें', 'உள்துறை குறிப்புகள் / நிபந்தனைகள்'],
  'Final submission permanently closes the assessment for every role.': ['अंतिम जमा करने के बाद मूल्यांकन सभी भूमिकाओं के लिए स्थायी रूप से बंद हो जाएगा।', 'இறுதிச் சமர்ப்பிப்புக்குப் பிறகு மதிப்பீடு அனைத்து பொறுப்புகளுக்கும் நிரந்தரமாக மூடப்படும்.'],
  'Submit Final Release Decision': ['अंतिम रिहाई निर्णय जमा करें', 'இறுதி விடுதலை முடிவைச் சமர்ப்பிக்கவும்'],
  'Assessor Declaration': ['मूल्यांकनकर्ता की घोषणा', 'மதிப்பீட்டாளர் உறுதிமொழி'],
  'I declare that I conducted this assessment, recorded the prisoner’s responses accurately, and captured the required photographs and signed consent documents. I understand that submission freezes the complete assessment record.': ['मैं घोषणा करता/करती हूँ कि मैंने यह मूल्यांकन किया, बंदी के उत्तर सही ढंग से दर्ज किए और आवश्यक फोटो तथा हस्ताक्षरित सहमति दस्तावेज़ कैप्चर किए। मैं समझता/समझती हूँ कि जमा करने के बाद पूरा मूल्यांकन अभिलेख स्थिर हो जाएगा।', 'இந்த மதிப்பீட்டை நான் மேற்கொண்டு, கைதியின் பதில்களைத் துல்லியமாகப் பதிவு செய்து, தேவையான புகைப்படங்களையும் கையொப்பமிட்ட ஒப்புதல் ஆவணங்களையும் பதிவு செய்தேன் என உறுதியளிக்கிறேன். சமர்ப்பித்தவுடன் முழு மதிப்பீட்டு பதிவும் பூட்டப்படும் என்பதை புரிந்துகொள்கிறேன்.'],
  'I confirm that the assessment is complete and accurate.': ['मैं पुष्टि करता/करती हूँ कि मूल्यांकन पूर्ण और सही है।', 'மதிப்பீடு முழுமையானதும் துல்லியமானதும் என்பதை உறுதிப்படுத்துகிறேன்.'],
  'Assessor Name': ['मूल्यांकनकर्ता का नाम', 'மதிப்பீட்டாளர் பெயர்'], 'Enter signature mark': ['हस्ताक्षर दर्ज करें', 'கையொப்பத்தை உள்ளிடவும்'],
}
export const localize = (text, language) => language === 'hi' ? (ROLE_COPY[text]?.[0] || text) : language === 'ta' ? (ROLE_COPY[text]?.[1] || text) : text

export default function NodalDecision({ canSubmit }) {
  const { session, submitNodal } = useSession()
  const { language } = useLanguage()
  const L = (text) => localize(text, language)
  const saved = session.nodalEntry || {}
  const [form, setForm] = useState(() => ({
    riskLevel: '', criminalPotential: '', reliabilityConcern: '', protectiveStrength: '',
    recommendedPathway: '', reintegrationReadiness: '', clinicalSummary: '', recommendations: '',
    nodalDecision: '', nodalName: '', nodalSignature: '', nodalDate: new Date().toISOString().slice(0, 10),
    declarationAccepted: false, ...saved,
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const required = form.recommendedPathway && form.reintegrationReadiness && form.nodalSignature && form.declarationAccepted

  const submit = async () => {
    setBusy(true); setError('')
    try { await submitNodal(form) }
    catch (e) { setError(e.message || 'Nodal submission failed') }
    finally { setBusy(false) }
  }

  return <div className="role-entry nodal-entry">
    <RoleHeader eyebrow="Stage 2 of 3" title="Nodal Officer Rehabilitation Entry" text="Review the frozen assessment and record rehabilitation tiers, reliability, pathway and readiness. Assessor answers remain unchanged." />
    <section className="role-form-card">
      <FormHeading number="01" title="Risk, Potential and Reliability" />
      <div className="decision-fields three-col">
        <Select label="Overall Risk Level" value={form.riskLevel} options={['Low','Moderate','High','Very High']} onChange={set('riskLevel')} disabled={!canSubmit} />
        <label>{L('Criminal Potential')}<input value={form.criminalPotential} onChange={set('criminalPotential')} disabled={!canSubmit} placeholder="Static / dynamic assessment" /></label>
        <Select label="RRI / Reliability Concern" value={form.reliabilityConcern} options={['None','Some','Significant']} onChange={set('reliabilityConcern')} disabled={!canSubmit} />
      </div>
      <FormHeading number="02" title="Protective Factors and Rehabilitation Tier" />
      <div className="decision-fields three-col">
        <Select label="Protective Factor Strength" value={form.protectiveStrength} options={['Weak','Moderate','Strong']} onChange={set('protectiveStrength')} disabled={!canSubmit} />
        <Select label="Recommended Rehabilitation Pathway" value={form.recommendedPathway} options={['Standard rehabilitation','Intensive intervention','Mental health referral','Close supervision']} onChange={set('recommendedPathway')} disabled={!canSubmit} />
        <Select label="Reintegration Readiness" value={form.reintegrationReadiness} options={['Not ready','Developing','Ready']} onChange={set('reintegrationReadiness')} disabled={!canSubmit} />
      </div>
      <FormHeading number="03" title="Nodal Officer Assessment" />
      <div className="decision-narratives">
        <label>{L('Clinical Summary and Observations')}<textarea value={form.clinicalSummary} onChange={set('clinicalSummary')} disabled={!canSubmit} /></label>
        <label>{L('Recommendations and Next Steps')}<textarea value={form.recommendations} onChange={set('recommendations')} disabled={!canSubmit} /></label>
        <label className="span-2">{L('Nodal Officer Decision / Disposition')}<textarea value={form.nodalDecision} onChange={set('nodalDecision')} disabled={!canSubmit} /></label>
      </div>
      <DeclarationBlock role="Nodal Officer" form={form} set={set} disabled={!canSubmit} />
      {error && <p className="submit-warning">{error}</p>}
      {canSubmit && <SubmitRow text="This freezes the Nodal Officer entry and sends the record to the Home Department." disabled={!required || busy} onClick={submit} label={busy ? 'Submitting…' : 'Submit to Home Department'} />}
    </section>
  </div>
}

export function RoleHeader({ eyebrow, title, text }) {
  const { language } = useLanguage(); const L = (value) => localize(value, language)
  return <header className="nodal-review-head"><div><span className="section-pill">{L(eyebrow)}</span><h1>{L(title)}</h1><p>{L(text)}</p></div><span className="review-lock"><Icon name="lock" size={15} /> {L('Prior stage locked')}</span></header>
}
export function FormHeading({ number, title }) { const { language } = useLanguage(); return <div className="role-form-heading"><span>{number}</span><strong>{localize(title, language)}</strong></div> }
export function Select({ label, value, options, onChange, disabled }) { const { language } = useLanguage(); return <label>{localize(label, language)}<select value={value} onChange={onChange} disabled={disabled}><option value="">— Select —</option>{options.map((option) => <option key={option} value={option}>{localize(option, language)}</option>)}</select></label> }
export function DeclarationBlock({ role, form, set, disabled, prefixes = ['nodal'] }) {
  const { language } = useLanguage(); const L = (value) => localize(value, language)
  return <div className="declaration-block"><div><span className="eyebrow">{L('Declaration and sign-off')}</span><p>{L('I certify that this entry reflects my independent review of the assessment record and supporting evidence.')}</p><label className="declaration-check"><input type="checkbox" checked={!!form.declarationAccepted} onChange={set('declarationAccepted')} disabled={disabled} /> {L('I confirm this declaration')}</label></div><div className="signature-grid">{prefixes.map((prefix) => <div className="signature-person" key={prefix}><strong>{prefix === 'nodal' ? L(role) : prefix.toUpperCase()}</strong><label>{L('Name')}<input value={form[`${prefix}Name`] || ''} onChange={set(`${prefix}Name`)} disabled={disabled} /></label><label>{L('Signature / Thumb Impression')}<input value={form[`${prefix}Signature`] || ''} onChange={set(`${prefix}Signature`)} disabled={disabled} /></label><label>{L('Date')}<input type="date" value={form[`${prefix}Date`] || ''} onChange={set(`${prefix}Date`)} disabled={disabled} /></label></div>)}</div></div>
}
export function SubmitRow({ text, disabled, onClick, label }) { const { language } = useLanguage(); return <div className="nodal-submit-row"><p>{localize(text, language)}</p><button className="btn-accent" disabled={disabled} onClick={onClick}>{localize(label, language)} <Icon name="arrow-right" /></button></div> }
