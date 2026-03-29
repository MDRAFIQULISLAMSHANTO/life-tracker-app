/**
 * One-time sample ledger for empty accounts (per browser user id in localStorage).
 */

export const DEMO_FINANCE_KEY = (uid) => `livio_demo_finance_${uid || 'anon'}`

function dayInMonth(monthKey, day) {
  return `${monthKey}-${String(day).padStart(2, '0')}`
}

function prevMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** @param {object} base normalized finance state (from normalizeFinancePayload) */
export function mergeOneTimeDemoFinance(base) {
  const mk = base.ledgerMonthKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const pm = prevMonthKey(mk)
  const accBank = base.accounts.find((a) => a.id === 'acc_bank')?.id || base.accounts[0]?.id
  const accCash = base.accounts.find((a) => a.id === 'acc_cash')?.id || base.accounts[0]?.id

  const transactions = [
    {
      id: 'demo_fin_tx_1',
      type: 'income',
      amount: 85000,
      category: 'Salary',
      description: 'Monthly salary (demo)',
      date: dayInMonth(mk, 1),
      accountId: accBank,
    },
    {
      id: 'demo_fin_tx_2',
      type: 'income',
      amount: 12500,
      category: 'Freelance',
      description: 'Design project (demo)',
      date: dayInMonth(mk, 10),
      accountId: accBank,
    },
    {
      id: 'demo_fin_tx_3',
      type: 'expense',
      amount: 18500,
      category: 'Food & Dining',
      description: 'Groceries (demo)',
      date: dayInMonth(mk, 3),
      accountId: accCash,
    },
    {
      id: 'demo_fin_tx_4',
      type: 'expense',
      amount: 4200,
      category: 'Transportation',
      description: 'Fuel (demo)',
      date: dayInMonth(mk, 5),
      accountId: accCash,
    },
    {
      id: 'demo_fin_tx_5',
      type: 'expense',
      amount: 8900,
      category: 'Bills & Utilities',
      description: 'Electric bill (demo)',
      date: dayInMonth(mk, 7),
      accountId: accBank,
    },
    {
      id: 'demo_fin_tx_6',
      type: 'expense',
      amount: 3500,
      category: 'Entertainment',
      description: 'Streaming (demo)',
      date: dayInMonth(mk, 12),
      accountId: accBank,
    },
    {
      id: 'demo_fin_tx_7',
      type: 'expense',
      amount: 6200,
      category: 'Shopping',
      description: 'Household (demo)',
      date: dayInMonth(mk, 15),
      accountId: accCash,
    },
    {
      id: 'demo_fin_tx_8',
      type: 'expense',
      amount: 2800,
      category: 'Healthcare',
      description: 'Pharmacy (demo)',
      date: dayInMonth(mk, 18),
      accountId: accCash,
    },
    {
      id: 'demo_fin_tx_9',
      type: 'income',
      amount: 5000,
      category: 'Other',
      description: 'Cashback (demo)',
      date: dayInMonth(pm, 22),
      accountId: accBank,
    },
    {
      id: 'demo_fin_tx_10',
      type: 'expense',
      amount: 12000,
      category: 'Food & Dining',
      description: 'Dining out (demo)',
      date: dayInMonth(pm, 28),
      accountId: accBank,
    },
  ]

  const loanId = 'demo_fin_loan_1'
  const loans = [
    {
      id: loanId,
      amount: 150000,
      borrowDate: dayInMonth(pm, 5),
      extendedDate: dayInMonth(mk, 5),
      reason: 'Personal loan (demo)',
      addToIncome: false,
    },
  ]

  const loanTx = {
    id: 'demo_fin_tx_loan',
    type: 'loan',
    amount: 150000,
    category: 'Loans',
    description: 'Loan: Personal loan (demo)',
    date: dayInMonth(pm, 5),
    accountId: accBank,
    sourceLoanId: loanId,
  }

  const budgetsByMonth = {
    ...base.budgetsByMonth,
    [mk]: {
      ...(base.budgetsByMonth?.[mk] || {}),
      'Food & Dining': 25000,
      Transportation: 8000,
      'Bills & Utilities': 12000,
      Entertainment: 6000,
      Shopping: 10000,
    },
  }

  const accounts = base.accounts.map((a) => {
    if (a.id === 'acc_bank') return { ...a, startingBalance: 25000 }
    if (a.id === 'acc_cash') return { ...a, startingBalance: 3000 }
    return a
  })

  return {
    ...base,
    ledgerMonthKey: mk,
    accounts,
    transactions: [...transactions, loanTx],
    loans,
    budgetsByMonth,
  }
}
