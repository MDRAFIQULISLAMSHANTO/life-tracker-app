'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function CTA() {
  const router = useRouter()
  const sectionRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      gsap.from(containerRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 50,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        duration: 1.2,
        ease: 'power3.out',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-[#E5E5E5] py-20 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={containerRef}
          className="relative text-center bg-white border border-gray-200 rounded-3xl p-12 sm:p-16 shadow-lg"
        >
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Make your productivity more efficient.{' '}
              <span className="block mt-2 text-indigo-600">
                From this time.
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join thousands who have simplified their daily workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/signup')}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
