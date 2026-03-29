'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

function DailyTrendChart({ data = [] }) {
  const { currency } = useFinance()
  const code = String(currency || 'USD').toUpperCase()

  // Sample data structure: [{ date: '01', income: 1200, expense: 800 }]
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-text-primary mb-3">Day {label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-text-secondary">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-text-primary">{formatCurrency(entry.value, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="dashboard-glass-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-text-primary">Monthly Income & Expense Trend</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-text-secondary">Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-sm text-text-secondary">Expense</span>
          </div>
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const v = Number(value)
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k ${code}`
                return `${v} ${code}`
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fill="url(#colorIncome)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expense"
              stroke="#DC2626"
              strokeWidth={2.5}
              fill="url(#colorExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-text-secondary">
          <p>No trend data available</p>
        </div>
      )}
    </div>
  )
}

export default DailyTrendChart