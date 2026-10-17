/**
 * Credit card engine — pure functions, no React, no storage.
 *
 * Nothing here is stored. A card's statements, minimum due, payment status and
 * EMI progress are all derived from three things the ledger already holds:
 * the card account (limit, statement day, due day, minimum-due rule), the
 * transactions on that account, and the card's EMI plans. Deriving instead of
 * storing means editing or deleting an old purchase re-bills every statement
 * after it correctly, with no stored total to drift out of step.
 *
 * Sign convention: a card account's balance is negative while money is owed
 * (spending is an `expense` on the card, a bill payment is an `income` on it),
 * the same arithmetic every other account uses. `owed` = -balance.
 */

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100

export function monthKeyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function addMonths(monthKey, delta) {
  const [y, m] = String(monthKey).split('-').map(Number)
  return monthKeyOf(new Date(y, m - 1 + delta, 1))
}

/** `YYYY-MM-DD` for day `day` of `monthKey`, clamped to the month's length. */
export function dayInMonth(monthKey, day) {
  const [y, m] = String(monthKey).split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  const d = Math.min(Math.max(Number(day) || 1, 1), last)
  return `${monthKey}-${String(d).padStart(2, '0')}`
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${monthKeyOf(dt)}-${String(dt.getDate()).padStart(2, '0')}`
}

export function todayISO() {
  const d = new Date()
  return `${monthKeyOf(d)}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysBetween(fromIso, toIso) {
  const a = new Date(`${fromIso}T00:00:00`)
  const b = new Date(`${toIso}T00:00:00`)
  return Math.round((b - a) / 86400000)
}

/** A bill payment, as opposed to a refund or cashback landing on the card. */
export function isCardPayment(t) {
  return t.type === 'income' && (!!t.transferId || t.category === 'Transfer')
}

// ── Billing cycle ──────────────────────────────────────────────────────────

/** The statement (cycle close) date in `monthKey`. */
export function closeDateFor(card, monthKey) {
  return dayInMonth(monthKey, card.statementDay || 1)
}

/**
 * When the bill for a statement closing on `closeDate` is due. With a due day
 * set, it's the first such day after the close (due 15th, close 25th → 15th of
 * next month). Without one, banks' common 20-day grace.
 */
export function dueDateFor(card, closeDate) {
  if (!card.dueDay) return addDays(closeDate, 20)
  const mk = closeDate.slice(0, 7)
  const sameMonth = dayInMonth(mk, card.dueDay)
  return sameMonth > closeDate ? sameMonth : dayInMonth(addMonths(mk, 1), card.dueDay)
}

/** First statement close on or after `iso`. */
export function firstCloseOnOrAfter(card, iso) {
  const mk = iso.slice(0, 7)
  const close = closeDateFor(card, mk)
  return close >= iso ? close : closeDateFor(card, addMonths(mk, 1))
}

// ── EMI ────────────────────────────────────────────────────────────────────

/**
 * Month-by-month installments. Reducing-balance (the standard EMI formula)
 * when there is interest; an even split at 0%. The last row absorbs rounding
 * so the principal column always sums to exactly the amount borrowed.
 */
export function emiSchedule(emi) {
  const P = round2(emi.principal)
  const n = Math.max(1, Math.floor(emi.months))
  const r = Number(emi.ratePct || 0) / 1200
  const installment = r > 0 ? (P * r * (1 + r) ** n) / ((1 + r) ** n - 1) : P / n
  const rows = []
  let remaining = P
  for (let i = 0; i < n; i++) {
    const interest = round2(remaining * r)
    let principal = round2(installment - interest)
    if (i === n - 1) principal = round2(remaining)
    remaining = round2(remaining - principal)
    rows.push({ index: i, principal, interest, total: round2(principal + interest), remainingAfter: remaining })
  }
  return rows
}

/** The statement close date each installment is billed on. */
export function emiBillDates(card, emi) {
  const first = firstCloseOnOrAfter(card, emi.purchaseDate)
  const firstMonth = first.slice(0, 7)
  return emiSchedule(emi).map((row, i) => ({ ...row, billDate: closeDateFor(card, addMonths(firstMonth, i)) }))
}

/**
 * EMI position on a given date: installments billed, principal still unbilled.
 * A closed (pre-paid) EMI bills everything left on the first statement after
 * the closing date, and stops charging interest.
 */
export function emiStateAt(card, emi, iso) {
  if (emi.purchaseDate > iso) return { billed: 0, unbilledPrincipal: 0, rows: [] }
  const rows = emiBillDates(card, emi)
  const forecloseBill = emi.closedOn ? firstCloseOnOrAfter(card, emi.closedOn) : null
  let billed = 0
  let billedPrincipal = 0
  for (const row of rows) {
    if (forecloseBill && row.billDate > forecloseBill) break
    if (row.billDate > iso) break
    billed++
    billedPrincipal += row.principal
  }
  let unbilled = round2(emi.principal - billedPrincipal)
  if (forecloseBill && forecloseBill <= iso) unbilled = 0
  return { billed, unbilledPrincipal: Math.max(0, unbilled), rows }
}

/** Interest rows that should exist as transactions by `iso` (posted on each bill date). */
export function emiInterestDue(card, emi, iso) {
  const forecloseBill = emi.closedOn ? firstCloseOnOrAfter(card, emi.closedOn) : null
  return emiBillDates(card, emi).filter(
    (r) => r.interest > 0 && r.billDate <= iso && (!forecloseBill || r.billDate <= forecloseBill)
  )
}

// ── Statements ─────────────────────────────────────────────────────────────

function owedAt(card, txs, iso) {
  let bal = Number(card.startingBalance || 0)
  for (const t of txs) {
    if (t.date > iso) continue
    const n = Number(t.amount || 0)
    bal += t.type === 'expense' ? -n : n
  }
  return round2(-bal)
}

function unbilledEmiAt(card, emis, iso) {
  return round2(emis.reduce((s, e) => s + emiStateAt(card, e, iso).unbilledPrincipal, 0))
}

/** Installment amounts billed exactly on `closeDate` — they are due in full, not 5%. */
function emiBilledOn(card, emis, closeDate) {
  let sum = 0
  for (const e of emis) {
    const forecloseBill = e.closedOn ? firstCloseOnOrAfter(card, e.closedOn) : null
    if (forecloseBill && forecloseBill < closeDate) continue
    const rowsOn = emiBillDates(card, e).filter((r) => r.billDate === closeDate)
    if (forecloseBill === closeDate) {
      // Pre-paid: everything still unbilled lands now, plus this month's interest.
      sum += emiStateAt(card, e, addDays(closeDate, -1)).unbilledPrincipal
      sum += rowsOn.reduce((s, r) => s + r.interest, 0)
    } else {
      sum += rowsOn.reduce((s, r) => s + r.total, 0)
    }
  }
  return round2(sum)
}

export const STATUS = {
  NONE: 'none',
  FULL: 'full',
  PARTIAL: 'partial',
  MINIMUM: 'minimum',
  BELOW_MIN: 'below_min',
  DUE: 'due',
  MISSED: 'missed',
}

export const STATUS_LABEL = {
  none: 'No dues',
  full: 'Paid in full',
  partial: 'Partially paid',
  minimum: 'Minimum paid',
  below_min: 'Below minimum',
  due: 'Due',
  missed: 'Missed',
}

/**
 * Every closed statement from the card's opening to today, newest first, plus
 * the open cycle. Each statement carries what was billed, the minimum due, the
 * payments that went towards it (with the account they came from) and a status.
 *
 * @param card       a credit account (normalized)
 * @param allTx      every transaction in the ledger
 * @param emis       this card's EMI plans
 * @param accountsById  for naming where each payment came from
 */
export function buildCardLedger(card, allTx, emis = [], accountsById = {}, today = todayISO()) {
  const txs = allTx
    .filter((t) => t.accountId === card.id && t.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const opened = card.openedOn || txs[0]?.date || today
  const startIso = txs[0] && txs[0].date < opened ? txs[0].date : opened

  const closes = []
  for (let c = firstCloseOnOrAfter(card, startIso); c <= today && closes.length < 60; ) {
    closes.push(c)
    c = closeDateFor(card, addMonths(c.slice(0, 7), 1))
  }

  const payments = txs.filter(isCardPayment).map((t) => ({
    ...t,
    fromName: accountsById[t.fromAccountId]?.name || (t.description || '').replace(/^Payment from /, '') || 'Another account',
  }))

  const statements = []
  let prevClose = null
  let carryPastDue = 0
  closes.forEach((close, i) => {
    const nextClose = closes[i + 1] || null
    const due = dueDateFor(card, close)
    const balance = Math.max(0, round2(owedAt(card, txs, close) - unbilledEmiAt(card, emis, close)))
    const emiPart = Math.min(balance, emiBilledOn(card, emis, close))
    const pct = Number(card.minDuePct ?? 5) / 100
    const floor = Number(card.minDueFloor || 0)
    const revolving = Math.max(0, balance - emiPart)
    let minDue = revolving > 0 ? Math.max(floor, revolving * pct) : 0
    minDue = round2(Math.min(balance, minDue + emiPart + carryPastDue))

    const windowEnd = nextClose || today
    const paidList = payments.filter((p) => p.date > close && p.date <= windowEnd)
    const paid = round2(paidList.reduce((s, p) => s + Number(p.amount || 0), 0))
    const paidOnTime = round2(paidList.filter((p) => p.date <= due).reduce((s, p) => s + Number(p.amount || 0), 0))

    let status
    if (balance <= 0) status = STATUS.NONE
    else if (paid >= balance - 0.009) status = STATUS.FULL
    else if (paid >= minDue - 0.009 && minDue > 0) status = Math.abs(paid - minDue) < 0.01 ? STATUS.MINIMUM : STATUS.PARTIAL
    else if (paid > 0) status = today > due ? STATUS.BELOW_MIN : STATUS.DUE
    else status = today > due ? STATUS.MISSED : STATUS.DUE

    const spends = txs.filter((t) => t.type === 'expense' && (!prevClose || t.date > prevClose) && t.date <= close)
    const credits = txs.filter((t) => t.type === 'income' && !isCardPayment(t) && (!prevClose || t.date > prevClose) && t.date <= close)

    statements.push({
      close,
      periodStart: prevClose ? addDays(prevClose, 1) : startIso,
      due,
      balance,
      minDue,
      emiPart: round2(emiPart),
      paid,
      paidOnTime,
      remaining: Math.max(0, round2(balance - paid)),
      minRemaining: Math.max(0, round2(minDue - paid)),
      late: status === STATUS.FULL && paidOnTime < balance - 0.009,
      status,
      payments: paidList,
      spends,
      credits,
      spent: round2(spends.reduce((s, t) => s + Number(t.amount || 0), 0)),
    })
    // An unpaid minimum is past due and joins the next statement's minimum.
    carryPastDue = today > due ? Math.max(0, round2(minDue - paidOnTime)) : 0
    prevClose = close
  })

  const lastClose = closes[closes.length - 1] || null
  const nextClose = lastClose ? closeDateFor(card, addMonths(lastClose.slice(0, 7), 1)) : firstCloseOnOrAfter(card, today)
  const owed = owedAt(card, txs, '9999-12-31')
  const emiUnbilled = unbilledEmiAt(card, emis, today)
  const cycleSpends = txs.filter((t) => t.type === 'expense' && (!lastClose || t.date > lastClose))
  const limit = Number(card.creditLimit || 0)

  return {
    owed,
    available: limit > 0 ? round2(limit - owed) : null,
    limit,
    utilization: limit > 0 ? Math.min(100, Math.max(0, (owed / limit) * 100)) : 0,
    emiUnbilled,
    statements: [...statements].reverse(),
    current: statements[statements.length - 1] || null,
    cycle: {
      start: lastClose ? addDays(lastClose, 1) : startIso,
      closesOn: nextClose,
      dueOn: dueDateFor(card, nextClose),
      spends: [...cycleSpends].reverse(),
      spent: round2(cycleSpends.reduce((s, t) => s + Number(t.amount || 0), 0)),
    },
    payments: [...payments].reverse(),
  }
}

/** The EMI view the card page shows for each plan. */
export function emiProgress(card, emi, today = todayISO()) {
  const state = emiStateAt(card, emi, today)
  const rows = state.rows
  const next = emi.closedOn ? null : rows.find((r) => r.billDate > today) || null
  const totalInterest = round2(rows.reduce((s, r) => s + r.interest, 0))
  return {
    billed: state.billed,
    months: rows.length,
    unbilledPrincipal: state.unbilledPrincipal,
    monthly: rows[0]?.total || 0,
    next,
    endsOn: rows[rows.length - 1]?.billDate || null,
    totalInterest,
    totalCost: round2(Number(emi.principal) + totalInterest + Number(emi.fee || 0)),
    done: !!emi.closedOn || state.billed >= rows.length,
    rows,
  }
}
