import { useRef, useState, useEffect, useCallback } from 'react'
import Icon from './Icon'
import './capture.css'

/**
 * PhotoCapture({ value, onCapture, label })
 *
 * value     — existing dataURL (shows preview with Retake)
 * onCapture — callback(dataUrl: string | null)
 * label     — heading string, e.g. "Start Photo"
 *
 * When allowUpload is true, the interviewer can switch to file upload if the
 * camera is slow, denied, or absent.
 */
export default function PhotoCapture({
  value,
  onCapture,
  label,
  allowUpload = true,
  variant = 'photo',
  hint,
  captureLabel = 'Capture photo',
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [streaming, setStreaming] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [useUpload, setUseUpload] = useState(false) // manual fallback toggle
  const [captured, setCaptured] = useState(value || null)

  useEffect(() => { setCaptured(value || null) }, [value])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setStreaming(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(allowUpload
        ? 'This device/browser has no camera support. Use the file upload below.'
        : 'This device/browser has no camera support. Please use a device with a camera.'
      )
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: variant === 'document'
          ? { facingMode: { ideal: 'environment' } }
          : true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStreaming(true)
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? (allowUpload
            ? 'Camera permission denied. Allow camera access or use the file upload below.'
            : 'Camera permission denied. Allow camera access to continue.')
          : err.name === 'NotFoundError'
          ? (allowUpload
            ? 'No camera found on this device. Use the file upload below.'
            : 'No camera found on this device. Please use a device with a camera.')
          : (allowUpload
            ? `Camera unavailable: ${err.message}. Use the file upload below.`
            : `Camera unavailable: ${err.message}. Please try again.`)
      setCameraError(msg)
      setStreaming(false)
    }
  }, [allowUpload, variant])

  // Start camera on mount (unless we already have a capture or chose upload)
  useEffect(() => {
    if (!captured && !useUpload) startCamera()
    return () => stopStream()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Safety net: if the camera hasn't started within 4s, offer the fallback.
  useEffect(() => {
    if (captured || useUpload || cameraError) return
    const t = setTimeout(() => {
      if (!streamRef.current) {
        setCameraError(allowUpload
          ? 'Camera is taking too long to start. Use the file upload below, or retry.'
          : 'Camera is taking too long to start. Please allow camera access or try again.'
        )
      }
    }, 4000)
    return () => clearTimeout(t)
  }, [captured, useUpload, cameraError, streaming, allowUpload])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    stopStream()
    setCaptured(dataUrl)
    onCapture(dataUrl)
  }, [onCapture, stopStream])

  const retake = useCallback(() => {
    setCaptured(null)
    setCameraError(null)
    setUseUpload(false)
    onCapture(null)
    setTimeout(() => startCamera(), 0)
  }, [onCapture, startCamera])

  const switchToUpload = useCallback(() => {
    stopStream()
    setUseUpload(true)
    setCameraError(null)
  }, [stopStream])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCaptured(ev.target.result)
      onCapture(ev.target.result)
    }
    reader.readAsDataURL(file)
  }, [onCapture])

  const FallbackInput = (
    <div className="photo-capture__fallback">
      <span className="photo-capture__fallback-label">
        Upload a photo or use your device camera:
      </span>
      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
    </div>
  )

  return (
    <div className={`photo-capture photo-capture--${variant}`}>
      {label && <h3 className="photo-capture__label">{label}</h3>}
      {hint && <p className="photo-capture__hint">{hint}</p>}

      {captured ? (
        <>
          <div className="photo-capture__frame">
            <img src={captured} alt="Captured" className="photo-capture__preview" />
            {variant === 'document' && <ScannerOverlay />}
          </div>
          <div className="photo-capture__actions">
            <button type="button" className="btn-secondary" onClick={retake}><Icon name="rotate" /> Retake</button>
          </div>
        </>
      ) : useUpload || cameraError ? (
        <div className="photo-capture__error">
          {cameraError && <span className="photo-capture__msg">{cameraError}</span>}
          {allowUpload && FallbackInput}
          <div className="photo-capture__actions">
            <button type="button" className="btn-ghost" onClick={retake}><Icon name="rotate" /> Try camera again</button>
          </div>
        </div>
      ) : (
        <>
          <div className="photo-capture__frame">
            <video ref={videoRef} className="photo-capture__video" muted playsInline />
            {variant === 'document' && <ScannerOverlay />}
          </div>
          <canvas ref={canvasRef} className="photo-capture__canvas" />
          <div className="photo-capture__actions">
            <button type="button" className="btn-primary" onClick={capturePhoto} disabled={!streaming}>
              <Icon name="camera" /> {streaming ? captureLabel : 'Starting camera…'}
            </button>
            {allowUpload && (
              <button type="button" className="btn-ghost" onClick={switchToUpload}>
                <Icon name="upload" /> No camera? Upload a file instead
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ScannerOverlay() {
  return (
    <div className="photo-capture__scanner-overlay" aria-hidden="true">
      <span className="corner corner--tl" />
      <span className="corner corner--tr" />
      <span className="corner corner--bl" />
      <span className="corner corner--br" />
    </div>
  )
}
