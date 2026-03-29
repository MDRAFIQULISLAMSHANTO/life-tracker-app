'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

const COLORS = [
  '#4F46E5', // primary
  '#10B981', // success
  '#F59E0B', // warning
  '#EF4444', // danger
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
]

function ExpenseBarChart({ data = [] }) {
  // Sample data structure: [{ name: 'Food', value: 8500 }]
  const { currency } = useFinance()
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = data.total ? ((data.value / data.total) * 100).toFixed(1) : '0'
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-text-primary mb-1">{data.name}</p>
          <p className="text-lg font-bold text-text-primary mb-1">{formatCurrency(data.value, currency)}</p>
          <p className="text-sm text-text-secondary">{percentage}% of total</p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-background-card rounded-2xl p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Expense by Category</h3>
        <div className="text-sm text-text-secondary">
          Total: <span className="font-semibold text-text-primary">{formatCurrency(total, currency)}</span>
        </div>
      </div>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={data.map(item => ({ ...item, total }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '12px', fontWeight: '500' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `৳${(value / 1000).toFixed(0)}k`
                  return `৳${value}`
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1)
              return (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-text-primary">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.value)}</p>
                    <p className="text-xs text-text-secondary">{percentage}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-text-secondary">
          <p>No expense data available</p>
        </div>
      )}
    </div>
  )
}

export default ExpenseBarChart