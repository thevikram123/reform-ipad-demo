import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/reform-logo.png'
import Icon from './Icon'

export default function AccessGate({ children }) {
  const { user, loading, signIn, register } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ accessId: '', displayName: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (loading) return <div className="access-loading">Opening secure workspace…</div>
  if (user) return children

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMessage('')
    try {
      const result = mode === 'signin' ? await signIn(form.accessId, form.password) : await register(form)
      if (result.error) throw result.error
      if (mode === 'register' && !result.data.session) setMessage('Account created. Confirm the email if confirmation is enabled, then sign in.')
    } catch (error) { setMessage(error.message || 'Unable to continue.') }
    finally { setBusy(false) }
  }

  return (
    <main className="access-page">
      <section className="access-brand">
        <img src={logo} alt="REFORM" />
        <span className="access-kicker">Secure assessment workspace</span>
        <h1>One record.<br />Two levels of review.</h1>
        <p>Assessors document the interview. Nodal Officers make the final release decision. Every submission is timestamped.</p>
        <div className="access-flow"><span>01 Assess</span><i /><span>02 Review</span><i /><span>03 Finalise</span></div>
      </section>
      <section className="access-panel">
        <div className="access-card">
          <span className="eyebrow">Authorised users only</span>
          <h2>{mode === 'signin' ? 'Sign in to REFORM' : 'Register assessor access'}</h2>
          <p className="muted">Use the access ID issued for your role.</p>
          <form onSubmit={submit}>
            {mode === 'register' && <label>Full name<input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required /></label>}
            <label>Access ID<input value={form.accessId} onChange={(e) => setForm({ ...form, accessId: e.target.value })} autoCapitalize="none" required /></label>
            <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required /></label>
            {message && <p className="access-message">{message}</p>}
            <button className="btn-primary access-submit" disabled={busy}>{busy ? 'Please wait…' : <>{mode === 'signin' ? 'Sign in' : 'Create assessor account'} <Icon name="arrow-right" /></>}</button>
          </form>
          <button className="access-mode" onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setMessage('') }}>
            {mode === 'signin' ? 'First-time assessor? Register access' : 'Already registered? Sign in'}
          </button>
          <p className="access-note">Nodal Officer and Home Department roles are issued by the system administrator.</p>
        </div>
      </section>
    </main>
  )
}
