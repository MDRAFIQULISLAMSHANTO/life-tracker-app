'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

const COLORS = ['#5B6EFA', '#34C896', '#F0B354', '#F4728D', '#9D8BFA', '#E879B8', '#3EB7EE']

function ExpenseDonutChart({ data = [] }) {
  // Sample data structure: [{ name: 'Food', value: 8500 }]
  const { currency } = useFinance()
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / data.total) * 100).toFixed(1)
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
    <div className="dashboard-glass-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Expense Breakdown</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Expense by Category</span>
          <div className="text-sm text-text-secondary">
            Total: <span className="font-semibold text-text-primary">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>
      {data.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          <div className="w-full lg:w-2/3 flex justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.map(item => ({ ...item, total }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  innerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/3">
            <div className="space-y-3">
              {data.map((item, index) => {
                const percentage = ((item.value / total) * 100).toFixed(1)
                return (
                  <div 
                    key={item.name} 
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-text-primary truncate">{item.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-text-primary leading-tight">{formatCurrency(item.value, currency)}</p>
                      <p className="text-xs text-text-secondary leading-tight">{percentage}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-text-secondary">
          <p>No expense data available</p>
        </div>
      )}
    </div>
  )
}

export default ExpenseDonutChart