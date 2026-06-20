'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }

    let rafId = null

    const isTypingTarget = () => {
      const el = document.activeElement
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }

    const setVh = () => {
      // Cancel any pending animation frame to debounce rapid fires
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      })
    }

    // resize fires when the on-screen keyboard opens/closes (innerHeight shrinks) —
    // skip recalculating --vh in that case or the dashboard shell squishes to fit above the keyboard
    const onResize = () => {
      if (isTypingTarget()) return
      setVh()
    }

    const forceRepaint = () => {
      // Force iOS Safari to recalculate layout after resume from background
      const el = document.documentElement
      el.style.setProperty('--_repaint', '1')
      void el.offsetHeight
      el.style.removeProperty('--_repaint')
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setVh()
        forceRepaint()
      }
    }

    const onFocus = () => { setVh(); forceRepaint() }

    const onPageShow = (e) => {
      if (e.persisted) {
        setVh()
        forceRepaint()
      }
    }

    // On orientationchange, wait for the resize to settle before measuring
    const onOrientationChange = () => {
      setTimeout(setVh, 150)
    }

    setVh()
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
