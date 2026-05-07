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

    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('orientationchange', setVh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}
