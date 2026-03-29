'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Activity, Book, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getTrackerById, getTrackerEntries, TRACKER_TYPES } from '../../../../lib/trackers'

export default function TrackerDetailPage({ params }) {
  const { id } = params
  const router = useRouter()
  const [tracker, setTracker] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [t, e] = await Promise.all([
          getTrackerById(id),
          getTrackerEntries(id)
        ])
        setTracker(t)
        setEntries(e)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const chartData = useMemo(() => {
    if (!entries.length || !tracker) return []
    
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
    
    const grouped = {}
    sorted.forEach(entry => {
      const d = entry.date
      if (!grouped[d]) grouped[d] = 0
      grouped[d] += entry.value === true ? 1 : Number(entry.value)
    })
    
    return Object.keys(grouped).map(date => ({
      date,
      value: grouped[date]
    }))
  }, [entries, tracker])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="text-gray-400 font-medium">Loading report...</div>
        </div>
      </div>
    )
  }
  
  if (!tracker) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-2xl font-bold">Tracker not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">Go back</button>
      </div>
    )
  }

  const isHabit = tracker.type === TRACKER_TYPES.HABIT

  return (
    <div className="space-y-6 pb-20">
      <button 
        onClick={() => router.back()} 
        className="flex items-center space-x-2 text-gray-400 hover:text-gray-900 transition-colors font-medium hover:-translate-x-1 duration-300"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Trackers</span>
      </button>

      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-10">
           <div 
             className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-[1.5rem] shadow-sm transform -rotate-3" 
             style={{ backgroundColor: `${tracker.color}15`, color: tracker.color }}
           >
             {isHabit ? <Activity className="w-8 h-8 sm:w-10 sm:h-10"/> : (tracker.type === TRACKER_TYPES.READING ? <Book className="w-8 h-8 sm:w-10 sm:h-10"/> : <Target className="w-8 h-8 sm:w-10 sm:h-10"/>)}
           </div>
           <div>
             <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{tracker.name}</h1>
             <div className="flex items-center space-x-2 mt-2">
               <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: `${tracker.color}15`, color: tracker.color }}>
                 {tracker.type}
               </span>
               <span className="text-gray-400 font-medium text-sm">Created {new Date(tracker.createdAt).toLocaleDateString()}</span>
             </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
           <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
             <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Total Logs</div>
             <div className="text-3xl font-extrabold text-gray-900">{entries.length}</div>
           </div>
           
           {!isHabit && (
             <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
               <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Total Amount</div>
               <div className="text-3xl font-extrabold" style={{ color: tracker.color }}>
                 {chartData.reduce((acc, curr) => acc + curr.value, 0)}
               </div>
             </div>
           )}

           {chartData.length > 0 && (
             <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
               <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Best Day Value</div>
               <div className="text-3xl font-extrabold text-gray-900">
                 {Math.max(...chartData.map(d => d.value))}
               </div>
             </div>
           )}
        </div>

        {/* Chart Area */}
        <div className="h-[450px] w-full mt-8 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <span>Activity Trend</span>
          </h3>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {isHabit ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: `${tracker.color}08`}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} 
                  />
                  <Bar dataKey="value" fill={tracker.color} radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={tracker.color} 
                    strokeWidth={4} 
                    dot={{fill: '#fff', stroke: tracker.color, strokeWidth: 3, r: 6}} 
                    activeDot={{r: 8, strokeWidth: 0, fill: tracker.color}} 
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full flex-col items-center justify-center text-gray-400 space-y-4">
               <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                 <Activity className="w-8 h-8 text-gray-300" />
               </div>
               <span className="font-medium">No activity data yet. Start logging!</span>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
