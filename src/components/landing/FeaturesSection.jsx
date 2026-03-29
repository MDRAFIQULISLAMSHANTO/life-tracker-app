'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Shield, Zap, Smartphone, Lock, BarChart, Users } from 'lucide-react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function FeaturesSection() {
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const featuresRef = useRef(null)

  const features = [
    {
      icon: Shield,
      title: 'Bank-level security',
      description: 'Your data is encrypted and protected with industry-leading security measures.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Zap,
      title: 'Lightning fast',
      description: 'Built for speed. Access your information instantly, no waiting, no lag.',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Smartphone,
      title: 'Mobile-first design',
      description: 'Works perfectly on any device. Your dashboard is always with you.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Lock,
      title: 'Privacy focused',
      description: 'Your data stays yours. We never sell or share your personal information.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: BarChart,
      title: 'Smart analytics',
      description: 'Get insights into your spending patterns, productivity, and goals.',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Users,
      title: 'Collaboration ready',
      description: 'Share and collaborate with your team or family when you need to.',
      gradient: 'from-red-500 to-pink-500',
    },
  ]

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
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

      if (featuresRef.current && featuresRef.current.children) {
        const featuresArray = Array.from(featuresRef.current.children)
        gsap.set(featuresArray, { opacity: 1, y: 0, scale: 1 })
        gsap.fromTo(featuresArray,
          { opacity: 0, y: 60, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.2)',
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
        <div ref={titleRef} className="text-center mb-12 sm:mb-16 opacity-100">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Powerful features for{' '}
            <span className="text-indigo-600">
              modern life
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to stay organized, productive, and in control.
          </p>
        </div>

        <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 opacity-100">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl hover:shadow-md transition-shadow duration-200"
              >
                <div className={`inline-flex p-3 sm:p-4 bg-gradient-to-r ${feature.gradient} rounded-xl mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
