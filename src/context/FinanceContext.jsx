'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants'
import { isValidCurrencyCode } from '../utils/currencyOptions'
import { subscribeUserPayloadDoc, writeUserPayloadDoc } from '../lib/firestoreUserSync'
import { mergeOneTimeDemoFinance, DEMO_FINANCE_KEY } from '../lib/demoFinanceData'

const FinanceContext = createContext(null)

function safeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function monthKeyFromDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const STORAGE_KEY = 'livio_finance_v1'
const FS_PATH = ['liver', 'finance']

/** No demo transactions — real ledger starts empty */
export function emptyFinance() {
  return {
    currency: CURRENCIES.BDT,
    ledgerMonthKey: monthKeyFromDate(new Date()),
    expenseCategories: [...EXPENSE_CATEGORIES],
    incomeCategories: [...INCOME_CATEGORIES, 'Savings transfer'],
    otherCategories: ['Other'],
    accounts: [
      { id: 'acc_cash', name: 'Cash', startingBalance: 0 },
      { id: 'acc_bank', name: 'Bank', startingBalance: 0 },
    ],
    transactions: [],
    loans: [],
    budgetsByMonth: {},
  }
}

/** Normalize one loan, migrating legacy shape (addToIncome, no direction/repayments). */
function normalizeLoan(raw) {
  if (!raw || typeof raw !== 'object') return null
  const direction = raw.direction === 'lent' ? 'lent' : 'borrowed'
  const countInFinance =
    typeof raw.countInFinance === 'boolean'
      ? raw.countInFinance
      : typeof raw.addToIncome === 'boolean'
        ? raw.addToIncome // legacy field
        : false
  const repayments = Array.isArray(raw.repayments)
    ? raw.repayments
        .map((r) => ({
          id: r?.id || safeId(),
          amount: Math.max(0, Math.round(Number(r?.amount || 0) * 100) / 100),
          date: r?.date ? String(r.date).slice(0, 10) : todayISODate(),
          note: String(r?.note || '').trim(),
        }))
        .filter((r) => r.amount > 0)
    : []
  const borrowDate = raw.borrowDate ? String(raw.borrowDate).slice(0, 10) : todayISODate()
  return {
    id: raw.id || safeId(),
    direction,
    amount: Math.max(0, Math.round(Number(raw.amount || 0) * 100) / 100),
    person: String(raw.person || '').trim(),
    borrowDate,
    extendedDate: raw.extendedDate ? String(raw.extendedDate).slice(0, 10) : borrowDate,
    reason: String(raw.reason || '').trim(),
    countInFinance,
    repayments,
  }
}

export function loanPaid(loan) {
  return (loan.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0)
}

export function loanOutstanding(loan) {
  return Math.round((Number(loan.amount || 0) - loanPaid(loan)) * 100) / 100
}

/**
 * Rebuild the cash transactions linked to a loan (tagged sourceLoanId).
 * borrowed: principal=income, repayment=expense. lent: principal=expense, repayment=income.
 * Returns [] when countInFinance is off (pure tracking, no balance effect).
 */
function buildLoanTransactions(loan, accountId) {
  if (!loan.countInFinance) return []
  const personTo = loan.person ? ` to ${loan.person}` : ''
  const personFrom = loan.person ? ` from ${loan.person}` : ''
  const txs = [
    {
      id: safeId(),
      type: loan.direction === 'borrowed' ? 'income' : 'expense',
      amount: loan.amount,
      category: 'Loans',
      description:
        `Loan ${loan.direction === 'borrowed' ? 'borrowed' : 'given'}` +
        `${loan.direction === 'borrowed' ? personFrom : personTo}` +
        `${loan.reason ? `: ${loan.reason}` : ''}`,
      date: loan.borrowDate,
      accountId,
      sourceLoanId: loan.id,
      loanLeg: 'principal',
    },
  ]
  ;(loan.repayments || []).forEach((r) => {
    txs.push({
      id: safeId(),
      type: loan.direction === 'borrowed' ? 'expense' : 'income',
      amount: r.amount,
      category: 'Loans',
      description: `Loan repayment${loan.direction === 'borrowed' ? personTo : personFrom}${r.note ? `: ${r.note}` : ''}`,
      date: r.date,
      accountId,
      sourceLoanId: loan.id,
      loanLeg: 'repayment',
      loanRepaymentId: r.id,
    })
  })
  return txs
}

