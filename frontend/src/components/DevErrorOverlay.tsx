import { useEffect, useState } from 'react'

export default function DevErrorOverlay() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      setError(String(e.error ?? e.message ?? e))
    }
    const onRejection = (e: any) => {
      setError(String(e?.reason ?? e))
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  if (!import.meta.env.DEV) return null
  if (!error) return null
  return (
    <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: 12, borderRadius: 6, fontSize: 13 }}>
      <div style={{ fontWeight: 700 }}>Dev Error</div>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{error}</pre>
    </div>
  )
}
