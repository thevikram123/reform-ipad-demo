import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import questionnaireHi from './data/questionnaire-hi.js'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'reform.language'

const EN = {
  toolkit: 'Assessment & Reintegration Toolkit', correctionalInstrument: 'Correctional Assessment Instrument · Maharashtra',
  caseRegistry: 'Case Registry', registryDescription: 'Risk Evaluation for Offender Reformation & Reintegration Model — structured intake, screening and rehabilitation scoring.',
  beginAssessment: 'Begin new assessment', cancel: 'Cancel', prisonerIdentity: 'Prisoner Identity',
  name: 'Name', prisonerId: 'Prisoner ID', gender: 'Gender', age: 'Age', male: 'Male', female: 'Female', transgender: 'Transgender', other: 'Other',
  location: 'Location', useLocation: 'Use current location', locationUnsupported: 'Geolocation is not supported on this device.',
  gettingLocation: 'Getting current location…', locationSet: 'Location filled automatically', coordinatesCaptured: 'Coordinates captured. Check state and district.',
  locationDenied: 'Location permission denied. Enter the address manually below.', locationFailed: 'Could not get location. Enter the address manually below.',
  state: 'State', district: 'District', city: 'City / Town', pin: 'Pin Code', specificPlace: 'Prison / Place (specific)',
  selectState: 'Select state', selectDistrict: 'Select district', selectStateFirst: 'Select state first', assessedBy: 'Assessed By',
  designation: 'Designation', date: 'Date', time: 'Time', createBegin: 'Create & begin', prisoner: 'Prisoner', id: 'ID',
  status: 'Status', updated: 'Updated', noAssessments: 'No assessments yet. Create one to begin.', unnamed: 'Unnamed',
  submitted: 'Submitted', inProgress: 'In progress', open: 'Open', english: 'English', hindi: 'हिंदी', language: 'Language',
  startPhoto: 'Start Photo', consent: 'Consent', questionnaire: 'Questionnaire', scorecard: 'Scorecard', endPhoto: 'End Photo', submit: 'Submit',
  sections: 'Sections', done: 'Done', partial: 'In progress', todo: 'To do', locked: 'locked', completePrevious: 'Complete the previous section first',
  auditLog: 'Audit log', exportPdf: 'Export PDF report', backRegistry: 'Back to registry', assessedByInline: 'Assessed by',
  reintegrationProgress: 'Reintegration progress', stages: 'stages', assessmentSection: 'Assessment section', group: 'Group', of: 'of', answered: 'answered',
  previous: 'Previous', next: 'Next', reviewAnswers: 'Review answers', answer: 'Answer', response: 'Response', fromIntake: 'from intake',
  carriedFromIntake: 'Carried from the initial intake — edit if needed.', typeResponse: 'Type the response…', rateStatements: 'Rate each statement',
  statementA: 'Statement A', statementB: 'Statement B', reverseScored: 'reverse-scored', select: 'Select', yes: 'Yes', no: 'No',
  notSure: 'Not sure', sometimes: 'Sometimes', stable: 'Stable', unstable: 'Unstable', addNote: 'Add interviewer note',
  noteAdded: 'Interviewer note added', optionalContext: 'Optional context', addContext: 'Add relevant context…',
  reviewYourAnswers: 'Review your answers', questionsAnswered: 'questions answered', question: 'Question', note: 'Note',
  notAnswered: 'not answered', backEdit: 'Back to edit', completeContinue: 'Complete & continue',
  agreeParticipate: 'I agree to participate', declineParticipate: 'I do not agree to participate', nameId: 'Name / ID',
  fullNameId: 'Full name or prisoner ID', signatureThumb: 'Signature / Thumb Impression', signaturePlaceholder: "Signature or 'Thumb'",
  place: 'Place', dateTime: 'Date and Time', consentAgreed: 'Consent recorded — participant agreed.', consentDeclined: 'Consent recorded — participant declined.',
  continue: 'Continue', consentMentalHealth: 'Informed Consent — Mental Health Assessment', consentParticipation: 'Informed Consent for Participation',
  timestamp: 'Timestamp', action: 'Action', detail: 'Detail', section: 'Section', downloadCsv: 'Download CSV', actionsRecorded: 'actions recorded',
  auditDisclaimer: 'Every interviewer action is recorded with date, time, and timezone. Entries cannot be edited or deleted.',
  noAuditEntries: 'No audit entries have been recorded for this session yet.',
}

