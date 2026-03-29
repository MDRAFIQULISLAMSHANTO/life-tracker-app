'use client'
import { Activity, Book, Target, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { TRACKER_TYPES } from '../../lib/trackers'

export default function TrackerCard({ tracker, onLogAction }) {
  const getIcon = () => {
    switch (tracker.type) {
      case TRACKER_TYPES.HABIT: return Activity
      case TRACKER_TYPES.READING: return Book
      case TRACKER_TYPES.GOAL: return Target
      default: return Activity
    }
  }

  const IconComponent = getIcon()

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transform hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
      {/* Decorative gradient background slice */}
      <div 
        className="absolute -right-16 -top-16 w-40 h-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-2xl" 
        style={{ backgroundColor: tracker.color }} 
      />
      
      <div className="flex items-center space-x-4 mb-6 relative z-10">
        <div 
          className="p-4 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" 
          style={{ backgroundColor: `${tracker.color}15`, color: tracker.color }}
        >
          <IconComponent className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{tracker.name}</h3>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">
            {tracker.type} Tracker
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-8 relative z-10">
        <button 
          onClick={() => onLogAction(tracker)} 
          className="flex items-center justify-center space-x-2 py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          style={{ backgroundColor: tracker.color }}
        >
          <Plus className="w-5 h-5" />
          <span>Log</span>
        </button>
        <Link 
          href={`/dashboard/trackers/${tracker.id}`}
          className="flex items-center justify-center space-x-2 py-3.5 px-4 text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:shadow-md hover:border-gray-300 transition-all duration-300 hover:-translate-y-0.5"
        >
          <span>Report</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>
    </div>
  )
}
