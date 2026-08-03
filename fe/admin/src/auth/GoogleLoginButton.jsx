import { useEffect, useRef } from 'react'

export default function GoogleLoginButton({ onCredential, disabled }) {
  const hostRef = useRef(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId || disabled || !hostRef.current) return undefined
    let cancelled = false
    let attempts = 0
    const render = () => {
      if (cancelled) return
      if (!window.google?.accounts?.id) {
        attempts += 1
        if (attempts < 50) window.setTimeout(render, 100)
        return
      }
      hostRef.current.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => response?.credential && onCredential(response.credential),
      })
      window.google.accounts.id.renderButton(hostRef.current, {
        theme: 'outline', size: 'large', width: 360, text: 'signin_with', shape: 'rectangular',
      })
    }
    render()
    return () => { cancelled = true }
  }, [clientId, disabled, onCredential])

  if (!clientId) return <p className="google-config-note">Chưa cấu hình VITE_GOOGLE_CLIENT_ID.</p>
  return <div className="google-button-host" ref={hostRef} aria-label="Đăng nhập bằng Google" />
}
