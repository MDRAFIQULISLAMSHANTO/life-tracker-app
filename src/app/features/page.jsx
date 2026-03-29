'use client'

import Navbar from '../../components/landing/Navbar'
import Footer from '../../components/landing/Footer'

export default function FeaturesPage() {
  const modules = [
    {
      icon: '💰',
      title: 'Money Manager',
      description: 'Take control of your finances with comprehensive tracking and insights.',
      features: [
        'Track income and expenses in real-time',
        'Set and monitor monthly budgets',
        'Generate detailed financial reports',
        'Categorize transactions automatically',
        'View spending trends and patterns',
        'Export data for tax preparation',
      ],
    },
    {
      icon: '✅',
      title: 'Task Manager',
      description: 'Stay organized and never miss important deadlines or reminders.',
      features: [
        'Create and manage daily tasks',
        'Set reminders for important events',
        'Organize tasks by priority and category',
        'Track task completion progress',
        'Schedule recurring tasks',
        'Focus mode for distraction-free work',
      ],
    },
    {
      icon: '🧠',
      title: 'Life Organizer',
      description: 'Keep your personal life organized with notes, events, and planning tools.',
      features: [
        'Quick notes and personal thoughts',
        'Calendar integration for events',
        'Personal planning and goal setting',
        'Organize information by topics',
        'Search through all your content',
        'Access everything from one place',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Features
          </h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-600 sm:text-lg">
            Three powerful modules designed to work together seamlessly.
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {modules.map((module, index) => (
            <div key={index} className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10 md:p-12 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="text-6xl mb-4">{module.icon}</div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {module.title}
                  </h2>
                  <p className="text-text-secondary">{module.description}</p>
                </div>
                <div className="flex-1">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}


