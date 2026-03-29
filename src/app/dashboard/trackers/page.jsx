'use client'
import { useEffect, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getUserTrackers, createTracker } from '../../../lib/trackers'
import TrackerCard from '../../../components/trackers/TrackerCard'
import CreateTrackerModal from '../../../components/trackers/CreateTrackerModal'
import LogTrackerModal from '../../../components/trackers/LogTrackerModal'

export default function TrackersPage() {
  const { user } = useAuth()
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [loggingTracker, setLoggingTracker] = useState(null)
  const [createDefaults, setCreateDefaults] = useState({
    initialName: '',
    initialType: 'habit',
    initialColor: '#3b82f6',
  })

  useEffect(() => {
    if (user) {
      loadTrackers()
    }
  }, [user])

  const loadTrackers = async () => {
    try {
      const data = await getUserTrackers(user.uid)
      setTrackers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedTemplates = async () => {
    if (!user) return
    setLoading(true)
    await createTracker(user.uid, { name: 'Read 20 Pages', type: 'reading', color: '#8b5cf6' })
    await createTracker(user.uid, { name: 'Morning Workout', type: 'habit', color: '#10b981' })
    await createTracker(user.uid, { name: 'Save $1000', type: 'goal', color: '#3b82f6' })
    await loadTrackers()
  }

  const templates = [
    {
      title: 'Habit Tracker',
      description: 'Yes/No daily habits. Create and track completion.',
      type: 'habit',
      icon: 'habit',
      color: '#10b981',
      suggestedName: 'Drink Water',
    },
    {
      title: 'Reading Tracker',
      description: 'Track pages/books. Great for consistent reading goals.',
      type: 'reading',
      icon: 'reading',
      color: '#8b5cf6',
      suggestedName: 'Read 20 Pages',
    },
    {
      title: 'Goal Tracker',
      description: 'Numeric progress goals you can measure over time.',
      type: 'goal',
      icon: 'goal',
      color: '#3b82f6',
      suggestedName: 'Save $1000',
    },
  ]

  const openCreateFromTemplate = (t) => {
    setCreateDefaults({
      initialName: t.suggestedName,
      initialType: t.type,
      initialColor: t.color,
    })
    setIsCreateOpen(true)
  }

  if (loading && trackers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="text-gray-400 font-medium">Loading your trackers...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Trackers</h1>
          <p className="text-gray-500 mt-2 font-medium">Build habits, monitor goals, and achieve more.</p>
        </div>
        <button 
          onClick={() => {
            setCreateDefaults({ initialName: '', initialType: 'habit', initialColor: '#3b82f6' })
            setIsCreateOpen(true)
          }}
          className="inline-flex items-center justify-center px-6 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Tracker</span>
        </button>
      </div>

      {/* Templates */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-[2.5rem] p-6 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Tracker Templates</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Pick a template to start fast (habit, reading, or goal). You can edit the name, color, and type before saving.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSeedTemplates}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1"
            >
              Add Starter Templates
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.type} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center" style={{ backgroundColor: `${t.color}15`, color: t.color }}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: t.color }} />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-gray-900">{t.title}</div>
                  <div className="text-xs uppercase font-bold tracking-wider text-gray-400">{t.type}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{t.description}</p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => openCreateFromTemplate(t)}
                  className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State / Templates Promo */}
      {trackers.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-[2.5rem] p-10 md:p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">You don't have any trackers yet!</h2>
          <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Create a custom tracker from scratch, or start instantly with our proven templates for reading, habits, and financial goals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleSeedTemplates}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1"
            >
              Add Starter Templates
            </button>
            <button 
              onClick={() => {
                setCreateDefaults({ initialName: '', initialType: 'habit', initialColor: '#3b82f6' })
                setIsCreateOpen(true)
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl border-2 border-gray-200 hover:border-gray-900 transition-all"
            >
              Create My Own
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {trackers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trackers.map((tracker) => (
            <TrackerCard 
              key={tracker.id} 
              tracker={tracker} 
              onLogAction={(t) => setLoggingTracker(t)} 
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTrackerModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={(t) => setTrackers([t, ...trackers])}
        initialName={createDefaults.initialName}
        initialType={createDefaults.initialType}
        initialColor={createDefaults.initialColor}
      />
      
      <LogTrackerModal 
        isOpen={!!loggingTracker} 
        onClose={() => setLoggingTracker(null)} 
        tracker={loggingTracker}
        onLogged={(entry) => {
          // Could show a toast success message here
          console.log("Logged successfully", entry)
        }}
      />
    </div>
  )
}
