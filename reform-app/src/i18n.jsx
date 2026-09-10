import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import questionnaireHi from './data/questionnaire-hi.js'
import questionnaireTa from './data/questionnaire-ta.js'

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
  submitted: 'Submitted', inProgress: 'In progress', open: 'Open', english: 'English', hindi: 'हिंदी', tamil: 'தமிழ்', language: 'Language',
  startPhoto: 'Start Photo', consent: 'Consent', questionnaire: 'Questionnaire', scorecard: 'Scorecard', endPhoto: 'End Photo', signedConsentCopy: 'Signed Consent Copy', submit: 'Submit',
  prisonerRole: 'Prisoner', assessorRole: 'Assessor', prisonerStartPhoto: 'Prisoner - Start Photo', assessorStartPhoto: 'Assessor - Start Photo',
  prisonerEndPhoto: 'Prisoner - End Photo', assessorEndPhoto: 'Assessor - End Photo', captureBothStart: 'Capture both people at the beginning of the assessment. Each photo is camera-only.',
  captureBothEnd: 'Capture both people at the end of the assessment. Each photo is camera-only.', bothStartCaptured: 'Prisoner and assessor start photos captured.',
  bothEndCaptured: 'Prisoner and assessor end photos captured.', proceedConsent: 'Proceed to consent', proceedConsentCopy: 'Proceed to consent copy',
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
  scorecard: 'स्कोरकार्ड', endPhoto: 'अंतिम फोटो', signedConsentCopy: 'हस्ताक्षरित सहमति प्रति', submit: 'जमा करें',
  prisonerRole: 'बंदी', assessorRole: 'मूल्यांकनकर्ता', prisonerStartPhoto: 'बंदी - प्रारंभिक फोटो', assessorStartPhoto: 'मूल्यांकनकर्ता - प्रारंभिक फोटो',
  prisonerEndPhoto: 'बंदी - अंतिम फोटो', assessorEndPhoto: 'मूल्यांकनकर्ता - अंतिम फोटो', captureBothStart: 'मूल्यांकन की शुरुआत में बंदी और मूल्यांकनकर्ता, दोनों की कैमरे से फोटो लें।',
  captureBothEnd: 'मूल्यांकन के अंत में बंदी और मूल्यांकनकर्ता, दोनों की कैमरे से फोटो लें।', bothStartCaptured: 'बंदी और मूल्यांकनकर्ता की प्रारंभिक फोटो ली गईं।',
  bothEndCaptured: 'बंदी और मूल्यांकनकर्ता की अंतिम फोटो ली गईं।', proceedConsent: 'सहमति पर जाएँ', proceedConsentCopy: 'सहमति प्रति पर जाएँ',
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