function normalizeFinancePayload(raw) {
  const base = emptyFinance()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    currency:
      typeof raw.currency === 'string' && raw.currency.length >= 3 && raw.currency.length <= 4
        ? raw.currency.toUpperCase()
        : base.currency,
    ledgerMonthKey: (() => {
      const stored = typeof raw.ledgerMonthKey === 'string' && /^\d{4}-\d{2}$/.test(raw.ledgerMonthKey)
        ? raw.ledgerMonthKey : base.ledgerMonthKey
      const current = monthKeyFromDate(new Date())
      return stored < current ? current : stored
    })(),
    expenseCategories: Array.isArray(raw.expenseCategories) && raw.expenseCategories.length
      ? raw.expenseCategories
      : base.expenseCategories,
    incomeCategories: Array.isArray(raw.incomeCategories) && raw.incomeCategories.length
      ? raw.incomeCategories
      : base.incomeCategories,
    otherCategories: Array.isArray(raw.otherCategories) && raw.otherCategories.length
      ? raw.otherCategories
      : base.otherCategories,
    accounts: Array.isArray(raw.accounts) && raw.accounts.length ? raw.accounts : base.accounts,
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    loans: Array.isArray(raw.loans) ? raw.loans.map(normalizeLoan).filter(Boolean) : [],
    budgetsByMonth: raw.budgetsByMonth && typeof raw.budgetsByMonth === 'object' ? raw.budgetsByMonth : {},
  }
}

function loadFinanceFromStorage() {
  if (typeof window === 'undefined') return emptyFinance()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyFinance()
    const parsed = JSON.parse(raw)
    return normalizeFinancePayload(parsed)
  } catch {
    return emptyFinance()
  }
}

function monthKeyFromParts(year, month1to12) {
  return `${year}-${String(month1to12).padStart(2, '0')}`
}

