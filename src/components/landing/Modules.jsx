export default function Modules() {
  const modules = [
    {
      icon: '💰',
      title: 'Money Manager',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      description: 'Take complete control of your finances with intelligent tracking and insights.',
      features: [
        { text: 'Real-time income & expense tracking', benefit: 'See exactly where your money goes' },
        { text: 'Smart budget management', benefit: 'Set limits and stay on track automatically' },
        { text: 'Comprehensive monthly reports', benefit: 'Understand your spending patterns' },
        { text: 'Automatic categorization', benefit: 'Saves time, stays organized' },
        { text: 'Visual analytics & charts', benefit: 'Clear insights at a glance' },
      ],
    },
    {
      icon: '✅',
      title: 'Task Manager',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      description: 'Never miss a deadline with powerful task management and reminders.',
      features: [
        { text: 'Daily task organization', benefit: 'Stay focused and productive' },
        { text: 'Smart reminders & notifications', benefit: 'Never forget what matters' },
        { text: 'Priority-based workflow', benefit: 'Tackle the important stuff first' },
        { text: 'Progress tracking', benefit: 'See how much you\'ve accomplished' },
        { text: 'Recurring tasks & habits', benefit: 'Build consistency effortlessly' },
      ],
    },
    {
      icon: '🧠',
      title: 'Life Organizer',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      description: 'Keep your personal life organized with notes, events, and planning tools.',
      features: [
        { text: 'Quick notes & thoughts', benefit: 'Capture ideas instantly' },
        { text: 'Calendar & event management', benefit: 'Plan your days efficiently' },
        { text: 'Personal goal setting', benefit: 'Turn dreams into actionable plans' },
        { text: 'Smart search & organization', benefit: 'Find anything in seconds' },
        { text: 'Unified personal dashboard', benefit: 'Everything in one place' },
      ],
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary mb-6 tracking-tight">
          Everything you need
        </h2>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Three powerful modules designed to work together seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {modules.map((module, index) => (
          <div
            key={index}
            className={`relative bg-gradient-to-br ${module.bgGradient} p-8 rounded-2xl border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden`}
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.gradient} opacity-20 rounded-full blur-3xl`}></div>
            
            <div className="relative z-10">
              <div className="text-5xl mb-6">{module.icon}</div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">
                {module.title}
              </h3>
              <p className="text-text-secondary mb-6 leading-relaxed">
                {module.description}
              </p>
              <ul className="space-y-4">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="group">
                    <div className="flex items-start">
                      <span className={`w-2 h-2 bg-gradient-to-r ${module.gradient} rounded-full mr-3 mt-2 flex-shrink-0`}></span>
                      <div>
                        <div className="text-text-primary font-medium group-hover:text-primary transition-colors">
                          {feature.text}
                        </div>
                        <div className="text-sm text-text-secondary mt-1">
                          {feature.benefit}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