const HI = {
  toolkit: 'मूल्यांकन एवं पुनर्वास टूलकिट',
  correctionalInstrument: 'सुधारात्मक मूल्यांकन उपकरण · महाराष्ट्र',
  caseRegistry: 'केस रजिस्ट्री',
  registryDescription: 'अपराधी सुधार एवं पुनःएकीकरण हेतु जोखिम मूल्यांकन मॉडल — संरचित प्रवेश, स्क्रीनिंग और पुनर्वास स्कोरिंग।',
  beginAssessment: 'नया मूल्यांकन शुरू करें',
  cancel: 'रद्द करें',
  prisonerIdentity: 'बंदी की पहचान',
  name: 'नाम', prisonerId: 'बंदी आईडी', gender: 'लिंग', age: 'उम्र',
  male: 'पुरुष', female: 'महिला', transgender: 'ट्रांसजेंडर', other: 'अन्य',
  location: 'स्थान', useLocation: 'वर्तमान स्थान का उपयोग करें',
  locationUnsupported: 'इस उपकरण पर स्थान सेवा उपलब्ध नहीं है।',
  gettingLocation: 'वर्तमान स्थान प्राप्त किया जा रहा है…',
  locationSet: 'स्थान भर दिया गया',
  coordinatesCaptured: 'निर्देशांक मिल गए। राज्य और जिला जाँच लें।',
  locationDenied: 'स्थान की अनुमति नहीं मिली। नीचे पता स्वयं भरें।',
  locationFailed: 'स्थान नहीं मिल सका। नीचे पता स्वयं भरें।',
  state: 'राज्य', district: 'जिला', city: 'शहर / नगर', pin: 'पिन कोड',
  specificPlace: 'कारागार / विशिष्ट स्थान', selectState: 'राज्य चुनें',
  selectDistrict: 'जिला चुनें', selectStateFirst: 'पहले राज्य चुनें',
  assessedBy: 'मूल्यांकनकर्ता', designation: 'पदनाम', date: 'तारीख', time: 'समय',
  createBegin: 'बनाएँ और शुरू करें', prisoner: 'बंदी', id: 'आईडी', status: 'स्थिति',
  updated: 'अपडेट', noAssessments: 'अभी कोई मूल्यांकन नहीं है। शुरू करने के लिए नया मूल्यांकन बनाएँ।',
  unnamed: 'नाम रहित', submitted: 'जमा किया गया', inProgress: 'प्रगति में', open: 'खोलें',
  english: 'English', hindi: 'हिंदी', language: 'भाषा',
  startPhoto: 'प्रारंभिक फोटो', consent: 'सहमति', questionnaire: 'प्रश्नावली',
  scorecard: 'स्कोरकार्ड', endPhoto: 'अंतिम फोटो', submit: 'जमा करें',
  sections: 'खंड', done: 'पूर्ण', partial: 'प्रगति में', todo: 'करना है', locked: 'लॉक',
  completePrevious: 'पहले पिछले खंड को पूरा करें', auditLog: 'ऑडिट लॉग',
  exportPdf: 'PDF रिपोर्ट निर्यात करें', backRegistry: 'रजिस्ट्री पर वापस जाएँ',
  assessedByInline: 'मूल्यांकनकर्ता', reintegrationProgress: 'पुनःएकीकरण प्रगति', stages: 'चरण',
  assessmentSection: 'मूल्यांकन खंड', group: 'समूह', of: 'में से', answered: 'उत्तर दिए',
  previous: 'पिछला', next: 'अगला', reviewAnswers: 'उत्तर जाँचें',
  answer: 'उत्तर', response: 'प्रतिक्रिया', fromIntake: 'प्रवेश से',
  carriedFromIntake: 'प्रारंभिक प्रवेश से लिया गया — आवश्यकता हो तो बदलें।',
  typeResponse: 'उत्तर लिखें…', rateStatements: 'दोनों कथनों का उत्तर दें',
  statementA: 'कथन A', statementB: 'कथन B', reverseScored: 'विपरीत स्कोर',
  select: 'चुनें', yes: 'हाँ', no: 'नहीं', notSure: 'पता नहीं', sometimes: 'कभी-कभी',
  stable: 'स्थिर', unstable: 'अस्थिर', addNote: 'साक्षात्कारकर्ता की टिप्पणी जोड़ें',
  noteAdded: 'साक्षात्कारकर्ता की टिप्पणी जोड़ी गई', optionalContext: 'वैकल्पिक संदर्भ',
  addContext: 'संबंधित संदर्भ जोड़ें…', reviewYourAnswers: 'अपने उत्तर जाँचें',
  questionsAnswered: 'प्रश्नों के उत्तर दिए गए', question: 'प्रश्न', note: 'टिप्पणी',
  notAnswered: 'उत्तर नहीं दिया', backEdit: 'संपादन पर वापस जाएँ', completeContinue: 'पूरा करें और आगे बढ़ें',
  agreeParticipate: 'मैं भाग लेने के लिए सहमत हूँ', declineParticipate: 'मैं भाग लेने के लिए सहमत नहीं हूँ', nameId: 'नाम / आईडी',
  fullNameId: 'पूरा नाम या बंदी आईडी', signatureThumb: 'हस्ताक्षर / अंगूठे का निशान', signaturePlaceholder: "हस्ताक्षर या 'अंगूठा'",
  place: 'स्थान', dateTime: 'तारीख और समय', consentAgreed: 'सहमति दर्ज हुई — प्रतिभागी सहमत है।', consentDeclined: 'सहमति दर्ज हुई — प्रतिभागी सहमत नहीं है।',
  continue: 'आगे बढ़ें', consentMentalHealth: 'सूचित सहमति — मानसिक स्वास्थ्य मूल्यांकन', consentParticipation: 'भागीदारी के लिए सूचित सहमति',
  timestamp: 'तारीख और समय', action: 'कार्रवाई', detail: 'विवरण', section: 'खंड', downloadCsv: 'CSV डाउनलोड करें', actionsRecorded: 'कार्रवाइयाँ दर्ज',
  auditDisclaimer: 'साक्षात्कारकर्ता की हर कार्रवाई तारीख, समय और समय क्षेत्र के साथ दर्ज होती है। प्रविष्टियाँ बदली या हटाई नहीं जा सकतीं।',
  noAuditEntries: 'इस सत्र के लिए अभी कोई ऑडिट प्रविष्टि दर्ज नहीं हुई है।',
}

