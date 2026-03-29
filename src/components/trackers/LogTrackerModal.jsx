'use client'
import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { TRACKER_TYPES, addTrackerEntry } from '../../lib/trackers'
import { useAuth } from '../../context/AuthContext'

export default function LogTrackerModal({ isOpen, onClose, tracker, onLogged }) {
  const { user } = useAuth()
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !tracker) return null

  const isHabit = tracker.type === TRACKER_TYPES.HABIT

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    
    let finalValue = value;
    if (isHabit) finalValue = true;
    else finalValue = Number(value);

    try {
      const entry = await addTrackerEntry(tracker.id, user.uid, { value: finalValue, notes })
      if (onLogged) onLogged(entry)
      onClose()
      setValue('')
      setNotes('')
    } catch (error) {
      console.error('Failed to log entry', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-3" style={{ backgroundColor: tracker.color }} />
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tracker.name}</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">Log new entry</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 -mt-4 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isHabit && (
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Amount / Progress</label>
                <input 
                  type="number" 
                  required 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  className="w-full px-4 py-3 text-lg font-medium bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:border-transparent outline-none transition-all duration-300" 
                  style={{ '--tw-ring-color': `${tracker.color}40`, ':focus': { borderColor: tracker.color } }}
                  placeholder="e.g. 5" 
                />
              </div>
            )}
            
            {isHabit && (
              <div className="p-4 rounded-2xl flex items-center space-x-3 mb-2 border" style={{ borderColor: `${tracker.color}30`, backgroundColor: `${tracker.color}10` }}>
                <CheckCircle2 className="w-6 h-6" style={{ color: tracker.color }} />
                <span className="font-semibold text-gray-800">Mark as completed for today</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Notes (Optional)</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all duration-300 resize-none h-24" 
                placeholder="How did it go?" 
              />
            </div>
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-100 disabled:opacity-50"
                style={{ backgroundColor: tracker.color, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
