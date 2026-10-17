'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants'
import { isValidCurrencyCode } from '../utils/currencyOptions'
import { localCacheKey, subscribeUserPayloadDoc, writeUserPayloadDoc } from '../lib/firestoreUserSync'
import { mergeOneTimeDemoFinance } from '../lib/demoFinanceData'
import { emiInterestDue, todayISO as localTodayISO } from '../lib/creditCard'

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

/** Month arithmetic for recurring rules. */
function addMonthKey(monthKey, delta) {
  const [y, m] = String(monthKey).split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKeyFromDate(d)
}

/** A rule due on the 31st still posts in February — on the 28th/29th. */
function clampDayToMonth(monthKey, day) {
  const [y, m] = String(monthKey).split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const safe = Math.min(Math.max(Number(day) || 1, 1), lastDay)
  return `${monthKey}-${String(safe).padStart(2, '0')}`
}

export const RECURRING_MODES = ['auto', 'approve']

function normalizeRecurring(raw) {
  if (!raw || typeof raw !== 'object') return null
  const amount = Math.round(Number(raw.amount || 0) * 100) / 100
  if (!(amount > 0)) return null
  return {
    id: raw.id || safeId(),
    type: raw.type === 'income' ? 'income' : 'expense',
    amount,
    category: String(raw.category || '').trim() || 'Other',
    description: String(raw.description || '').trim(),
    accountId: raw.accountId || null,
    dayOfMonth: Math.min(Math.max(Number(raw.dayOfMonth) || 1, 1), 31),
    // 'auto' posts itself; 'approve' waits for a tap. Chosen per rule.
    mode: RECURRING_MODES.includes(raw.mode) ? raw.mode : 'approve',
    startMonth: /^\d{4}-\d{2}$/.test(raw.startMonth) ? raw.startMonth : monthKeyFromDate(new Date()),
    endMonth: /^\d{4}-\d{2}$/.test(raw.endMonth) ? raw.endMonth : '',
    active: raw.active !== false,
    // Months already dealt with, so nothing posts twice.
    postedMonths: Array.isArray(raw.postedMonths) ? raw.postedMonths.filter(Boolean) : [],
    skippedMonths: Array.isArray(raw.skippedMonths) ? raw.skippedMonths.filter(Boolean) : [],
  }
}

/**
 * Two devices can post the same rule for the same month before either sees the
 * other's write. The month lists converge, but the transactions would not — so
 * drop duplicates keyed on (rule, month) whenever a payload is read.
 */