const TA = {
  ...EN,
  toolkit: 'மதிப்பீடு மற்றும் மறுவாழ்வு கருவி', correctionalInstrument: 'சீர்திருத்த மதிப்பீட்டு கருவி · மகாராஷ்டிரா',
  caseRegistry: 'வழக்கு பதிவேடு', registryDescription: 'குற்றவாளி சீர்திருத்தம் மற்றும் சமூகத்தில் மீண்டும் இணைவதற்கான கட்டமைக்கப்பட்ட மதிப்பீட்டு முறை.',
  beginAssessment: 'புதிய மதிப்பீட்டைத் தொடங்கவும்', cancel: 'ரத்து செய்', prisonerIdentity: 'கைதி அடையாளம்',
  name: 'பெயர்', prisonerId: 'கைதி அடையாள எண்', gender: 'பாலினம்', age: 'வயது', male: 'ஆண்', female: 'பெண்', transgender: 'திருநங்கை / திருநம்பி', other: 'மற்றவை',
  location: 'இடம்', useLocation: 'தற்போதைய இடத்தைப் பயன்படுத்து', locationUnsupported: 'இந்தச் சாதனத்தில் இருப்பிட வசதி இல்லை.',
  gettingLocation: 'தற்போதைய இடம் பெறப்படுகிறது…', locationSet: 'இட விவரங்கள் தானாக நிரப்பப்பட்டன', coordinatesCaptured: 'இடம் கிடைத்தது. மாநிலம் மற்றும் மாவட்டத்தைச் சரிபார்க்கவும்.',
  locationDenied: 'இருப்பிட அனுமதி மறுக்கப்பட்டது. முகவரியை கீழே நிரப்பவும்.', locationFailed: 'இருப்பிடத்தைப் பெற முடியவில்லை. முகவரியை கீழே நிரப்பவும்.',
  state: 'மாநிலம்', district: 'மாவட்டம்', city: 'நகரம் / ஊர்', pin: 'அஞ்சல் குறியீடு', specificPlace: 'சிறை / குறிப்பிட்ட இடம்',
  selectState: 'மாநிலத்தைத் தேர்ந்தெடு', selectDistrict: 'மாவட்டத்தைத் தேர்ந்தெடு', selectStateFirst: 'முதலில் மாநிலத்தைத் தேர்ந்தெடு', assessedBy: 'மதிப்பீட்டாளர்',
  designation: 'பதவி', date: 'தேதி', time: 'நேரம்', createBegin: 'உருவாக்கி தொடங்கு', prisoner: 'கைதி', id: 'அடையாள எண்', status: 'நிலை', updated: 'புதுப்பிப்பு',
  noAssessments: 'இதுவரை மதிப்பீடு இல்லை. தொடங்க புதிய மதிப்பீட்டை உருவாக்கவும்.', unnamed: 'பெயரிடப்படாதவர்', submitted: 'சமர்ப்பிக்கப்பட்டது', inProgress: 'நடைபெறுகிறது', open: 'திற',
  language: 'மொழி', startPhoto: 'தொடக்கப் படம்', consent: 'ஒப்புதல்', questionnaire: 'கேள்வித்தாள்', scorecard: 'மதிப்பெண் அட்டை', endPhoto: 'இறுதிப் படம்', signedConsentCopy: 'கையொப்பமிட்ட ஒப்புதல் நகல்', submit: 'சமர்ப்பி',
  prisonerRole: 'கைதி', assessorRole: 'மதிப்பீட்டாளர்', prisonerStartPhoto: 'கைதி - தொடக்கப் படம்', assessorStartPhoto: 'மதிப்பீட்டாளர் - தொடக்கப் படம்',
  prisonerEndPhoto: 'கைதி - இறுதிப் படம்', assessorEndPhoto: 'மதிப்பீட்டாளர் - இறுதிப் படம்', captureBothStart: 'மதிப்பீட்டின் தொடக்கத்தில் கைதி மற்றும் மதிப்பீட்டாளர் இருவரையும் கேமராவில் படம் எடுக்கவும்.',
  captureBothEnd: 'மதிப்பீட்டின் முடிவில் கைதி மற்றும் மதிப்பீட்டாளர் இருவரையும் கேமராவில் படம் எடுக்கவும்.', bothStartCaptured: 'கைதி மற்றும் மதிப்பீட்டாளரின் தொடக்கப் படங்கள் எடுக்கப்பட்டன.',
  bothEndCaptured: 'கைதி மற்றும் மதிப்பீட்டாளரின் இறுதிப் படங்கள் எடுக்கப்பட்டன.', proceedConsent: 'ஒப்புதலுக்குச் செல்லவும்', proceedConsentCopy: 'ஒப்புதல் நகலுக்குச் செல்லவும்',
  sections: 'பிரிவுகள்', done: 'முடிந்தது', partial: 'நடைபெறுகிறது', todo: 'செய்ய வேண்டும்', locked: 'பூட்டப்பட்டது', completePrevious: 'முந்தைய பிரிவை முதலில் முடிக்கவும்',
  auditLog: 'தணிக்கைப் பதிவு', exportPdf: 'PDF அறிக்கையை ஏற்றுமதி செய்', backRegistry: 'பதிவேட்டிற்குத் திரும்பு', assessedByInline: 'மதிப்பீட்டாளர்',
  reintegrationProgress: 'மீள் இணைவு முன்னேற்றம்', stages: 'நிலைகள்', assessmentSection: 'மதிப்பீட்டுப் பிரிவு', group: 'குழு', of: 'இல்', answered: 'பதிலளிக்கப்பட்டது',
  previous: 'முந்தையது', next: 'அடுத்தது', reviewAnswers: 'பதில்களைச் சரிபார்', answer: 'பதில்', response: 'பதில்', fromIntake: 'ஆரம்பப் பதிவிலிருந்து',
  carriedFromIntake: 'ஆரம்பப் பதிவிலிருந்து எடுக்கப்பட்டது — தேவைப்பட்டால் மாற்றவும்.', typeResponse: 'பதிலை எழுதவும்…', rateStatements: 'இரு கூற்றுகளுக்கும் பதிலளிக்கவும்',
  statementA: 'கூற்று A', statementB: 'கூற்று B', reverseScored: 'எதிர்மறை மதிப்பீடு', select: 'தேர்ந்தெடு', yes: 'ஆம்', no: 'இல்லை', notSure: 'தெரியவில்லை', sometimes: 'சில நேரங்களில்',
  stable: 'நிலையானது', unstable: 'நிலையற்றது', addNote: 'நேர்காணல் குறிப்பைச் சேர்', noteAdded: 'நேர்காணல் குறிப்பு சேர்க்கப்பட்டது', optionalContext: 'விருப்பக் குறிப்பு', addContext: 'தொடர்புடைய குறிப்பைச் சேர்க்கவும்…',
  reviewYourAnswers: 'உங்கள் பதில்களைச் சரிபார்க்கவும்', questionsAnswered: 'கேள்விகளுக்கு பதிலளிக்கப்பட்டது', question: 'கேள்வி', note: 'குறிப்பு', notAnswered: 'பதிலளிக்கப்படவில்லை',
  backEdit: 'திருத்தத்திற்குத் திரும்பு', completeContinue: 'முடித்து தொடரவும்', agreeParticipate: 'பங்கேற்க நான் ஒப்புக்கொள்கிறேன்', declineParticipate: 'பங்கேற்க நான் ஒப்புக்கொள்ளவில்லை',
  nameId: 'பெயர் / அடையாள எண்', fullNameId: 'முழுப் பெயர் அல்லது கைதி அடையாள எண்', signatureThumb: 'கையொப்பம் / பெருவிரல் ரேகை', signaturePlaceholder: 'கையொப்பம் அல்லது பெருவிரல்',
  place: 'இடம்', dateTime: 'தேதி மற்றும் நேரம்', consentAgreed: 'ஒப்புதல் பதிவு செய்யப்பட்டது — பங்கேற்பாளர் ஒப்புக்கொண்டார்.', consentDeclined: 'ஒப்புதல் பதிவு செய்யப்பட்டது — பங்கேற்பாளர் ஒப்புக்கொள்ளவில்லை.',
  continue: 'தொடரவும்', consentMentalHealth: 'தகவலறிந்த ஒப்புதல் — மனநல மதிப்பீடு', consentParticipation: 'பங்கேற்பிற்கான தகவலறிந்த ஒப்புதல்',
  timestamp: 'தேதி மற்றும் நேரம்', action: 'செயல்', detail: 'விவரம்', section: 'பிரிவு', downloadCsv: 'CSV பதிவிறக்கு', actionsRecorded: 'செயல்கள் பதிவு செய்யப்பட்டன',
  auditDisclaimer: 'ஒவ்வொரு நேர்காணல் செயலும் தேதி, நேரம் மற்றும் நேர மண்டலத்துடன் பதிவு செய்யப்படும். பதிவுகளை மாற்றவோ நீக்கவோ முடியாது.',
  noAuditEntries: 'இந்த அமர்விற்கு தணிக்கைப் பதிவுகள் எதுவும் இல்லை.',
}

