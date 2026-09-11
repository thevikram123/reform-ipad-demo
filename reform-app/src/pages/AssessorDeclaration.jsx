import { useSession } from '../context/SessionContext'
import { useLanguage } from '../i18n.jsx'
import { localize } from './NodalDecision'

export default function AssessorDeclaration() {
  const { session, updateAssessorDeclaration } = useSession()
  const { language } = useLanguage()
  const L = (text) => localize(text, language)
  const form = session.assessorDeclaration || {}
  const set = (key) => (e) => updateAssessorDeclaration({ [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  return <section className="assessor-declaration">
    <span className="section-pill">{L('Stage 1 of 3')}</span>
    <h2>{L('Assessor Declaration')}</h2>
    <p>{L('I declare that I conducted this assessment, recorded the prisoner’s responses accurately, and captured the required photographs and signed consent documents. I understand that submission freezes the complete assessment record.')}</p>
    <label className="declaration-check"><input type="checkbox" checked={!!form.accepted} onChange={set('accepted')} /> {L('I confirm that the assessment is complete and accurate.')}</label>
    <div className="signature-grid assessor-signature-grid">
      <label>{L('Assessor Name')}<input value={form.name ?? session.profile?.assessedBy ?? ''} onChange={set('name')} /></label>
      <label>{L('Signature / Thumb Impression')}<input value={form.signature || ''} onChange={set('signature')} placeholder={L('Enter signature mark')} /></label>
      <label>{L('Date')}<input type="date" value={form.date || session.profile?.date || new Date().toISOString().slice(0,10)} onChange={set('date')} /></label>
    </div>
  </section>
}
