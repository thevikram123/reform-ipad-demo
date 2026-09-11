import { useMemo, useState } from 'react'
import { useSession } from '../context/SessionContext'
import { ASPIRE_OPTIONS, CPS_OPTIONS, PFI_OPTIONS, RELEASE_RULES, getReleaseDecision } from '../lib/releaseClassification'
import Icon from '../components/Icon'
import '../components/admin.css'

export default function NodalDecision({ canSubmit }) {
  const { session, finalSubmit } = useSession()
  const tentative = session.scorecard || {}
  const [form, setForm] = useState(() => session.finalScorecard || {
    cpsRange: tentative.cpsRange || '', aspireLevel: tentative.aspireLevel || '',
    pfiStrength: tentative.pfiStrength || '', rriConcern: tentative.reliabilityConcern || '',
    observations: tentative.clinicalSummary || '', recommendations: tentative.recommendations || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const decision = useMemo(() => getReleaseDecision(form.cpsRange, form.aspireLevel, form.pfiStrength), [form])
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))

  const submit = async () => {
    if (!decision) return
    setBusy(true); setError('')
    try { await finalSubmit({ ...form, decision }) }
    catch (e) { setError(e.message || 'Final submission failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="nodal-review">
      <header className="nodal-review-head">
        <div><span className="section-pill">Final review</span><h1>Release Suitability Decision</h1><p>The assessor’s answers are frozen. Complete the final classification and submit the Nodal Officer decision.</p></div>
        <span className="review-lock"><Icon name="lock" size={15} /> Answers locked</span>
      </header>

      <div className="tentative-card">
        <span>Assessor’s tentative classification</span>
        <strong>{getReleaseDecision(tentative.cpsRange, tentative.aspireLevel, tentative.pfiStrength) || tentative.decision || 'Not recorded'}</strong>
      </div>

      <section className="decision-form-card">
        <div className="decision-form-title"><span>Final classification matrix</span><small>CPS × PFI × RRI × ASPIRE</small></div>
        <div className="decision-fields">
          <DecisionSelect label="CPS Risk and Range" value={form.cpsRange} options={CPS_OPTIONS} onChange={set('cpsRange')} disabled={!canSubmit} />
          <DecisionSelect label="ASPIRE" value={form.aspireLevel} options={ASPIRE_OPTIONS} onChange={set('aspireLevel')} disabled={!canSubmit} />
          <DecisionSelect label="PFI" value={form.pfiStrength} options={PFI_OPTIONS} onChange={set('pfiStrength')} disabled={!canSubmit} />
          <DecisionSelect label="RRI / Reliability Concern" value={form.rriConcern} options={['None', 'Some', 'Significant']} onChange={set('rriConcern')} disabled={!canSubmit} />
        </div>
        <div className={`final-decision-result ${decision ? 'has-result' : ''}`}><span>Decision</span><strong>{decision || 'Select CPS, ASPIRE and PFI to calculate the decision'}</strong></div>
        <div className="decision-narratives">
          <label>Clinical Summary and Observations<textarea value={form.observations} onChange={set('observations')} disabled={!canSubmit} /></label>
          <label>Recommendations and Conditions<textarea value={form.recommendations} onChange={set('recommendations')} disabled={!canSubmit} /></label>
        </div>
        {error && <p className="submit-warning">{error}</p>}
        {canSubmit && <div className="nodal-submit-row"><p>Final submission is permanent and makes this assessment view-only for all roles.</p><button className="btn-accent" disabled={!decision || busy} onClick={submit}>{busy ? 'Submitting…' : 'Final Submit'} <Icon name="arrow-right" /></button></div>}
      </section>

      <details className="classification-reference" open>
        <summary>Release suitability reference</summary>
        <div className="classification-table-wrap"><table className="classification-table"><thead><tr><th>CPS Risk and Range</th><th>ASPIRE</th><th>PFI</th><th>Decision</th></tr></thead><tbody>{RELEASE_RULES.map((r) => <tr key={`${r.cps}-${r.aspire}-${r.pfi}`}><td>{r.cps}</td><td>{r.aspire}</td><td>{r.pfi}</td><td>{r.decision}</td></tr>)}</tbody></table></div>
      </details>
    </div>
  )
}

function DecisionSelect({ label, value, options, onChange, disabled }) {
  return <label>{label}<select value={value} onChange={onChange} disabled={disabled}><option value="">— Select —</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}