const CONTENT_TA = {
  ...questionnaireTa,
  'Socio-Demographic & Historic Data': 'சமூக, மக்கள்தொகை மற்றும் வரலாற்றுத் தகவல்',
  'Offence Severity & Modality': 'குற்றத்தின் தீவிரமும் வகையும்', 'Informed Consent': 'தகவலறிந்த ஒப்புதல்',
  'Pre-Assessment Mental Health Screening': 'மதிப்பீட்டுக்கு முன் மனநலச் சோதனை', 'Background Information': 'பின்னணித் தகவல்',
  'Criminal Potential Score': 'குற்ற ஆபத்து மதிப்பெண்', 'Response Reliability Index (RRI)': 'பதில் நம்பகத்தன்மை குறியீடு (RRI)',
  'Protective Factor Index': 'பாதுகாப்புக் காரணி குறியீடு', 'Rehabilitation Scorecard & Decision': 'மறுவாழ்வு மதிப்பெண் அட்டை மற்றும் முடிவு',
  'Yes': 'ஆம்', 'No': 'இல்லை', 'Not sure': 'தெரியவில்லை', 'Sometimes': 'சில நேரங்களில்', 'Select': 'தேர்ந்தெடு',
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
    t: (key) => (language === 'hi' ? HI : language === 'ta' ? TA : EN)[key] || EN[key] || key,
    tr: (text) => language === 'hi' ? (CONTENT_HI[text] || text) : language === 'ta' ? (CONTENT_TA[text] || text) : text,
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
      <button type="button" className={language === 'ta' ? 'is-active' : ''} aria-pressed={language === 'ta'} onClick={() => setLanguage('ta')}>தமிழ்</button>
    </div>
  )
}
