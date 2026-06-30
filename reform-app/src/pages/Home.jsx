import { useState } from 'react'
import { useSession } from '../context/SessionContext.jsx'
import * as store from '../lib/storage'
import { formatTs } from '../lib/audit'
import Icon from '../components/Icon'
import geo from '../data/india-geo.json'
import { useLanguage } from '../i18n.jsx'
import { addressFromGeocode } from '../lib/location.js'

const STATES = Object.keys(geo)

export default function Home({ onOpen }) {
  const { start, load } = useSession()
  const { t } = useLanguage()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(() => ({
    state: 'Maharashtra',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
  }))
  const [geoStatus, setGeoStatus] = useState(null)
  const sessions = store.listSessions()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const districts = form.state && geo[form.state] ? geo[form.state] : []

  // Auto-fill location from the device GPS, reverse-geocoded to address fields.
  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      setGeoStatus({ type: 'err', msg: t('locationUnsupported') })
      return
    }
    setGeoStatus({ type: 'busy', msg: t('gettingLocation') })
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords
        setForm((f) => ({ ...f, lat: latitude, lng: longitude }))
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`)
          const data = await res.json()
          const address = addressFromGeocode(data, geo, form.state)
          setForm((f) => ({
            ...f,
            state: address.state || f.state,
            district: address.district || f.district,
            city: address.city || f.city,
            pin: address.pin || f.pin,
            location: f.location || address.location,
          }))
          setGeoStatus({
            type: 'ok',
            msg: `${t('locationSet')}: ${[address.city, address.district, address.state, address.pin].filter(Boolean).join(', ')} (±${Math.round(coords.accuracy)}m)`,
          })
        } catch {
          setGeoStatus({
            type: 'ok',
            msg: `${t('coordinatesCaptured')} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          })
        }
      },
      (err) => {
        setGeoStatus({
          type: 'err',
          msg:
            err.code === 1
              ? t('locationDenied')
              : t('locationFailed'),
        })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const create = () => {
    start(form)
    onOpen()
  }
  const resume = (id) => { load(id); onOpen() }

  return (
    <div className="home">
      <div className="home-head">
        <div>
          <span className="eyebrow">{t('correctionalInstrument')}</span>
          <h1>{t('caseRegistry')}</h1>
          <p className="muted">{t('registryDescription')}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew((v) => !v)}>
          {showNew ? <><Icon name="x" /> {t('cancel')}</> : <><Icon name="plus" /> {t('beginAssessment')}</>}
        </button>
      </div>

      {showNew && (
        <div className="card intake-card">
          <h2 className="form-section-title">{t('prisonerIdentity')}</h2>
          <div className="intake-grid">
            <Field id="name" label={t('name')} value={form.name} onChange={set('name')} />
            <Field id="prisonerId" label={t('prisonerId')} value={form.prisonerId} onChange={set('prisonerId')} />
            <Field id="gender" label={t('gender')} value={form.gender} onChange={set('gender')}
              type="select" placeholder={t('select')} options={[['Male', t('male')], ['Female', t('female')], ['Transgender', t('transgender')], ['Other', t('other')]]} />
            <Field id="age" label={t('age')} value={form.age} onChange={set('age')} type="number" />
          </div>

          <h2 className="form-section-title">
            {t('location')}
            <button type="button" className="btn-secondary geo-btn" onClick={useMyLocation}>
              <Icon name="crosshair" size={15} /> {t('useLocation')}
            </button>
          </h2>
          {geoStatus && (
            <p className={`geo-status geo-${geoStatus.type}`}>{geoStatus.msg}</p>
          )}
          <div className="intake-grid">
            <Field id="state" label={t('state')} value={form.state}
              onChange={(e) => { setVal('state', e.target.value); setVal('district', '') }}
              type="select" options={STATES} placeholder={t('selectState')} />
            <Field id="district" label={t('district')} value={form.district || ''} onChange={set('district')}
              type="select" options={districts} placeholder={form.state ? t('selectDistrict') : t('selectStateFirst')}
              disabled={!form.state} />
            <Field id="city" label={t('city')} value={form.city || ''} onChange={set('city')} />
            <Field id="pin" label={t('pin')} value={form.pin || ''} onChange={set('pin')} inputMode="numeric" />
            <Field id="location" label={t('specificPlace')} value={form.location || ''} onChange={set('location')} wide />
          </div>

          <h2 className="form-section-title">{t('assessedBy')}</h2>
          <div className="intake-grid">
            <Field id="assessedBy" label={t('name')} value={form.assessedBy} onChange={set('assessedBy')} />
            <Field id="designation" label={t('designation')} value={form.designation} onChange={set('designation')} />
            <Field id="date" label={t('date')} value={form.date} onChange={set('date')} type="date" />
            <Field id="time" label={t('time')} value={form.time} onChange={set('time')} type="time" />
          </div>

          <div className="intake-actions">
            <button className="btn-primary" onClick={create} disabled={!form.name && !form.prisonerId}>
              {t('createBegin')} <Icon name="arrow-right" />
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="sessions-table">
          <thead>
            <tr><th>{t('prisoner')}</th><th>{t('id')}</th><th>{t('district')}</th><th>{t('status')}</th><th>{t('updated')}</th><th></th></tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr><td colSpan={6} className="empty">{t('noAssessments')}</td></tr>
            )}
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.profile?.name || <em className="muted">{t('unnamed')}</em>}</td>
                <td className="mono">{s.profile?.prisonerId || '—'}</td>
                <td className="muted">{s.profile?.district || '—'}</td>
                <td>
                  <span className={'badge ' + (s.status === 'submitted' ? 'badge-done' : 'badge-partial')}>
                    {s.status === 'submitted' ? t('submitted') : t('inProgress')}
                  </span>
                </td>
                <td className="muted">{formatTs(s.updatedAt)}</td>
                <td><button className="btn-secondary" onClick={() => resume(s.id)}>{t('open')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ id, label, value, onChange, type = 'text', options, placeholder, disabled, wide, inputMode }) {
  return (
    <div className={'field' + (wide ? ' field-wide' : '')}>
      <label htmlFor={id}>{label}</label>
      {type === 'select' ? (
        <select id={id} value={value || ''} onChange={onChange} disabled={disabled}>
          <option value="">{placeholder || 'Select'}</option>
          {(options || []).map((o) => {
            const [optionValue, optionLabel] = Array.isArray(o) ? o : [o, o]
            return <option key={optionValue} value={optionValue}>{optionLabel}</option>
          })}
        </select>
      ) : (
        <input id={id} type={type} inputMode={inputMode} value={value || ''} onChange={onChange} disabled={disabled} />
      )}
    </div>
  )
}
