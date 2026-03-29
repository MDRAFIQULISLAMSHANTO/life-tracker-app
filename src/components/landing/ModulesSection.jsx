'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Wallet, CheckSquare, Brain } from 'lucide-react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function ModulesSection() {
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const modulesRef = useRef(null)

  const modules = [
    {
      icon: Wallet,
      title: 'Money Manager',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
      description: 'Track every transaction, set budgets, and watch your financial health grow.',
      features: [
        'Quick transaction logging',
        'Smart categorization',
        'Budget tracking',
        'Visual insights',
      ],
    },
    {
      icon: CheckSquare,
      title: 'Task Manager',
      gradient: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
      description: 'Organize tasks, set priorities, and never miss a deadline again.',
      features: [
        'Task creation & scheduling',
        'Priority management',
        'Progress tracking',
        'Smart reminders',
      ],
    },
    {
      icon: Brain,
      title: 'Life Organizer',
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
      description: 'Notes, events, and goals all in one place. Your personal command center.',
      features: [
        'Quick notes & thoughts',
        'Event planning',
        'Goal setting',
        'Unified dashboard',
      ],
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
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            duration: 1,
            ease: 'power3.out',
            immediateRender: false,
          }
        )
      }

      // Modules animation
      if (modulesRef.current) {
        const modulesArray = Array.from(modulesRef.current.children)
        gsap.set(modulesArray, { opacity: 1, y: 0 })
        
        gsap.fromTo(modulesArray,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: modulesRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            duration: 0.9,
            stagger: 0.15,
            ease: 'power3.out',
            immediateRender: false,
          }
        )

        // Animate feature items
        modulesArray.forEach((module, moduleIndex) => {
          const featureItems = module.querySelectorAll('.feature-item')
          if (featureItems.length > 0) {
            gsap.from(Array.from(featureItems), {
              opacity: 0,
              x: -20,
              scrollTrigger: {
                trigger: module,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
              duration: 0.5,
              delay: 0.3 + moduleIndex * 0.15,
              stagger: 0.08,
              ease: 'power2.out',
            })
          }
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div ref={titleRef} className="text-center mb-12 sm:mb-16 opacity-100">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Three powerful modules.{' '}
            <span className="text-indigo-600">
              One seamless flow.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your money, tasks, and life in one place.
          </p>
        </div>

        {/* Modules Grid */}
        <div ref={modulesRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 opacity-100">
          {modules.map((module, index) => {
            const Icon = module.icon
            return (
              <div
                key={index}
                className="relative bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 hover:shadow-md transition-shadow duration-200"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 ${module.iconBg} border ${module.borderColor} rounded-xl mb-4`}>
                  <Icon className={`w-6 h-6 ${module.iconColor}`} />
                </div>

                {/* Title & Description */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
                  {module.description}
                </p>

                {/* Features List */}
                <ul className="space-y-3">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="feature-item flex items-start">
                      <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${module.gradient} mt-2 mr-3`}></div>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Gradient accent at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.gradient} rounded-b-2xl opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
