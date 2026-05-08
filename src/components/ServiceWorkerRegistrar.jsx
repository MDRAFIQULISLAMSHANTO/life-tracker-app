'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }

    // iOS PWA viewport fix — forces repaint when app resumes from background
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setVh()
        // Force reflow to fix stale layout on iOS Safari PWA
        document.body.style.display = 'none'
        void document.body.offsetHeight
        document.body.style.display = ''
      }
    }

    const onFocus = () => { setVh() }
    const onPageShow = (e) => { if (e.persisted) onVisibility() }

    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('orientationchange', setVh)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}
