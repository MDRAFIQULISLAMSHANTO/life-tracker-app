'use client'

import Navbar from '../../components/landing/Navbar'
import Footer from '../../components/landing/Footer'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      description: 'Perfect for getting started',
      features: [
        'Unlimited expenses tracking',
        'Basic task management',
        'Notes and reminders',
        'Monthly reports',
        'Mobile access',
      ],
      cta: 'Get Started Free',
      primary: true,
    },
    {
      name: 'Pro',
      price: 'Coming Soon',
      period: '',
      description: 'Advanced features for power users',
      features: [
        'Everything in Free',
        'Advanced analytics',
        'Custom categories',
        'Export capabilities',
        'Priority support',
        'Team collaboration',
      ],
      cta: 'Notify Me',
      primary: false,
      comingSoon: true,
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Pricing
          </h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-600 sm:text-lg">
            Simple, transparent pricing for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl border-2 p-8 ${
                plan.primary ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-text-primary">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-text-secondary ml-2">
                      /{plan.period}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.comingSoon) {
                    // Handle coming soon
                    return
                  }
                  router.push('/signup')
                }}
                disabled={plan.comingSoon}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.primary
                    ? 'bg-primary text-white hover:bg-primary-600'
                    : 'bg-white text-text-primary border border-gray-300 hover:bg-gray-50'
                } ${plan.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}


