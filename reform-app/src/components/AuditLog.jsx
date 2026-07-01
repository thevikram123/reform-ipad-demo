import { useSession } from '../context/SessionContext'
import { formatTs } from '../lib/audit'
import Icon from './Icon'
import './admin.css'
import { useLanguage } from '../i18n.jsx'

export default function AuditLog() {
  const { session } = useSession()
  const { language, t, tr } = useLanguage()
  if (!session) return null

  const raw = session.audit || []
  // Newest first — copy so we don't mutate the original
  const entries = [...raw].reverse()
  const prisonerId = session.profile?.prisonerId || 'unknown'
  const locale = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN'

  function downloadCsv() {
    const header = ['ISO Timestamp', t('timestamp'), t('action'), t('detail'), t('section'), 'Question ID']
    const rows = [...raw].map((e) => [
      e.ts,
      formatTs(e.ts, locale),
      e.action || '',
      e.detail || '',
      e.sectionId || '',
      e.questionId || '',
    ])
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
    const csvLines = [header.map(escape).join(',')]
    for (const row of rows) {
      csvLines.push(row.map(escape).join(','))
    }
    const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_${prisonerId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="audit-wrapper">
      <div className="audit-header">
        <div>
          <h2>{t('auditLog')}</h2>
          <span className="audit-count">{raw.length} {t('actionsRecorded')}</span>
        </div>
        {raw.length > 0 && (
          <button className="btn-secondary audit-download-btn" onClick={downloadCsv}>
            <Icon name="download" size={15} /> {t('downloadCsv')}
          </button>
        )}
      </div>

      <p className="audit-disclaimer">
        {t('auditDisclaimer')}
      </p>

      {entries.length === 0 ? (
        <div className="audit-empty">{t('noAuditEntries')}</div>
      ) : (
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>{t('timestamp')}</th>
                <th>{t('action')}</th>
                <th>{t('detail')}</th>
                <th>{t('section')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="ts">{formatTs(e.ts, locale)}</td>
                  <td className="action">{e.action ? tr(e.action) : '—'}</td>
                  <td className="detail">{e.detail || '—'}</td>
                  <td className="section">{e.sectionId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