export function transactionsInMonth(transactions, monthKey) {
  if (!monthKey) return []
  return transactions.filter((t) => t.date && String(t.date).slice(0, 7) === monthKey)
}

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  // Start empty so the server-rendered HTML matches the first client render
  // (localStorage is read after mount, below) — avoids React hydration error #418.
  const [state, setState] = useState(emptyFinance)
  const stateRef = useRef(state)
  const applyingRemoteRef = useRef(false)
  const seededCloudRef = useRef(false)
  const remoteReadyRef = useRef(false)
  const writeTimerRef = useRef(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Load the local cache after mount (post-hydration)
  useEffect(() => {
    const local = loadFinanceFromStorage()
    hydratedRef.current = true
    setState(local)
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Unable to persist finance state:', e)
    }
  }, [state])

  useEffect(() => {
    seededCloudRef.current = false
    remoteReadyRef.current = false
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return () => {}
    const unsub = subscribeUserPayloadDoc({
      userId: user.uid,
      pathSegments: FS_PATH,
      onRemote: ({ exists, payload }) => {
        if (!exists) {
          remoteReadyRef.current = true
          if (!seededCloudRef.current) {
            seededCloudRef.current = true
            writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
          }
          return
        }
        remoteReadyRef.current = true
        if (payload && typeof payload === 'object') {
          const next = normalizeFinancePayload(payload)
          // Already in sync — don't re-render or churn the applyingRemote flag.
          if (JSON.stringify(next) === JSON.stringify(stateRef.current)) return
          // A local edit is queued (newer than this snapshot) — let our pending
          // write win instead of reverting the user's change.
          if (writeTimerRef.current) return
          applyingRemoteRef.current = true
          setState(next)
        }
      },
    })
    return unsub
  }, [user?.uid])


  useEffect(() => {
    if (!user?.uid) return
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false
      return
    }
    // Don't write until Firestore has confirmed the doc state (exists or not)
    // — prevents overwriting real data with empty localStorage on login
    if (!remoteReadyRef.current) return
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      writeTimerRef.current = null
      writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
    }, 450)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [state, user?.uid])

  // Flush pending write immediately when the tab/app backgrounds or closes —
  // mobile suspends timers aggressively, so the 450ms debounce can otherwise be lost
  useEffect(() => {
    if (!user?.uid) return
    const flush = () => {
      if (!writeTimerRef.current) return
      clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
      writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [user?.uid])

  const api = useMemo(() => {
    const ledgerMonthKey = state.ledgerMonthKey || monthKeyFromDate(new Date())
    const txMonth = transactionsInMonth(state.transactions, ledgerMonthKey)

    const monthIncome = txMonth.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const monthExpense = txMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    const monthNet = monthIncome - monthExpense

    const expenseByCategory = (() => {
      const m = {}
      txMonth
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          const c = t.category || 'Other'
          m[c] = (m[c] || 0) + Number(t.amount || 0)
        })
      return m
    })()

    const budgetsForMonth = state.budgetsByMonth?.[ledgerMonthKey] || {}
    const budgetRowsFull = state.expenseCategories.map((cat) => ({
      category: cat,
      spent: expenseByCategory[cat] || 0,
      budget: Number(budgetsForMonth[cat] || 0),
    }))

    const budgetRows = budgetRowsFull.filter((row) => row.budget > 0 || row.spent > 0)

    const lifetimeNet = state.transactions.reduce((acc, t) => {
      const n = Number(t.amount || 0)
      if (t.type === 'income') return acc + n
      if (t.type === 'expense') return acc - n
      return acc
    }, 0)

    const accountBalances = state.accounts.map((acc) => {
      const txForAcc = state.transactions.filter((t) => t.accountId === acc.id)
      const income = txForAcc.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
      const expense = txForAcc.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
      return { ...acc, balance: (acc.startingBalance || 0) + income - expense }
    })
    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0)

    const setLedgerMonthKey = (key) => {
      if (!key || !/^\d{4}-\d{2}$/.test(key)) return
      setState((prev) => ({ ...prev, ledgerMonthKey: key }))
    }

    const shiftLedgerMonth = (delta) => {
      const [y, m] = ledgerMonthKey.split('-').map(Number)
      const d = new Date(y, m - 1 + delta, 1)
      setLedgerMonthKey(monthKeyFromDate(d))
    }

    const addAccount = (name, startingBalance = 0) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return { ok: false, error: 'Account name is required.' }
      const exists = state.accounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())
      if (exists) return { ok: false, error: 'Account name already exists.' }
      const acc = { id: safeId(), name: trimmed, startingBalance: Number(startingBalance) || 0 }
      setState((prev) => ({ ...prev, accounts: [...prev.accounts, acc] }))
      return { ok: true, account: acc }
    }

    const renameAccount = (id, newName) => {
      const trimmed = String(newName || '').trim()
      if (!trimmed) return { ok: false, error: 'Account name is required.' }
      const dup = state.accounts.some((a) => a.id !== id && a.name.toLowerCase() === trimmed.toLowerCase())
      if (dup) return { ok: false, error: 'Account name already exists.' }
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => a.id === id ? { ...a, name: trimmed } : a),
      }))
      return { ok: true }
    }

    const updateAccountBalance = (id, startingBalance) => {
      const num = Number(startingBalance)
      if (!Number.isFinite(num)) return { ok: false, error: 'Invalid balance.' }
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => a.id === id ? { ...a, startingBalance: Math.round(num * 100) / 100 } : a),
      }))
      return { ok: true }
    }

    const deleteAccount = (id) => {
      const inUse = state.transactions.some((t) => t.accountId === id)
      if (inUse) return { ok: false, error: 'Account has transactions. Move or delete them first.' }
      if (state.accounts.length <= 1) return { ok: false, error: 'At least one account is required.' }
      setState((prev) => ({ ...prev, accounts: prev.accounts.filter((a) => a.id !== id) }))
      return { ok: true }
    }

    const addCategory = (type, name) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return { ok: false, error: 'Category name is required.' }
      setState((prev) => {
        const list =
          type === 'expense'
            ? prev.expenseCategories
            : type === 'income'
              ? prev.incomeCategories
              : prev.otherCategories
        if (list.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev
        const next = [...list, trimmed]
        if (type === 'expense') return { ...prev, expenseCategories: next }
        if (type === 'income') return { ...prev, incomeCategories: next }
        return { ...prev, otherCategories: next }
      })
      return { ok: true }
    }

    const removeCategory = (type, name) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return { ok: false, error: 'Category name is required.' }
      const inUse = state.transactions.some(
        (t) =>
          t.category === trimmed &&
          ((type === 'expense' && t.type === 'expense') ||
            (type === 'income' && t.type === 'income') ||
            (type === 'other' && t.type === 'other'))
      )
      if (inUse) return { ok: false, error: 'This category is used by existing transactions.' }
      setState((prev) => {
        if (type === 'expense') return { ...prev, expenseCategories: prev.expenseCategories.filter((c) => c !== trimmed) }
        if (type === 'income') return { ...prev, incomeCategories: prev.incomeCategories.filter((c) => c !== trimmed) }
        return { ...prev, otherCategories: prev.otherCategories.filter((c) => c !== trimmed) }
      })
      return { ok: true }
    }

    const setCurrency = (currency) => {
      const c = String(currency || '').toUpperCase()
      if (!isValidCurrencyCode(c)) return { ok: false, error: 'Unknown currency code.' }
      setState((prev) => ({ ...prev, currency: c }))
      return { ok: true }
    }

    const setBudgetForCategory = (monthKey, category, amount) => {
      const mk = monthKey || ledgerMonthKey
      const cat = String(category || '').trim()
      const num = Number(amount)
      if (!cat) return { ok: false, error: 'Category required.' }
      if (!Number.isFinite(num) || num < 0) return { ok: false, error: 'Budget must be >= 0.' }
      setState((prev) => ({
        ...prev,
        budgetsByMonth: {
          ...prev.budgetsByMonth,
          [mk]: {
            ...(prev.budgetsByMonth?.[mk] || {}),
            [cat]: Math.round(num * 100) / 100,
          },
        },
      }))
      return { ok: true }
    }

    const clearBudgetForCategory = (monthKey, category) => {
      const mk = monthKey || ledgerMonthKey
      setState((prev) => {
        const monthBudgets = { ...(prev.budgetsByMonth?.[mk] || {}) }
        delete monthBudgets[category]
        return {
          ...prev,
          budgetsByMonth: {
            ...prev.budgetsByMonth,
            [mk]: monthBudgets,
          },
        }
      })
      return { ok: true }
    }

    const addTransaction = ({ type, amount, category, description, date, accountId }) => {
      if (!type) return { ok: false, error: 'Transaction type is required.' }
      const num = Number(amount)
      if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Amount must be > 0.' }
      const tx = {
        id: safeId(),
        type,
        amount: Math.round(num * 100) / 100,
        category: String(category || '').trim() || 'Other',
        description: String(description || '').trim(),
        date: date ? String(date).slice(0, 10) : todayISODate(),
        accountId: accountId || state.accounts[0]?.id || null,
      }
      setState((prev) => ({ ...prev, transactions: [tx, ...prev.transactions] }))
      return { ok: true, tx }
    }

    const deleteTransaction = (id) => {
      setState((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }))
      return { ok: true }
    }

    /**
     * Bulk append transactions (e.g. Excel import). Each row: { date, type, amount, category?, description?, accountId?, sourceLoanId? }
     */
    const importTransactionsFromRows = (rawRows) => {
      if (!Array.isArray(rawRows) || !rawRows.length) return { ok: false, error: 'No rows to import.' }
      const defaultAccount = state.accounts[0]?.id || null
      const built = []
      const rowErrors = []
      rawRows.forEach((r, i) => {
        const type = String(r.type || '').toLowerCase().trim()
        if (!['income', 'expense', 'loan'].includes(type)) {
          rowErrors.push(`Row ${i + 1}: type must be income, expense, or loan`)
          return
        }
        const num = Number(r.amount)
        if (!Number.isFinite(num) || num <= 0) {
          rowErrors.push(`Row ${i + 1}: amount must be a positive number`)
          return
        }
        const date = r.date ? String(r.date).slice(0, 10) : todayISODate()
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          rowErrors.push(`Row ${i + 1}: invalid date (use YYYY-MM-DD)`)
          return
        }
        const sid = r.sourceLoanId ? String(r.sourceLoanId).trim() : ''
        const tx = {
          id: safeId(),
          type,
          amount: Math.round(num * 100) / 100,
          category: String(r.category || '').trim() || 'Other',
          description: String(r.description || '').trim(),
          date,
          accountId: r.accountId ? String(r.accountId).trim() : defaultAccount,
        }
        if (sid) tx.sourceLoanId = sid
        built.push(tx)
      })
      if (!built.length) {
        return { ok: false, error: rowErrors.join('; ') || 'Nothing valid to import.' }
      }
      setState((prev) => ({ ...prev, transactions: [...built, ...prev.transactions] }))
      return {
        ok: true,
        inserted: built.length,
        rowErrors: rowErrors.length ? rowErrors : undefined,
      }
    }

    const upsertLoan = ({ id, direction, amount, borrowDate, extendedDate, reason, countInFinance, person }) => {
      const num = Number(amount)
      if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Amount must be > 0.' }
      const loanId = id || safeId()
      setState((prev) => {
        const existing = prev.loans.find((l) => l.id === loanId)
        const loan = {
          id: loanId,
          direction: direction === 'lent' ? 'lent' : 'borrowed',
          amount: Math.round(num * 100) / 100,
          borrowDate: borrowDate ? String(borrowDate).slice(0, 10) : todayISODate(),
          extendedDate: extendedDate ? String(extendedDate).slice(0, 10) : todayISODate(),
          reason: String(reason || '').trim(),
          person: String(person || '').trim(),
          countInFinance: !!countInFinance,
          repayments: existing?.repayments || [],
        }
        const loans = existing ? prev.loans.map((l) => (l.id === loanId ? loan : l)) : [loan, ...prev.loans]
        const accountId = prev.accounts[0]?.id ?? null
        const otherTx = prev.transactions.filter((t) => t.sourceLoanId !== loanId)
        const transactions = [...buildLoanTransactions(loan, accountId), ...otherTx]
        return { ...prev, loans, transactions }
      })
      return { ok: true }
    }

    const addRepayment = (loanId, { amount, date, note } = {}) => {
      const num = Number(amount)
      if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Repayment must be > 0.' }
      const loan = state.loans.find((l) => l.id === loanId)
      if (!loan) return { ok: false, error: 'Loan not found.' }
      const repAmt = Math.round(num * 100) / 100
      const outstanding = loanOutstanding(loan)
      if (outstanding <= 0) return { ok: false, error: 'This loan is already fully repaid.' }
      if (repAmt > outstanding + 0.001) return { ok: false, error: `Repayment exceeds outstanding (${outstanding}).` }
      setState((prev) => {
        const target = prev.loans.find((l) => l.id === loanId)
        if (!target) return prev
        const rep = {
          id: safeId(),
          amount: repAmt,
          date: date ? String(date).slice(0, 10) : todayISODate(),
          note: String(note || '').trim(),
        }
        const newLoan = { ...target, repayments: [...(target.repayments || []), rep] }
        const loans = prev.loans.map((l) => (l.id === loanId ? newLoan : l))
        const accountId = prev.accounts[0]?.id ?? null
        const otherTx = prev.transactions.filter((t) => t.sourceLoanId !== loanId)
        const transactions = [...buildLoanTransactions(newLoan, accountId), ...otherTx]
        return { ...prev, loans, transactions }
      })
      return { ok: true }
    }

    const deleteRepayment = (loanId, repaymentId) => {
      setState((prev) => {
        const target = prev.loans.find((l) => l.id === loanId)
        if (!target) return prev
        const newLoan = { ...target, repayments: (target.repayments || []).filter((r) => r.id !== repaymentId) }
        const loans = prev.loans.map((l) => (l.id === loanId ? newLoan : l))
        const accountId = prev.accounts[0]?.id ?? null
        const otherTx = prev.transactions.filter((t) => t.sourceLoanId !== loanId)
        const transactions = [...buildLoanTransactions(newLoan, accountId), ...otherTx]
        return { ...prev, loans, transactions }
      })
      return { ok: true }
    }

    const deleteLoan = (loanId) => {
      setState((prev) => ({
        ...prev,
        loans: prev.loans.filter((l) => l.id !== loanId),
        transactions: prev.transactions.filter((t) => t.sourceLoanId !== loanId),
      }))
      return { ok: true }
    }

    /**
     * Clear all finance data for a given calendar month (transactions, loans touching that month, budgets for that month).
     */
    const resetFinanceDataForMonth = (year, month1to12) => {
      const key = monthKeyFromParts(year, month1to12)
      setState((prev) => {
        const removedLoanIds = new Set(
          prev.loans.filter((l) => l.borrowDate && String(l.borrowDate).slice(0, 7) === key).map((l) => l.id)
        )
        const loans = prev.loans.filter((l) => !removedLoanIds.has(l.id))
        const transactions = prev.transactions.filter((t) => {
          if (t.sourceLoanId && removedLoanIds.has(t.sourceLoanId)) return false
          if (!t.date) return true
          return String(t.date).slice(0, 7) !== key
        })
        const budgetsByMonth = { ...prev.budgetsByMonth }
        delete budgetsByMonth[key]
        return { ...prev, transactions, loans, budgetsByMonth }
      })
      return { ok: true }
    }

    /** Full app data wipe — resets to completely empty state */
    const resetAllFinanceToEmpty = () => {
      setState(emptyFinance())
      return { ok: true }
    }

    /** Load demo data into current state (merges sample transactions/loans) */
    const loadDemoData = () => {
      setState((prev) => mergeOneTimeDemoFinance(prev))
      return { ok: true }
    }

    return {
      currency: state.currency,
      ledgerMonthKey,
      setLedgerMonthKey,
      shiftLedgerMonth,
      expenseCategories: state.expenseCategories,
      incomeCategories: state.incomeCategories,
      otherCategories: state.otherCategories,
      accounts: state.accounts,
      transactions: state.transactions,
      loans: state.loans,
      budgetsByMonth: state.budgetsByMonth || {},
      transactionsInLedgerMonth: txMonth,
      monthIncome,
      monthExpense,
      monthNet,
      expenseByCategory,
      budgetRows,
      budgetRowsFull,
      lifetimeNet,
      accountBalances,
      totalBalance,
      addAccount,
      renameAccount,
      updateAccountBalance,
      deleteAccount,
      addCategory,
      removeCategory,
      setCurrency,
      setBudgetForCategory,
      clearBudgetForCategory,
      addTransaction,
      deleteTransaction,
      importTransactionsFromRows,
      upsertLoan,
      addRepayment,
      deleteRepayment,
      deleteLoan,
      resetFinanceDataForMonth,
      resetAllFinanceToEmpty,
      loadDemoData,
    }
  }, [state])

  return <FinanceContext.Provider value={api}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider')
  return ctx
}
