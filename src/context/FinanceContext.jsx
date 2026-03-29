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
    ledgerMonthKey: typeof raw.ledgerMonthKey === 'string' && /^\d{4}-\d{2}$/.test(raw.ledgerMonthKey)
      ? raw.ledgerMonthKey
      : base.ledgerMonthKey,
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
    loans: Array.isArray(raw.loans) ? raw.loans : [],
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
  const [state, setState] = useState(() => loadFinanceFromStorage())
  const stateRef = useRef(state)
  const applyingRemoteRef = useRef(false)
  const seededCloudRef = useRef(false)
  const writeTimerRef = useRef(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Unable to persist finance state:', e)
    }
  }, [state])

  useEffect(() => {
    seededCloudRef.current = false
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return () => {}
    const unsub = subscribeUserPayloadDoc({
      userId: user.uid,
      pathSegments: FS_PATH,
      onRemote: ({ exists, payload }) => {
        if (!exists) {
          if (!seededCloudRef.current) {
            seededCloudRef.current = true
            writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
          }
          return
        }
        if (payload && typeof payload === 'object') {
          applyingRemoteRef.current = true
          let next = normalizeFinancePayload(payload)
          const demoKey = DEMO_FINANCE_KEY(user?.uid)
          if (typeof window !== 'undefined' && !localStorage.getItem(demoKey) && !next.transactions?.length) {
            next = mergeOneTimeDemoFinance(next)
            localStorage.setItem(demoKey, '1')
          }
          setState(next)
        }
      },
    })
    return unsub
  }, [user?.uid])

  /* Logged-out: one-time demo into localStorage when ledger is still empty */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user?.uid) return
    const demoKey = DEMO_FINANCE_KEY(null)
    if (localStorage.getItem(demoKey)) return
    setState((prev) => {
      if (prev.transactions?.length) return prev
      localStorage.setItem(demoKey, '1')
      return mergeOneTimeDemoFinance(prev)
    })
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false
      return
    }
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
    }, 450)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [state, user?.uid])

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

    const setLedgerMonthKey = (key) => {
      if (!key || !/^\d{4}-\d{2}$/.test(key)) return
      setState((prev) => ({ ...prev, ledgerMonthKey: key }))
    }

    const shiftLedgerMonth = (delta) => {
      const [y, m] = ledgerMonthKey.split('-').map(Number)
      const d = new Date(y, m - 1 + delta, 1)
      setLedgerMonthKey(monthKeyFromDate(d))
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

    const upsertLoan = ({ id, amount, borrowDate, extendedDate, reason, addToIncome }) => {
      const num = Number(amount)
      if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Amount must be > 0.' }
      const loanId = id || safeId()
      const loanBase = {
        id: loanId,
        amount: Math.round(num * 100) / 100,
        borrowDate: borrowDate ? String(borrowDate).slice(0, 10) : todayISODate(),
        extendedDate: extendedDate ? String(extendedDate).slice(0, 10) : todayISODate(),
        reason: String(reason || '').trim(),
        addToIncome: !!addToIncome,
      }
      setState((prev) => {
        const existing = prev.loans.find((l) => l.id === loanId)
        const loans = existing ? prev.loans.map((l) => (l.id === loanId ? loanBase : l)) : [loanBase, ...prev.loans]
        const txType = loanBase.addToIncome ? 'income' : 'loan'
        const category = 'Loans'
        const desc = loanBase.reason ? `Loan: ${loanBase.reason}` : 'Loan'
        const linkedTxIndex = prev.transactions.findIndex((t) => t.sourceLoanId === loanId)
        const linkedTx = {
          id: linkedTxIndex >= 0 ? prev.transactions[linkedTxIndex].id : safeId(),
          type: txType,
          amount: loanBase.amount,
          category,
          description: desc,
          date: loanBase.borrowDate,
          accountId: prev.accounts[0]?.id ?? null,
          sourceLoanId: loanId,
        }
        let transactions = prev.transactions
        if (linkedTxIndex >= 0) {
          transactions = prev.transactions.map((t) => (t.sourceLoanId === loanId ? linkedTx : t))
        } else {
          transactions = [linkedTx, ...prev.transactions]
        }
        return { ...prev, loans, transactions }
      })
      return { ok: true, loan: loanBase }
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

    /** Full app data wipe except categories & accounts structure — no demo */
    const resetAllFinanceToEmpty = () => {
      setState(emptyFinance())
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
      addCategory,
      removeCategory,
      setCurrency,
      setBudgetForCategory,
      clearBudgetForCategory,
      addTransaction,
      deleteTransaction,
      importTransactionsFromRows,
      upsertLoan,
      deleteLoan,
      resetFinanceDataForMonth,
      resetAllFinanceToEmpty,
    }
  }, [state])

  return <FinanceContext.Provider value={api}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider')
  return ctx
}
