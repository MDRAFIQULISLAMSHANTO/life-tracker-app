'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function WhySection() {
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const cardsRef = useRef(null)

  const reasons = [
    {
      title: 'Simple by design',
      description: 'No clutter, no confusion. Just what you need, when you need it.',
      icon: '✨',
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
    {
      title: 'Built for daily use',
      description: 'Fast, reliable, and always ready when you are. Designed for real life.',
      icon: '⚡',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
    {
      title: 'Mobile-first',
      description: 'Works beautifully on every device. Your life, anywhere you go.',
      icon: '📱',
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
    {
      title: 'Private & secure',
      description: 'Your data stays yours. Always. Bank-level security for your personal information.',
      icon: '🔒',
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
  ]

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      // Title animation
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 1, y: 0 })
        gsap.fromTo(titleRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            duration: 1,
            ease: 'power3.out',
            immediateRender: false,
          }
        )
      }

      // Cards animation
      if (cardsRef.current && cardsRef.current.children) {
        const cardsArray = Array.from(cardsRef.current.children)
        gsap.set(cardsArray, { opacity: 1, y: 0, scale: 1 })
        gsap.fromTo(cardsArray,
          { opacity: 0, y: 60, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            duration: 0.8,
            stagger: 0.15,
            ease: 'back.out(1.4)',
            immediateRender: false,
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 sm:py-24 lg:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center mb-16 opacity-100">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Why choose{' '}
            <span className="text-indigo-600">
              Livio
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with care, designed for you.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-100">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className={`relative ${reason.bgColor} border ${reason.borderColor} p-6 rounded-2xl hover:shadow-md transition-shadow duration-200 overflow-hidden group`}
              >
              
              <div className="relative z-10">
                <div className="text-4xl mb-4">{reason.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {reason.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
