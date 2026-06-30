import Icon from './Icon'
import './capture.css'

/**
 * BiometricCapture({ value, onCapture, label })
 *
 * value    — existing capture object { captured, ts, method } or null
 * onCapture — callback(data: object)
 * label    — heading string, e.g. "Thumbprint (Start)"
 *
 * STUB — real hardware integration pending.
 */
export default function BiometricCapture({ value, onCapture, label }) {
  const handleSimulate = () => {
    onCapture({
      captured: true,
      ts: new Date().toISOString(),
      method: 'placeholder',
    })
  }

  return (
    <div className="biometric-capture">
      {label && <h3 className="biometric-capture__label">{label}</h3>}

      <div className="biometric-capture__body">
        {/* Fingerprint icon — inline SVG, no external deps */}
        <svg
          className="biometric-capture__icon"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M32 4C18.7 4 8 14.7 8 28c0 5.8 2 11.2 5.4 15.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 4c13.3 0 24 10.7 24 24 0 5.8-2 11.2-5.4 15.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 28c0-6.6 5.4-12 12-12s12 5.4 12 12c0 7-3 13.4-8 18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 20c4.4 0 8 3.6 8 8 0 5-2 9.6-5.4 13"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 28v10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="32" cy="28" r="2.5" fill="currentColor" />
        </svg>

        <div className="biometric-capture__info">
          <p className="biometric-capture__text">
            Thumbprint biometric — integration pending
          </p>
          <span className="biometric-capture__stub">
            Stub — future hardware integration
          </span>
        </div>
      </div>

      {value && value.captured ? (
        <div className="biometric-capture__captured">
          <span className="biometric-capture__done"><Icon name="check" size={15} /> Captured</span>
          <span className="biometric-capture__ts">
            {value.ts ? new Date(value.ts).toLocaleString() : ''}
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="btn-secondary"
          onClick={handleSimulate}
        >
          Simulate capture
        </button>
      )}
    </div>
  )
}