const CONTENT_HI = {
  ...questionnaireHi,
  'Socio-Demographic & Historic Data': 'सामाजिक-जनसांख्यिकीय एवं ऐतिहासिक जानकारी',
  'Offence Severity & Modality': 'अपराध की गंभीरता एवं प्रकार',
  'Informed Consent': 'सूचित सहमति',
  'Pre-Assessment Mental Health Screening': 'पूर्व-मूल्यांकन मानसिक स्वास्थ्य स्क्रीनिंग',
  'Background Information': 'पृष्ठभूमि जानकारी',
  'Criminal Potential Score': 'आपराधिक प्रवृत्ति स्कोर',
  'Response Reliability Index (RRI)': 'प्रतिक्रिया विश्वसनीयता सूचकांक (RRI)',
  'Protective Factor Index': 'संरक्षण कारक सूचकांक',
  'Rehabilitation Scorecard & Decision': 'पुनर्वास स्कोरकार्ड एवं निर्णय',
  'Yes': 'हाँ', 'No': 'नहीं', 'Not sure': 'पता नहीं', 'Sometimes': 'कभी-कभी',
  'Select': 'चुनें', 'Stable': 'स्थिर', 'Unstable': 'अस्थिर',
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key) => (language === 'hi' ? HI : EN)[key] || EN[key] || key,
    tr: (text) => language === 'hi' ? (CONTENT_HI[text] || text) : text,
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div className="language-toggle" role="group" aria-label={t('language')}>
      <button type="button" className={language === 'en' ? 'is-active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
      <button type="button" className={language === 'hi' ? 'is-active' : ''} aria-pressed={language === 'hi'} onClick={() => setLanguage('hi')}>हिंदी</button>
    </div>
  )
}
