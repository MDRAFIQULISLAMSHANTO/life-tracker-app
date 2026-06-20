'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, Send, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatters'

function buildFinanceContext(state) {
  const { currency, ledgerMonthKey, monthIncome, monthExpense, monthNet, accounts, loans, expenseByCategory, transactions } = state

  const totalBalance = accounts.reduce((s, a) => s + (a.startingBalance || 0), 0)

  const recentTxs = transactions.slice(0, 10).map((t) => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    description: t.description || '',
  }))

  const topExpenses = Object.entries(expenseByCategory || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => ({ category: cat, amount: amt }))

  const activeLoans = loans
    .map((l) => {
      const paid = (l.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0)
      const outstanding = Math.round((Number(l.amount || 0) - paid) * 100) / 100
      return {
        direction: l.direction === 'lent' ? 'lent' : 'borrowed',
        amount: l.amount,
        outstanding,
        reason: l.reason,
        person: l.person,
        borrowDate: l.borrowDate,
      }
    })
    .filter((l) => l.outstanding > 0)

  return {
    currency,
    ledgerMonth: ledgerMonthKey,
    monthIncome,
    monthExpense,
    monthNet,
    savingsRate: monthIncome > 0 ? Math.round((monthNet / monthIncome) * 100) : 0,
    totalAccountBalance: totalBalance,
    accountCount: accounts.length,
    activeLoans,
    topExpenseCategories: topExpenses,
    recentTransactions: recentTxs,
  }
}

const QUICK_PROMPTS = [
  'Summarize my finances this month',
  'Where am I overspending?',
  'How should I manage my loans?',
  'Give me savings tips based on my spending',
]

function Message({ msg, currency }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'}`}
        style={isUser
          ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }
          : { background: 'var(--input-bg)', color: 'var(--text-1)', border: '1px solid var(--card-border)' }
        }
      >
        {msg.content}
      </div>
    </div>
  )
}

function FinanceSummaryCard({ ctx, currency }) {
  if (!ctx || ctx.monthIncome === 0 && ctx.monthExpense === 0) return null

  const savingsColor = ctx.savingsRate >= 20 ? '#22c55e' : ctx.savingsRate >= 0 ? '#f59e0b' : '#ef4444'

  return (
    <div className="mx-3 mb-3 p-3.5 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
      <p className="text-xs font-bold mb-2.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
        {ctx.ledgerMonth} Snapshot
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-3)' }}>Income</p>
          <p className="text-sm font-extrabold" style={{ color: '#22c55e' }}>
            {formatCurrency(ctx.monthIncome, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-3)' }}>Expenses</p>
          <p className="text-sm font-extrabold" style={{ color: '#ef4444' }}>
            {formatCurrency(ctx.monthExpense, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-3)' }}>Net</p>
          <p className="text-sm font-extrabold" style={{ color: savingsColor }}>
            {formatCurrency(ctx.monthNet, currency)}
          </p>
        </div>
      </div>
      {ctx.savingsRate !== 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, ctx.savingsRate))}%`,
                background: savingsColor,
              }}
            />
          </div>
          <span className="text-xs font-bold shrink-0" style={{ color: savingsColor }}>
            {ctx.savingsRate}% saved
          </span>
        </div>
      )}
    </div>
  )
}

export default function AiAdvisor() {
  const finance = useFinance()
  const { currency, monthIncome, monthExpense, monthNet, accounts, loans, expenseByCategory, transactions, ledgerMonthKey } = finance

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const finCtx = buildFinanceContext({ currency, ledgerMonthKey, monthIncome, monthExpense, monthNet, accounts, loans, expenseByCategory, transactions })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = monthIncome > 0 || monthExpense > 0
        ? `Hi! I'm Livio AI, your personal financial advisor. I can see your ${ledgerMonthKey} data — you've earned ${formatCurrency(monthIncome, currency)} and spent ${formatCurrency(monthExpense, currency)} this month. What would you like to explore?`
        : `Hi! I'm Livio AI, your personal financial advisor. Start tracking your income and expenses in Livio and I'll analyze your patterns, suggest optimizations, and give you personalized advice. What would you like to know?`
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 80)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, messages])

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return

    setInput('')
    setError('')
    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          financeContext: finCtx,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Request failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API key.')
    } finally {
      setLoading(false)
    }
  }, [messages, input, loading, finCtx])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const portal = typeof document !== 'undefined' ? document.body : null

  const floatingUI = (
    <>
      {/* Floating trigger button — left on mobile (FAB is right), right on desktop */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed z-[55] flex items-center justify-center transition-all active:scale-95 left-5 lg:left-5"
        style={{
          bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))',
          width: 42,
          height: 42,
          borderRadius: 14,
          background: '#1a1a1f',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
        }}
        aria-label={open ? 'Close AI advisor' : 'Open AI advisor'}
      >
        {open
          ? <X className="w-4.5 h-4.5" style={{ color: 'rgba(255,255,255,0.75)' }} />
          : <Sparkles className="w-4.5 h-4.5" style={{ color: 'rgba(255,255,255,0.75)' }} />
        }
      </button>

      {/* Chat popup */}
      {open && (
        <div
          className="fixed z-[55] flex flex-col overflow-hidden shadow-2xl left-3 right-3 lg:right-auto lg:left-4"
          style={{
            bottom: 'calc(max(1.5rem, env(safe-area-inset-bottom) + 1rem) + 52px)',
            width: 'auto',
            maxWidth: 380,
            height: 'min(460px, calc(100vh - 12rem))',
            borderRadius: 20,
            background: 'var(--surface)',
            border: '1px solid var(--card-border)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              borderBottom: '1px solid var(--card-border)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
            }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm leading-none" style={{ color: 'var(--text-1)' }}>Livio AI</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Personal financial advisor</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl transition-colors hover:opacity-70">
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-3 scroll-touch">
            <FinanceSummaryCard ctx={finCtx} currency={currency} />

            <div className="px-3">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} currency={currency} />
              ))}

              {loading && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md text-sm"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}>
                    Thinking…
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 mb-3 px-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                  <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick prompts — only show when no messages from user yet */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 whitespace-nowrap"
                  style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="flex items-end gap-2 px-3 py-3 shrink-0"
            style={{ borderTop: '1px solid var(--card-border)' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your finances…"
              rows={1}
              className="flex-1 resize-none rounded-2xl px-3.5 py-2.5 text-sm outline-none leading-relaxed"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-1)',
                maxHeight: 80,
                minHeight: 42,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center shrink-0 rounded-xl transition-all active:scale-95 disabled:opacity-40"
              style={{
                width: 42,
                height: 42,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )

  return portal ? createPortal(floatingUI, portal) : null
}