function dedupeRecurringTx(transactions) {
  const seen = new Set()
  return transactions.filter((t) => {
    if (t?.sourceEmiId && t?.emiLeg === 'interest') {
      const key = `emi::${t.sourceEmiId}::${t.emiIndex}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }
    if (!t?.sourceRecurringId || !t?.recurringMonth) return true
    const key = `${t.sourceRecurringId}::${t.recurringMonth}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const ACCOUNT_KINDS = ['standard', 'credit']

/**
 * A `credit` account behaves like a credit card: its balance is what you owe
 * (spending drives it negative), `creditLimit` caps spending, and paying the
 * bill is a transfer into it from another account.
 */
function normalizeAccount(raw) {
  if (!raw || typeof raw !== 'object' || !raw.id) return null
  const kind = raw.kind === 'credit' ? 'credit' : 'standard'
  const acc = {
    ...raw,
    name: String(raw.name || '').trim() || 'Account',
    startingBalance: Number(raw.startingBalance) || 0,
    kind,
  }
  if (kind === 'credit') {
    acc.creditLimit = Math.max(0, Math.round(Number(raw.creditLimit || 0) * 100) / 100)
    acc.dueDay = Math.min(Math.max(Number(raw.dueDay) || 0, 0), 31)
    // Cards made before statements existed only had a due day: assume the
    // usual ~20-day grace and close the cycle that long before it.
    const derivedClose = acc.dueDay ? ((acc.dueDay + 10 - 1) % 28) + 1 : 1
    acc.statementDay = Math.min(Math.max(Number(raw.statementDay) || derivedClose, 1), 31)
    const pct = Number(raw.minDuePct)
    acc.minDuePct = Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : 5
    acc.minDueFloor = Math.max(0, Number(raw.minDueFloor) || 0)
    acc.openedOn = /^\d{4}-\d{2}-\d{2}$/.test(raw.openedOn || '') ? raw.openedOn : ''
  } else {
    for (const k of ['creditLimit', 'dueDay', 'statementDay', 'minDuePct', 'minDueFloor', 'openedOn']) delete acc[k]
  }
  return acc
}

/**
 * Money moving between your own accounts (incl. paying a card bill) is
 * recorded as an expense leg + an income leg so balances work, but it is
 * neither earning nor spending — every income/expense total skips it.
 */
export function isTransferTx(t) {
  return !!t?.transferId || t?.category === 'Transfer'
}

/** Counts towards income/expense totals, charts and budgets. */
export function countsAsCashflow(t) {
  return (t?.type === 'income' || t?.type === 'expense') && !isTransferTx(t)
}

export const CARD_FEE_CATEGORY = 'Card fees & interest'

/**
 * Turning a card purchase into monthly installments. The purchase itself is a
 * normal expense on the card (it was spent that day); the plan only changes
 * how it is billed — one installment per statement — and adds interest as its
 * own expense on each bill date.
 */
function normalizeCardEmi(raw) {
  if (!raw || typeof raw !== 'object' || !raw.cardId) return null
  const principal = Math.round(Number(raw.principal || 0) * 100) / 100
  const months = Math.floor(Number(raw.months) || 0)
  if (!(principal > 0) || months < 1) return null
  return {
    id: raw.id || safeId(),
    cardId: raw.cardId,
    description: String(raw.description || '').trim() || 'EMI purchase',
    principal,
    months: Math.min(months, 120),
    ratePct: Math.max(0, Math.min(100, Number(raw.ratePct) || 0)),
    fee: Math.max(0, Math.round(Number(raw.fee || 0) * 100) / 100),
    purchaseDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.purchaseDate || '') ? raw.purchaseDate : todayISODate(),
    purchaseTxId: raw.purchaseTxId || null,
    closedOn: /^\d{4}-\d{2}-\d{2}$/.test(raw.closedOn || '') ? raw.closedOn : '',
  }
}

/** What's still owed on a credit account given its live balance. */
export function creditOwed(balance) {
  return Math.max(0, Math.round(-Number(balance || 0) * 100) / 100)
}

const STORAGE_KEY = 'livio_finance_v1'
const FS_PATH = ['liver', 'finance']

/** No demo transactions — real ledger starts empty */
export function emptyFinance() {
  return {
    // Placeholder only — the first-run flow asks. Anyone who reaches the
    // dashboard without answering is handled by `onboarded` below.
    currency: CURRENCIES.BDT,
    onboarded: false,
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
    recurring: [],
    cardEmis: [],
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
          ...(/^\d{4}-\d{2}$/.test(r?.autoMonth || '') ? { autoMonth: r.autoMonth } : {}),
        }))
        .filter((r) => r.amount > 0)
    : []
  const borrowDate = raw.borrowDate ? String(raw.borrowDate).slice(0, 10) : todayISODate()
  // Two devices posting the same installment month converge to one entry.
  const seenAuto = new Set()
  const dedupedRepayments = repayments.filter((r) => {
    if (!r.autoMonth) return true
    if (seenAuto.has(r.autoMonth)) return false
    seenAuto.add(r.autoMonth)
    return true
  })
  return {
    id: raw.id || safeId(),
    direction,
    amount: Math.max(0, Math.round(Number(raw.amount || 0) * 100) / 100),
    person: String(raw.person || '').trim(),
    borrowDate,
    extendedDate: raw.extendedDate ? String(raw.extendedDate).slice(0, 10) : borrowDate,
    reason: String(raw.reason || '').trim(),
    countInFinance,
    repayments: dedupedRepayments,
    autoPay: normalizeAutoPay(raw.autoPay),
  }
}

/**
 * A fixed installment that repays (or collects) a loan by itself each month,
 * for a limited number of months — an EMI. Null when the loan has none.
 */
function normalizeAutoPay(raw) {
  if (!raw || typeof raw !== 'object') return null
  const amount = Math.round(Number(raw.amount || 0) * 100) / 100
  const months = Math.floor(Number(raw.months) || 0)
  if (!(amount > 0) || months < 1) return null
  return {
    amount,
    months: Math.min(months, 600),
    startMonth: /^\d{4}-\d{2}$/.test(raw.startMonth || '') ? raw.startMonth : monthKeyFromDate(new Date()),
    dayOfMonth: Math.min(Math.max(Number(raw.dayOfMonth) || 1, 1), 31),
    active: raw.active !== false,
  }
}

/**
 * Installment months a loan still owes, oldest first: inside the plan's window,
 * not after the current month, not already posted, and only while something is
 * outstanding. Each carries the amount to post — the last one is trimmed so the
 * plan never repays more than is owed.
 */
export function dueInstallments(loan, currentMonth = monthKeyFromDate(new Date())) {
  const plan = loan?.autoPay
  if (!plan || !plan.active) return []
  const posted = new Set((loan.repayments || []).map((r) => r.autoMonth).filter(Boolean))
  let remaining = loanOutstanding(loan)
  const out = []
  for (let i = 0; i < plan.months && remaining > 0; i++) {
    const m = addMonthKey(plan.startMonth, i)
    if (m > currentMonth) break
    if (posted.has(m)) continue
    const amount = Math.round(Math.min(plan.amount, remaining) * 100) / 100
    out.push({ monthKey: m, amount, date: clampDayToMonth(m, plan.dayOfMonth) })
    remaining = Math.round((remaining - amount) * 100) / 100
  }
  return out
}

/** Months of the plan already posted, for "3 of 12" progress. */
export function installmentsPosted(loan) {
  return (loan?.repayments || []).filter((r) => r.autoMonth).length
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
    accounts: (() => {
      const list = Array.isArray(raw.accounts) ? raw.accounts.map(normalizeAccount).filter(Boolean) : []
      return list.length ? list : base.accounts.map(normalizeAccount)
    })(),
    transactions: dedupeRecurringTx(Array.isArray(raw.transactions) ? raw.transactions : []),
    loans: Array.isArray(raw.loans) ? raw.loans.map(normalizeLoan).filter(Boolean) : [],
    recurring: Array.isArray(raw.recurring) ? raw.recurring.map(normalizeRecurring).filter(Boolean) : [],
    cardEmis: Array.isArray(raw.cardEmis) ? raw.cardEmis.map(normalizeCardEmi).filter(Boolean) : [],
    budgetsByMonth: raw.budgetsByMonth && typeof raw.budgetsByMonth === 'object' ? raw.budgetsByMonth : {},
    // An account that already has transactions predates the first-run flow —
    // never interrupt it to ask questions it has effectively answered.
    onboarded: raw.onboarded === true || (Array.isArray(raw.transactions) && raw.transactions.length > 0),
  }
}

