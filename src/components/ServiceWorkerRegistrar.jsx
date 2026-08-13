'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // In dev the SW's cache-first rule for /_next/static serves stale chunks
      // after an edit, which looks like "my change didn't apply". Register only
      // in production, and actively tear down any SW left over from a dev session.
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister())
        }).catch(() => {})
        if (typeof caches !== 'undefined') {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
        }
      }
    }

    // NOTE: this component deliberately no longer computes a `--vh` custom
    // property from window.innerHeight.
    //
    // That hack squished the whole app whenever the on-screen keyboard opened,
    // and a guard that skipped recalculating "while an input is focused" made
    // it worse: on iOS the keyboard's resize can fire BEFORE focus lands on the
    // input, so --vh got written at the keyboard-shrunk height and then every
    // later resize was skipped because the input was focused by then. The bad
    // value stuck until something resized with nothing focused — i.e. an app
    // restart. Layout height now comes from CSS `dvh` alone, which the browser
    // keeps correct across keyboard show/hide without any help from us.

    const forceRepaint = () => {
      // iOS Safari can resume from background with a stale compositing layer.
      const el = document.documentElement
      el.style.setProperty('--_repaint', '1')
      void el.offsetHeight
      el.style.removeProperty('--_repaint')
    }

    // iOS sometimes leaves the window scrolled after the keyboard closes, which
    // pushes the fixed shell off screen. The app's own scrolling happens in an
    // inner container, so the window itself should always sit at 0.
    const resetStrayScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') forceRepaint()
    }
    const onFocus = () => forceRepaint()
    const onPageShow = (e) => {
      if (e.persisted) forceRepaint()
    }
    const onFocusOut = () => {
      // Let the keyboard finish animating away before measuring.
      setTimeout(resetStrayScroll, 100)
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('orientationchange', forceRepaint)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('orientationchange', forceRepaint)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return null
}
