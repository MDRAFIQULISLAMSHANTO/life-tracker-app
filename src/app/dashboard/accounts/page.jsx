'use client'

import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Layers } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'

function computeAccountBalances({ accounts, transactions }) {
  const balances = {}
  accounts.forEach((a) => {
    balances[a.id] = Number(a.startingBalance || 0)
  })

  transactions.forEach((t) => {
    if (!t.accountId || balances[t.accountId] === undefined) return
    const amt = Number(t.amount || 0)
    if (t.type === 'expense') balances[t.accountId] -= amt
    else balances[t.accountId] += amt // income/loan/other treated as inflow for MVP
  })

  return balances
}

export default function AccountsPage() {
  const { user, loading } = useAuth()
  const { currency, accounts, transactions } = useFinance()

  const balances = useMemo(() => computeAccountBalances({ accounts, transactions }), [accounts, transactions])
  const total = useMemo(() => Object.values(balances).reduce((s, v) => s + Number(v || 0), 0), [balances])

  const [active, setActive] = useState(accounts[0]?.id || '')
  const activeTx = useMemo(() => {
    return transactions
      .filter((t) => t.accountId === active)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, active])

  if (loading) return <div className="text-text-secondary">Loading...</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Accounts</h1>
          <p className="text-gray-500 mt-2 font-medium">Balances and account-wise transaction list.</p>
        </div>
        <div className="bg-background-card rounded-2xl p-4 shadow-soft">
          <div className="text-xs font-bold tracking-wide text-text-secondary uppercase">Total balance</div>
          <div className="text-2xl font-extrabold text-text-primary">{formatCurrency(total, currency)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {accounts.map((a) => {
            const isActive = a.id === active
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setActive(a.id)}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-colors ${
                  isActive ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold">{a.name}</div>
                  <Layers className={`w-5 h-5 ${isActive ? 'text-white/90' : 'text-gray-400'}`} />
                </div>
                <div className={`mt-2 text-sm font-semibold ${isActive ? 'text-white/90' : 'text-text-secondary'}`}>
                  Balance: {formatCurrency(Number(balances[a.id] || 0), currency)}
                </div>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">
            Transactions ({accounts.find((a) => a.id === active)?.name || 'Account'})
          </h2>

          {activeTx.length === 0 ? (
            <div className="text-text-secondary">No transactions for this account yet.</div>
          ) : (
            <div className="space-y-3">
              {activeTx.map((t) => {
                const isExpense = t.type === 'expense'
                const Icon = isExpense ? ArrowDownCircle : ArrowUpCircle
                const color = isExpense ? 'text-danger bg-red-50' : 'text-success bg-green-50'
                return (
                  <div key={t.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50/40 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold text-text-primary truncate">
                          {t.category} <span className="text-text-secondary font-semibold">• {t.type}</span>
                        </div>
                        <div className={`font-extrabold whitespace-nowrap ${isExpense ? 'text-danger' : 'text-success'}`}>
                          {isExpense ? '-' : '+'}
                          {formatCurrency(Number(t.amount || 0), currency)}
                        </div>
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {t.date} {t.description ? `• ${t.description}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