function loadFinanceFromStorage(uid) {
  if (typeof window === 'undefined') return emptyFinance()
  try {
    const raw = window.localStorage.getItem(localCacheKey(STORAGE_KEY, uid))
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
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid || null
  // Start empty so the server-rendered HTML matches the first client render
  // (localStorage is read after mount, below) — avoids React hydration error #418.
  const [state, setState] = useState(emptyFinance)
  const stateRef = useRef(state)
  const applyingRemoteRef = useRef(false)
  const seededCloudRef = useRef(false)
  const remoteReadyRef = useRef(false)
  const writeTimerRef = useRef(null)
  // Which account the in-memory state belongs to. Must be state, not a ref: a
  // ref flips synchronously inside the load effect, so the persist effect below
  // ran on the same pass while `state` was still empty and wrote that over the
  // cache — which StrictMode's second effect pass then read back as the real
  // value. `undefined` means "not hydrated yet"; `null` means signed out.
  const [hydratedUid, setHydratedUid] = useState(undefined)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Load the cache belonging to the *current account*, once auth has resolved.
  // Re-runs on sign-in/sign-out so a second account on the same browser never
  // starts from the first account's ledger.
  useEffect(() => {
    if (authLoading) return
    seededCloudRef.current = false
    remoteReadyRef.current = false
    applyingRemoteRef.current = false
    if (writeTimerRef.current) {
      clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
    }
    const loaded = loadFinanceFromStorage(uid)
    stateRef.current = loaded
    setState(loaded)
    setHydratedUid(uid)
  }, [uid, authLoading])

  useEffect(() => {
    // Never persist while the state still belongs to the previous account.
    if (hydratedUid === undefined || hydratedUid !== uid) return
    try {
      window.localStorage.setItem(localCacheKey(STORAGE_KEY, uid), JSON.stringify(state))
    } catch (e) {
      console.warn('Unable to persist finance state:', e)
    }
  }, [state, uid, hydratedUid])

  useEffect(() => {
    if (!uid || hydratedUid !== uid) return () => {}
    const unsub = subscribeUserPayloadDoc({
      userId: uid,
      pathSegments: FS_PATH,
      onRemote: ({ exists, payload }) => {
        if (!exists) {
          remoteReadyRef.current = true
          if (!seededCloudRef.current) {
            seededCloudRef.current = true
            // Promote this device's local cache into the first cloud doc — the
            // only migration path for a ledger that has so far lived in
            // IndexedDB alone. Safe because this effect only attaches once
            // `hydratedUid === uid`, so `stateRef.current` is guaranteed to be
            // THIS account's cache, never the previous user's.
            writeUserPayloadDoc(uid, FS_PATH, stateRef.current).catch(() => {})
          }
          return
        }
        remoteReadyRef.current = true
        if (payload && typeof payload === 'object') {
          // The viewed month is this device's view state, not data. Taking it
          // from the snapshot let the echo of our own write — clamped forward
          // to the current month by normalize — yank the user back from a
          // past month moments after they navigated to it.
          const next = { ...normalizeFinancePayload(payload), ledgerMonthKey: stateRef.current.ledgerMonthKey }
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
  }, [uid, hydratedUid])


  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
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
      writeUserPayloadDoc(uid, FS_PATH, stateRef.current).catch(() => {})
    }, 450)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [state, uid, hydratedUid])

  // Flush pending write immediately when the tab/app backgrounds or closes —
  // mobile suspends timers aggressively, so the 450ms debounce can otherwise be lost
  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    const flush = () => {
      if (!writeTimerRef.current) return
      clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
      writeUserPayloadDoc(uid, FS_PATH, stateRef.current).catch(() => {})
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
  }, [uid, hydratedUid])

  const api = useMemo(() => {
    const ledgerMonthKey = state.ledgerMonthKey || monthKeyFromDate(new Date())
    const txMonth = transactionsInMonth(state.transactions, ledgerMonthKey)
    const flowMonth = txMonth.filter(countsAsCashflow)

    const monthIncome = flowMonth.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const monthExpense = flowMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    const monthNet = monthIncome - monthExpense

    const expenseByCategory = (() => {
      const m = {}
      flowMonth
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
      if (isTransferTx(t)) return acc
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

    /**
     * `opts.kind: 'credit'` makes a credit card. For a card, `startingBalance`
     * is entered as the amount currently owed and stored negative, so the
     * same balance arithmetic works for every account.
     */
    const addAccount = (name, startingBalance = 0, opts = {}) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return { ok: false, error: 'Account name is required.' }
      const exists = state.accounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())
      if (exists) return { ok: false, error: 'Account name already exists.' }
      const isCredit = opts.kind === 'credit'
      if (isCredit && !(Number(opts.creditLimit) > 0)) return { ok: false, error: 'Credit limit is required for a card.' }
      const opening = Number(startingBalance) || 0
      const acc = normalizeAccount({
        id: safeId(),
        name: trimmed,
        startingBalance: isCredit ? -Math.abs(opening) : opening,
        kind: isCredit ? 'credit' : 'standard',
        creditLimit: opts.creditLimit,
        dueDay: opts.dueDay,
        statementDay: opts.statementDay,
        minDuePct: opts.minDuePct,
        minDueFloor: opts.minDueFloor,
        openedOn: isCredit ? localTodayISO() : undefined,
      })
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

    /** Any of: creditLimit, statementDay, dueDay, minDuePct, minDueFloor. Omitted fields keep their value. */
    const updateAccountCredit = (id, patch = {}) => {
      const card = state.accounts.find((a) => a.id === id && a.kind === 'credit')
      if (!card) return { ok: false, error: 'Card not found.' }
      const next = { ...card }
      if (patch.creditLimit !== undefined) {
        const limit = Number(patch.creditLimit)
        if (!Number.isFinite(limit) || limit <= 0) return { ok: false, error: 'Credit limit must be > 0.' }
        next.creditLimit = limit
      }
      for (const k of ['statementDay', 'dueDay', 'minDuePct', 'minDueFloor']) {
        if (patch[k] !== undefined && patch[k] !== '') next[k] = Number(patch[k])
      }
      if (patch.statementDay !== undefined && !(next.statementDay >= 1 && next.statementDay <= 31)) {
        return { ok: false, error: 'Statement day must be 1–31.' }
      }
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === id ? normalizeAccount(next) : a)),
      }))
      return { ok: true }
    }

    /** Available credit right now, or Infinity for a non-card / no-limit account. */
    const availableCredit = (accountId) => {
      const card = state.accounts.find((a) => a.id === accountId && a.kind === 'credit')
      if (!card || !(card.creditLimit > 0)) return Infinity
      const bal = accountBalances.find((a) => a.id === card.id)?.balance || 0
      return Math.round((card.creditLimit - creditOwed(bal)) * 100) / 100
    }

    /**
     * Move money between two of your own accounts. Both legs share a
     * `transferId`, so totals skip them and deleting one deletes both. Drawing
     * from a card (cash advance) is held to its limit.
     */
    const transferFunds = ({ fromId, toId, amount, date, note, extra = {} }) => {
      const from = state.accounts.find((a) => a.id === fromId)
      const to = state.accounts.find((a) => a.id === toId)
      if (!from || !to) return { ok: false, error: 'Choose both accounts.' }
      if (from.id === to.id) return { ok: false, error: 'Cannot transfer to the same account.' }
      const num = Math.round(Number(amount) * 100) / 100
      if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Amount must be > 0.' }
      const avail = availableCredit(from.id)
      if (num > avail + 0.001) return { ok: false, error: `Over the ${from.name} limit — only ${avail} available.` }
      const day = date ? String(date).slice(0, 10) : todayISODate()
      const transferId = safeId()
      const legs = [
        {
          id: safeId(), type: 'expense', amount: num, category: 'Transfer', date: day, accountId: from.id,
          description: note || (to.kind === 'credit' ? `${to.name} bill payment` : `Transfer to ${to.name}`),
          transferId, toAccountId: to.id,
        },
        {
          id: safeId(), type: 'income', amount: num, category: 'Transfer', date: day, accountId: to.id,
          description: to.kind === 'credit' ? `Payment from ${from.name}` : `Transfer from ${from.name}`,
          transferId, fromAccountId: from.id, ...extra,
        },
      ]
      setState((prev) => ({ ...prev, transactions: [...legs, ...prev.transactions] }))
      return { ok: true, transferId }
    }

    /**
     * Pay a card bill from another account. `kind` records what the payer
     * meant — full statement, minimum, total outstanding or a custom amount —
     * so the payment history can say it; the statement status itself is
     * always worked out from the amounts.
     */
    const payCreditCard = (cardId, fromId, amount, date, kind = 'custom', note = '') => {
      const card = state.accounts.find((a) => a.id === cardId)
      if (!card || card.kind !== 'credit') return { ok: false, error: 'Choose a credit card to pay.' }
      if (!fromId || fromId === card.id) return { ok: false, error: 'Choose the account to pay from.' }
      return transferFunds({
        fromId, toId: card.id, amount, date,
        note: note ? `${card.name} bill payment: ${note}` : undefined,
        extra: { paymentKind: ['full', 'minimum', 'total', 'custom'].includes(kind) ? kind : 'custom' },
      })
    }

    /** Interest, late fee, annual fee… charged by the bank onto the card. */
    const addCardCharge = (cardId, { amount, date, label, note } = {}) => {
      const card = state.accounts.find((a) => a.id === cardId && a.kind === 'credit')
      if (!card) return { ok: false, error: 'Card not found.' }
      const num = Math.round(Number(amount) * 100) / 100
      if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Amount must be > 0.' }
      const tx = {
        id: safeId(), type: 'expense', amount: num, category: CARD_FEE_CATEGORY,
        description: [label || 'Card charge', note].filter(Boolean).join(': '),
        date: date ? String(date).slice(0, 10) : todayISODate(), accountId: card.id, cardCharge: true,
      }
      setState((prev) => ({ ...prev, transactions: [tx, ...prev.transactions] }))
      return { ok: true }
    }

    // ── Card EMI ─────────────────────────────────────────────────────────
    /**
     * `purchaseTxId` converts an existing card purchase; without it a new
     * purchase is recorded on the card (and held to the limit). A processing
     * fee posts at once; interest posts on each bill date by itself.
     */
    const addCardEmi = (payload = {}) => {
      const card = state.accounts.find((a) => a.id === payload.cardId && a.kind === 'credit')
      if (!card) return { ok: false, error: 'Choose a card.' }
      const purchase = payload.purchaseTxId ? state.transactions.find((t) => t.id === payload.purchaseTxId) : null
      if (payload.purchaseTxId && !purchase) return { ok: false, error: 'That purchase no longer exists.' }
      if (purchase && state.cardEmis.some((e) => e.purchaseTxId === purchase.id)) {
        return { ok: false, error: 'That purchase is already on EMI.' }
      }
      const emi = normalizeCardEmi({
        ...payload,
        id: safeId(),
        principal: payload.principal || purchase?.amount,
        purchaseDate: purchase?.date || payload.purchaseDate,
        description: payload.description || purchase?.description || purchase?.category,
      })
      if (!emi) return { ok: false, error: 'Enter the amount and number of months.' }
      if (purchase && emi.principal > Number(purchase.amount) + 0.001) {
        return { ok: false, error: 'EMI amount cannot exceed the purchase.' }
      }
      const extra = []
      if (!purchase) {
        const avail = availableCredit(card.id)
        if (emi.principal + emi.fee > avail + 0.001) return { ok: false, error: `Over the ${card.name} limit — only ${avail} available.` }
        const tx = {
          id: safeId(), type: 'expense', amount: emi.principal,
          category: String(payload.category || '').trim() || 'Shopping',
          description: emi.description, date: emi.purchaseDate, accountId: card.id, emiId: emi.id,
        }
        emi.purchaseTxId = tx.id
        extra.push(tx)
      }
      if (emi.fee > 0) {
        extra.push({
          id: safeId(), type: 'expense', amount: emi.fee, category: CARD_FEE_CATEGORY,
          description: `EMI processing fee: ${emi.description}`, date: emi.purchaseDate,
          accountId: card.id, sourceEmiId: emi.id, emiLeg: 'fee',
        })
      }
      setState((prev) => ({
        ...prev,
        cardEmis: [emi, ...prev.cardEmis],
        transactions: [
          ...extra,
          ...prev.transactions.map((t) => (purchase && t.id === purchase.id ? { ...t, emiId: emi.id } : t)),
        ],
      }))
      return { ok: true, emi }
    }

    /** Pre-pay: the rest of the principal is billed on the next statement, no more interest. */
    const closeCardEmi = (id, date) => {
      setState((prev) => ({
        ...prev,
        cardEmis: prev.cardEmis.map((e) =>
          e.id === id ? { ...e, closedOn: date ? String(date).slice(0, 10) : localTodayISO() } : e
        ),
      }))
      return { ok: true }
    }

    /** Removes the plan and the fee/interest it posted; the purchase stays — it happened. */
    const deleteCardEmi = (id) => {
      setState((prev) => ({
        ...prev,
        cardEmis: prev.cardEmis.filter((e) => e.id !== id),
        transactions: prev.transactions
          .filter((t) => t.sourceEmiId !== id)
          .map((t) => {
            if (t.emiId !== id) return t
            const { emiId, ...rest } = t
            return rest
          }),
      }))
      return { ok: true }
    }

    const cardEmiInterestDue = (() => {
      const today = localTodayISO()
      const posted = new Set(
        state.transactions.filter((t) => t.sourceEmiId && t.emiLeg === 'interest').map((t) => `${t.sourceEmiId}::${t.emiIndex}`)
      )
      return state.cardEmis.flatMap((e) => {
        const card = state.accounts.find((a) => a.id === e.cardId && a.kind === 'credit')
        if (!card) return []
        return emiInterestDue(card, e, today)
          .filter((r) => !posted.has(`${e.id}::${r.index}`))
          .map((r) => ({ emi: e, row: r }))
      })
    })()

    const runCardEmiInterest = () => {
      if (!cardEmiInterestDue.length) return { ok: true }
      const txs = cardEmiInterestDue.map(({ emi, row }) => ({
        id: safeId(), type: 'expense', amount: row.interest, category: CARD_FEE_CATEGORY,
        description: `EMI interest ${row.index + 1}/${emi.months}: ${emi.description}`,
        date: row.billDate, accountId: emi.cardId, sourceEmiId: emi.id, emiLeg: 'interest', emiIndex: row.index,
      }))
      setState((prev) => ({ ...prev, transactions: dedupeRecurringTx([...txs, ...prev.transactions]) }))
      return { ok: true }
    }

    const deleteAccount = (id) => {
      if (state.cardEmis.some((e) => e.cardId === id)) return { ok: false, error: 'This card has EMI plans. Delete them first.' }
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
      const chosenId = accountId || state.accounts[0]?.id || null
      // A card declines what it cannot cover, like the real thing.
      const card = state.accounts.find((a) => a.id === chosenId && a.kind === 'credit')
      if (card && type === 'expense' && card.creditLimit > 0) {
        const bal = accountBalances.find((a) => a.id === card.id)?.balance || 0
        const available = Math.round((card.creditLimit - creditOwed(bal)) * 100) / 100
        if (num > available + 0.001) {
          return { ok: false, error: `Over the ${card.name} limit — only ${available} available.` }
        }
      }
      const tx = {
        id: safeId(),
        type,
        amount: Math.round(num * 100) / 100,
        category: String(category || '').trim() || 'Other',
        description: String(description || '').trim(),
        date: date ? String(date).slice(0, 10) : todayISODate(),
        accountId: chosenId,
      }
      setState((prev) => ({ ...prev, transactions: [tx, ...prev.transactions] }))
      return { ok: true, tx }
    }

    /**
     * Correct an existing entry.
     *
     * Only the fields present in `patch` change, so callers can update one
     * thing without resupplying the row. Loan-derived rows are refused:
     * they are rebuilt from the loan by buildLoanTransactions() whenever the
     * loan changes, so an edit here would be silently discarded later — the
     * loan itself is the thing to edit.
     */
    const updateTransaction = (id, patch = {}) => {
      const existing = state.transactions.find((t) => t.id === id)
      if (!existing) return { ok: false, error: 'That entry no longer exists.' }
      if (existing.sourceLoanId) {
        return { ok: false, error: 'This entry comes from a loan. Edit the loan instead.' }
      }
      if (existing.transferId) {
        return { ok: false, error: 'This is one side of a transfer. Delete it and make the transfer again.' }
      }
      if (existing.sourceEmiId) {
        return { ok: false, error: 'This entry comes from a card EMI plan. Change the plan instead.' }
      }

      const next = { ...existing }

      if (patch.amount !== undefined) {
        const num = Number(patch.amount)
        if (!Number.isFinite(num) || num <= 0) return { ok: false, error: 'Amount must be > 0.' }
        next.amount = Math.round(num * 100) / 100
      }
      if (patch.type !== undefined) {
        if (patch.type !== 'income' && patch.type !== 'expense') {
          return { ok: false, error: 'Transaction type is required.' }
        }
        next.type = patch.type
      }
      if (patch.category !== undefined) next.category = String(patch.category || '').trim() || 'Other'
      if (patch.description !== undefined) next.description = String(patch.description || '').trim()
      if (patch.date !== undefined) next.date = String(patch.date || '').slice(0, 10) || existing.date
      if (patch.accountId !== undefined) next.accountId = patch.accountId || existing.accountId

      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? next : t)),
      }))
      return { ok: true, tx: next }
    }


    // ── Recurring ──────────────────────────────────────────────────────────
    //
    // A rule describes something that happens every month (rent, salary, a
    // subscription). Each rule chooses its own mode: `auto` posts itself the
    // moment its month comes round, `approve` waits to be confirmed — so
    // certain things like rent can be automatic while variable ones stay a
    // deliberate act.

    const currentMonth = monthKeyFromDate(new Date())

    /** Months a rule still owes, oldest first, capped so a long-dormant rule can't flood the ledger. */
    const dueMonthsFor = (rule, limit = 12) => {
      if (!rule.active) return []
      const out = []
      let m = rule.startMonth
      // Walk forward from the start month; stop at today or the rule's end.
      while (m <= currentMonth && (!rule.endMonth || m <= rule.endMonth)) {
        if (!rule.postedMonths.includes(m) && !rule.skippedMonths.includes(m)) out.push(m)
        m = addMonthKey(m, 1)
        if (out.length >= limit) break
      }
      return out
    }

    const buildRecurringTx = (rule, monthKey) => ({
      id: safeId(),
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      description: rule.description || 'Recurring',
      date: clampDayToMonth(monthKey, rule.dayOfMonth),
      accountId: rule.accountId || state.accounts[0]?.id || null,
      sourceRecurringId: rule.id,
      recurringMonth: monthKey,
    })

    /** Everything waiting on a decision, flattened for the UI. */
    const pendingRecurring = state.recurring
      .filter((r) => r.active && r.mode === 'approve')
      .flatMap((r) => dueMonthsFor(r).map((monthKey) => ({ rule: r, monthKey })))

    /** Auto rules with months owed — posted by an effect, not during render. */
    const autoRecurringDue = state.recurring
      .filter((r) => r.active && r.mode === 'auto')
      .flatMap((r) => dueMonthsFor(r).map((monthKey) => ({ rule: r, monthKey })))

    const postRecurring = (ruleId, monthKey) => {
      const rule = state.recurring.find((r) => r.id === ruleId)
      if (!rule) return { ok: false, error: 'That recurring entry no longer exists.' }
      if (rule.postedMonths.includes(monthKey)) return { ok: true, alreadyPosted: true }
      const tx = buildRecurringTx(rule, monthKey)
      setState((prev) => ({
        ...prev,
        transactions: [tx, ...prev.transactions],
        recurring: prev.recurring.map((r) =>
          r.id === ruleId ? { ...r, postedMonths: [...r.postedMonths, monthKey] } : r
        ),
      }))
      return { ok: true, tx }
    }

    const skipRecurring = (ruleId, monthKey) => {
      setState((prev) => ({
        ...prev,
        recurring: prev.recurring.map((r) =>
          r.id === ruleId && !r.skippedMonths.includes(monthKey)
            ? { ...r, skippedMonths: [...r.skippedMonths, monthKey] }
            : r
        ),
      }))
      return { ok: true }
    }

    /** Post every owed month for the auto rules in a single state update. */
    const runAutoRecurring = () => {
      if (!autoRecurringDue.length) return { ok: true, posted: 0 }
      const txs = autoRecurringDue.map(({ rule, monthKey }) => buildRecurringTx(rule, monthKey))
      const byRule = new Map()
      autoRecurringDue.forEach(({ rule, monthKey }) => {
        byRule.set(rule.id, [...(byRule.get(rule.id) || []), monthKey])
      })
      setState((prev) => ({
        ...prev,
        transactions: [...txs, ...prev.transactions],
        recurring: prev.recurring.map((r) =>
          byRule.has(r.id)
            ? { ...r, postedMonths: [...r.postedMonths, ...byRule.get(r.id)] }
            : r
        ),
      }))
      return { ok: true, posted: txs.length }
    }

    const addRecurring = (payload) => {
      const rule = normalizeRecurring({ ...payload, id: safeId() })
      if (!rule) return { ok: false, error: 'Amount must be > 0.' }
      setState((prev) => ({ ...prev, recurring: [rule, ...prev.recurring] }))
      return { ok: true, rule }
    }

    const updateRecurring = (id, patch) => {
      const existing = state.recurring.find((r) => r.id === id)
      if (!existing) return { ok: false, error: 'That recurring entry no longer exists.' }
      const merged = normalizeRecurring({ ...existing, ...patch, id })
      if (!merged) return { ok: false, error: 'Amount must be > 0.' }
      setState((prev) => ({ ...prev, recurring: prev.recurring.map((r) => (r.id === id ? merged : r)) }))
      return { ok: true, rule: merged }
    }

    /** Deleting a rule leaves the entries it already posted — they really happened. */
    const deleteRecurring = (id) => {
      setState((prev) => ({ ...prev, recurring: prev.recurring.filter((r) => r.id !== id) }))
      return { ok: true }
    }

    /** A transfer leg takes its other leg with it, so balances never go lopsided. */
    const deleteTransaction = (id) => {
      setState((prev) => {
        const target = prev.transactions.find((t) => t.id === id)
        const pair = target?.transferId
        return {
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id && (!pair || t.transferId !== pair)),
        }
      })
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

    /** `autoPay` undefined keeps the loan's current plan; null removes it. */
    const upsertLoan = ({ id, direction, amount, borrowDate, extendedDate, reason, countInFinance, person, autoPay }) => {
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
          autoPay: autoPay === undefined ? existing?.autoPay || null : normalizeAutoPay(autoPay),
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

    // ── Loan installments ──────────────────────────────────────────────────
    const loanInstallmentsDue = state.loans.flatMap((l) =>
      dueInstallments(l, currentMonth).map((d) => ({ loan: l, ...d }))
    )

    /** Post every owed installment as a repayment, in one state update. */
    const runAutoLoanInstallments = () => {
      if (!loanInstallmentsDue.length) return { ok: true }
      setState((prev) => {
        const accountId = prev.accounts[0]?.id ?? null
        let changed = false
        let transactions = prev.transactions
        const loans = prev.loans.map((l) => {
          // Recomputed from `prev`, so a second run can never post a month twice.
          const due = dueInstallments(l, currentMonth)
          if (!due.length) return l
          changed = true
          const done = installmentsPosted(l)
          const reps = due.map((d, i) => ({
            id: safeId(),
            amount: d.amount,
            date: d.date,
            note: `Auto installment ${done + i + 1}/${l.autoPay.months}`,
            autoMonth: d.monthKey,
          }))
          const next = { ...l, repayments: [...(l.repayments || []), ...reps] }
          transactions = [...buildLoanTransactions(next, accountId), ...transactions.filter((t) => t.sourceLoanId !== l.id)]
          return next
        })
        return changed ? { ...prev, loans, transactions } : prev
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

    /**
     * First-run answers. Sets the currency and any opening balances in one
     * write, and flips `onboarded` so the sheet never returns.
     */
    const completeOnboarding = ({ currency: code, openingBalances } = {}) => {
      setState((prev) => {
        const next = { ...prev, onboarded: true }
        if (isValidCurrencyCode(code)) next.currency = code.toUpperCase()
        if (openingBalances && typeof openingBalances === 'object') {
          next.accounts = prev.accounts.map((a) => {
            const raw = openingBalances[a.id]
            const amount = Number(raw)
            return raw !== undefined && raw !== '' && Number.isFinite(amount)
              ? { ...a, startingBalance: amount }
              : a
          })
        }
        return next
      })
      return { ok: true }
    }

    /** Load demo data into current state (merges sample transactions/loans) */
    const loadDemoData = () => {
      setState((prev) => mergeOneTimeDemoFinance(prev))
      return { ok: true }
    }

    return {
      currency: state.currency,
      onboarded: state.onboarded,
      completeOnboarding,
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
      updateAccountCredit,
      payCreditCard,
      transferFunds,
      availableCredit,
      addCardCharge,
      cardEmis: state.cardEmis,
      addCardEmi,
      closeCardEmi,
      deleteCardEmi,
      cardEmiInterestDue,
      runCardEmiInterest,
      renameAccount,
      updateAccountBalance,
      deleteAccount,
      addCategory,
      removeCategory,
      setCurrency,
      setBudgetForCategory,
      clearBudgetForCategory,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      recurring: state.recurring,
      pendingRecurring,
      autoRecurringDue,
      addRecurring,
      updateRecurring,
      deleteRecurring,
      postRecurring,
      skipRecurring,
      runAutoRecurring,
      importTransactionsFromRows,
      upsertLoan,
      loanInstallmentsDue,
      runAutoLoanInstallments,
      addRepayment,
      deleteRepayment,
      deleteLoan,
      resetFinanceDataForMonth,
      resetAllFinanceToEmpty,
      loadDemoData,
    }
  }, [state])

  // Auto recurring rules post themselves, but only once Firestore has confirmed
  // what this account already has. Running before that would re-post months the
  // cloud copy already recorded, on every device, every load.
  //
  // Depends on `state` rather than the due-count: when the remote snapshot
  // arrives the count often stays the same (the local cache had the same rules),
  // so a count-based dependency would never re-fire after the gate opened.
  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    if (!remoteReadyRef.current) return
    if (!api.autoRecurringDue.length) return
    api.runAutoRecurring()
  }, [state, uid, hydratedUid, api])

  // Card EMI interest posts itself on each bill date, same gate again.
  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    if (!remoteReadyRef.current) return
    if (!api.cardEmiInterestDue.length) return
    api.runCardEmiInterest()
  }, [state, uid, hydratedUid, api])

  // Loan installments post themselves under the same gate as recurring rules.
  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    if (!remoteReadyRef.current) return
    if (!api.loanInstallmentsDue.length) return
    api.runAutoLoanInstallments()
  }, [state, uid, hydratedUid, api])

  return <FinanceContext.Provider value={api}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider')
  return ctx
}
