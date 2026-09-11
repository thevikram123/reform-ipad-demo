import { useMemo, useState } from 'react'
import { useSession } from '../context/SessionContext'
import { ASPIRE_OPTIONS, CPS_OPTIONS, PFI_OPTIONS, getReleaseDecision } from '../lib/releaseClassification'
import { DeclarationBlock, FormHeading, RoleHeader, Select, SubmitRow, localize } from './NodalDecision'
import { useLanguage } from '../i18n.jsx'

export default function HomeDecision({ canSubmit }) {
  const { session, submitHome } = useSession()
  const { language } = useLanguage()
  const L = (text) => localize(text, language)
  const saved = session.homeEntry || {}
  const [form, setForm] = useState(() => ({
    cpsRange: '', aspireLevel: '', pfiStrength: '', remarks: '', declarationAccepted: false,
    acsName: '', acsSignature: '', acsDate: new Date().toISOString().slice(0,10),
    adgName: '', adgSignature: '', adgDate: new Date().toISOString().slice(0,10),
    nodalName: session.nodalEntry?.nodalName || '', nodalSignature: '', nodalDate: new Date().toISOString().slice(0,10),
    ...saved,
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const decision = useMemo(() => getReleaseDecision(form.cpsRange, form.aspireLevel, form.pfiStrength), [form])
  const required = decision && form.declarationAccepted && ['acs','adg','nodal'].every((p) => form[`${p}Signature`])
  const submit = async () => { setBusy(true); setError(''); try { await submitHome({ ...form, decision }) } catch (e) { setError(e.message || 'Home Department submission failed') } finally { setBusy(false) } }

  return <div className="role-entry home-entry">
    <RoleHeader eyebrow="Stage 3 of 3" title="Home Department Release Decision" text="The assessor record and Nodal Officer rehabilitation entry are locked. Complete the release classification and final departmental sign-off." />
    <div className="nodal-summary"><span>{L('Nodal rehabilitation pathway')}</span><strong>{L(session.nodalEntry?.recommendedPathway || 'Not recorded')}</strong><span>{L('Readiness')}</span><strong>{L(session.nodalEntry?.reintegrationReadiness || 'Not recorded')}</strong></div>
    <section className="role-form-card release-page">
      <FormHeading number="01" title="Release Suitability Classification (CPS × PFI × RRI × ASPIRE)" />
      <div className="decision-fields three-col">
        <Select label="CPS Risk and Range" value={form.cpsRange} options={CPS_OPTIONS} onChange={set('cpsRange')} disabled={!canSubmit} />
        <Select label="ASPIRE" value={form.aspireLevel} options={ASPIRE_OPTIONS} onChange={set('aspireLevel')} disabled={!canSubmit} />
        <Select label="PFI" value={form.pfiStrength} options={PFI_OPTIONS} onChange={set('pfiStrength')} disabled={!canSubmit} />
      </div>
      <div className={`final-decision-result ${decision ? 'has-result' : ''}`}><span>{L('Release Decision')}</span><strong>{L(decision || 'Select CPS, ASPIRE and PFI to calculate the decision')}</strong></div>
      <div className="decision-narratives single"><label>{L('Home Department Remarks / Conditions')}<textarea value={form.remarks} onChange={set('remarks')} disabled={!canSubmit} /></label></div>
      <DeclarationBlock role="Nodal Officer" form={form} set={set} disabled={!canSubmit} prefixes={['acs','adg','nodal']} />
      {error && <p className="submit-warning">{error}</p>}
      {canSubmit && <SubmitRow text="Final submission permanently closes the assessment for every role." disabled={!required || busy} onClick={submit} label={busy ? 'Submitting…' : 'Submit Final Release Decision'} />}
    </section>
  </div>
}
