'use client'
import { useEffect, useState } from 'react'
import { X, Activity, Book, Target } from 'lucide-react'
import { TRACKER_TYPES, createTracker } from '../../lib/trackers'
import { useAuth } from '../../context/AuthContext'

export default function CreateTrackerModal({ isOpen, onClose, onCreated, initialName, initialType, initialColor }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [type, setType] = useState(initialType || TRACKER_TYPES.HABIT)
  const [color, setColor] = useState(initialColor || '#3b82f6')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setName(initialName || '')
    setType(initialType || TRACKER_TYPES.HABIT)
    setColor(initialColor || '#3b82f6')
    setLoading(false)
  }, [isOpen, initialName, initialType, initialColor])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const newTracker = await createTracker(user.uid, { name, type, color })
      if (onCreated) onCreated(newTracker)
      onClose()
      setName('')
      setType(TRACKER_TYPES.HABIT)
      setColor('#3b82f6')
    } catch (error) {
      console.error('Failed to create tracker', error)
    } finally {
      setLoading(false)
    }
  }

  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
    '#8b5cf6', '#d946ef', '#f43f5e', '#14b8a6'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden transform transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: color }} />
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">New Tracker</h2>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Name</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all duration-300 placeholder-gray-400" 
                placeholder="e.g. Meditate daily, Read 50 pages" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Format</label>
              <div className="relative">
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all duration-300 appearance-none"
                >
                  <option value={TRACKER_TYPES.HABIT}>Habit (Yes/No)</option>
                  <option value={TRACKER_TYPES.READING}>Reading (Pages/Books)</option>
                  <option value={TRACKER_TYPES.GOAL}>Goal (Numeric Progress)</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  {type === TRACKER_TYPES.HABIT && <Activity className="w-5 h-5 text-gray-400" />}
                  {type === TRACKER_TYPES.READING && <Book className="w-5 h-5 text-gray-400" />}
                  {type === TRACKER_TYPES.GOAL && <Target className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Theme Color</label>
              <div className="flex flex-wrap gap-3">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full transition-transform duration-300 hover:scale-110 flex items-center justify-center ${color === c ? 'shadow-lg ring-4 ring-offset-2 ring-gray-200 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 text-white hover:opacity-90 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                style={{ backgroundColor: color }}
              >
                {loading ? 'Creating...' : 'Create Tracker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
