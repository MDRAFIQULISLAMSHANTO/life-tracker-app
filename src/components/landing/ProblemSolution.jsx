'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Wallet, Clock, Infinity } from 'lucide-react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function ProblemSolution() {
  const sectionRef = useRef(null)
  const problemsRef = useRef(null)
  const solutionRef = useRef(null)

  const problems = [
    {
      title: 'Scattered finance tracking',
      description: 'Multiple apps, endless spreadsheets, no clear view of your financial health.',
      icon: Wallet,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Missed tasks & reminders',
      description: 'Important deadlines slip through the cracks, causing stress and missed opportunities.',
      icon: Clock,
      iconColor: 'text-pink-600',
      iconBg: 'bg-pink-50',
      borderColor: 'border-pink-100',
    },
    {
      title: 'No single life system',
      description: 'Everything is disconnected and hard to manage. Your life deserves better organization.',
      icon: Infinity,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
  ]

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      if (problemsRef.current && problemsRef.current.children) {
        const problemsArray = Array.from(problemsRef.current.children)
        gsap.set(problemsArray, { opacity: 1, y: 0 })
        gsap.fromTo(problemsArray,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: problemsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out',
            immediateRender: false,
          }
        )
      }

      if (solutionRef.current) {
        gsap.set(solutionRef.current, { opacity: 1, scale: 1 })
        gsap.fromTo(solutionRef.current,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              trigger: solutionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            duration: 1,
            ease: 'power3.out',
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
        {/* Problems Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The problems you face
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Managing your life shouldn't be this complicated
          </p>
        </div>

        <div ref={problemsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 hover:shadow-md transition-shadow duration-200"
              >
                <div className={`w-14 h-14 ${problem.iconBg} border ${problem.borderColor} rounded-lg flex items-center justify-center mb-4`}>
                  <IconComponent className={`w-7 h-7 ${problem.iconColor}`} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {problem.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{problem.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Solution Section - Full Width */}
      <div 
        ref={solutionRef}
        className="relative w-full bg-white border-y border-gray-200 py-16 sm:py-20 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
            One dashboard.{' '}
            <span className="block sm:inline">One flow.{' '}</span>
            <span className="text-indigo-600">
              One system.
            </span>
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Livio brings everything together in a simple, focused interface that grows with you. Experience the power of unified life management.
          </p>
        </div>
      </div>
    </section>
  )
}
