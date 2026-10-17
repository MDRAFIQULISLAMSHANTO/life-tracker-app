'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, ChevronDown, CircleDollarSign,
  Clock, CreditCard, Layers, Plus, Receipt, Settings2, Trash2, XCircle,
} from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { useFinance } from '../../../../context/FinanceContext'
import { formatCurrency } from '../../../../utils/formatters'
import { Badge, Button, EmptyState, Field, Input, ProgressBar, SegmentedControl, Select, Sheet } from '../../../../components/ui'
import {
  STATUS, STATUS_LABEL, buildCardLedger, daysBetween, emiProgress, emiSchedule, firstCloseOnOrAfter, todayISO,
} from '../../../../lib/creditCard'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(iso, withYear = false) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const thisYear = new Date().getFullYear()
  return `${d} ${MONTHS[m - 1]}${withYear || y !== thisYear ? ` ${y}` : ''}`
}

function statementLabel(close) {
  const [y, m] = close.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

const STATUS_STYLE = {
  [STATUS.NONE]: { color: 'var(--text-3)', Icon: CheckCircle2 },
  [STATUS.FULL]: { color: 'var(--success)', Icon: CheckCircle2 },
  [STATUS.PARTIAL]: { color: 'var(--warning)', Icon: CircleDollarSign },
  [STATUS.MINIMUM]: { color: 'var(--warning)', Icon: CircleDollarSign },
  [STATUS.BELOW_MIN]: { color: 'var(--danger)', Icon: AlertTriangle },
  [STATUS.DUE]: { color: 'var(--accent)', Icon: Clock },
  [STATUS.MISSED]: { color: 'var(--danger)', Icon: XCircle },
}

function StatusBadge({ statement }) {
  const { color, Icon } = STATUS_STYLE[statement.status]
  return (
    <Badge color={color}>
      <Icon className="w-3 h-3" aria-hidden />
      {STATUS_LABEL[statement.status]}{statement.late ? ' · late' : ''}
    </Badge>
  )
}

const KIND_LABEL = { full: 'Full statement', minimum: 'Minimum due', total: 'Total outstanding', custom: 'Custom amount' }

function Tile({ label, value, hint, tone }) {
  return (
    <div className="glass-card !p-4 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-lg font-extrabold tabular-nums tracking-tight truncate" style={{ color: tone || 'var(--text-1)' }}>{value}</p>
      {hint && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>{hint}</p>}
    </div>
  )
}

function TxLine({ t, currency, right }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs py-2" style={{ borderTop: '1px solid var(--card-border)' }}>
      <div className="min-w-0">
        <p className="font-semibold truncate" style={{ color: 'var(--text-1)' }}>{t.description || t.category}</p>
        <p style={{ color: 'var(--text-3)' }}>{fmtDate(t.date)} · {t.category}{t.emiId ? ' · on EMI' : ''}</p>
      </div>
      <span className="font-bold tabular-nums shrink-0" style={{ color: 'var(--text-1)' }}>{right ?? formatCurrency(Number(t.amount || 0), currency)}</span>
    </div>
  )
}

// ── Sheets ─────────────────────────────────────────────────────────────────

function PaySheet({ open, onClose, card, ledger, currency }) {
  const { accounts, accountBalances, payCreditCard } = useFinance()
  const sources = accounts.filter((a) => a.id !== card.id)
  const balOf = (id) => accountBalances.find((a) => a.id === id)?.balance || 0
  const st = ledger.current
  const options = [
    st && st.remaining > 0 && { kind: 'full', label: 'Full statement', amount: st.remaining },
    st && st.minRemaining > 0 && { kind: 'minimum', label: 'Minimum due', amount: st.minRemaining },
    ledger.owed > 0 && { kind: 'total', label: 'Total outstanding', amount: ledger.owed },
  ].filter(Boolean)

  const [kind, setKind] = useState(options[0]?.kind || 'custom')
  const [amount, setAmount] = useState(String(options[0]?.amount || ''))
  const [fromId, setFromId] = useState(sources.find((a) => a.kind !== 'credit')?.id || sources[0]?.id || '')
  const [date, setDate] = useState(todayISO)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const pick = (o) => { setKind(o.kind); setAmount(String(o.amount)) }
  const fromBal = balOf(fromId)
  const num = Number(amount) || 0

  const submit = (e) => {
    e.preventDefault()
    const r = payCreditCard(card.id, fromId, amount, date, kind, note)
    if (!r.ok) { setError(r.error); return }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Pay ${card.name}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {options.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {options.map((o) => (
              <button key={o.kind} type="button" onClick={() => pick(o)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: kind === o.kind ? 'rgba(var(--accent-rgb),0.10)' : 'var(--input-bg)',
                  border: `1.5px solid ${kind === o.kind ? 'var(--accent)' : 'var(--card-border)'}`,
                }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{o.label}</span>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(o.amount, currency)}</span>
              </button>
            ))}
          </div>
        )}
        <Field label="Amount" hint={kind === 'custom' ? 'Any amount — the statement status works itself out.' : KIND_LABEL[kind]}>
          <Input type="number" inputMode="decimal" step="0.01" min="0.01" required value={amount}
            onChange={(e) => { setAmount(e.target.value); setKind('custom') }} />
        </Field>
        <Field label="Pay from" hint={fromId ? `Balance after: ${formatCurrency(fromBal - num, currency)}` : undefined}>
          <Select value={fromId} onChange={(e) => setFromId(e.target.value)} required>
            <option value="">Choose…</option>
            {sources.map((a) => (
              <option key={a.id} value={a.id}>{a.name}{a.kind === 'credit' ? ' (card)' : ''} · {formatCurrency(balOf(a.id), currency)}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
          <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
        </div>
        {error && <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>}
        <Button type="submit" full>Pay {num > 0 ? formatCurrency(num, currency) : ''}</Button>
      </form>
    </Sheet>
  )
}

function EmiSheet({ open, onClose, card, currency }) {
  const { transactions, expenseCategories, addCardEmi, cardEmis } = useFinance()
  const convertible = useMemo(() => transactions
    .filter((t) => t.accountId === card.id && t.type === 'expense' && !t.emiId && !t.sourceEmiId && !t.cardCharge && !t.transferId)
    .filter((t) => !cardEmis.some((e) => e.purchaseTxId === t.id))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 50), [transactions, card.id, cardEmis])

  const [mode, setMode] = useState(convertible.length ? 'existing' : 'new')
  const [txId, setTxId] = useState(convertible[0]?.id || '')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(expenseCategories.includes('Shopping') ? 'Shopping' : expenseCategories[0] || 'Other')
  const [principal, setPrincipal] = useState(String(convertible[0]?.amount || ''))
  const [purchaseDate, setPurchaseDate] = useState(todayISO)
  const [months, setMonths] = useState('6')
  const [ratePct, setRatePct] = useState('0')
  const [fee, setFee] = useState('')
  const [error, setError] = useState('')

  const tx = convertible.find((t) => t.id === txId)
  const P = Number(principal) || 0
  const n = Math.floor(Number(months) || 0)
  const rows = P > 0 && n >= 1 ? emiSchedule({ principal: P, months: n, ratePct }) : []
  const interest = rows.reduce((s, r) => s + r.interest, 0)
  const firstBill = firstCloseOnOrAfter(card, mode === 'existing' ? tx?.date || todayISO() : purchaseDate)

  const submit = (e) => {
    e.preventDefault()
    const r = addCardEmi({
      cardId: card.id,
      purchaseTxId: mode === 'existing' ? txId : undefined,
      description: mode === 'new' ? description : undefined,
      category, principal, months, ratePct, fee,
      purchaseDate: mode === 'new' ? purchaseDate : undefined,
    })
    if (!r.ok) { setError(r.error); return }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="EMI on this card">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[{ value: 'existing', label: 'Convert a purchase' }, { value: 'new', label: 'New EMI purchase' }]}
        />
        {mode === 'existing' ? (
          convertible.length ? (
            <Field label="Purchase">
              <Select value={txId} onChange={(e) => { setTxId(e.target.value); const t = convertible.find((x) => x.id === e.target.value); setPrincipal(String(t?.amount || '')) }}>
                {convertible.map((t) => (
                  <option key={t.id} value={t.id}>{fmtDate(t.date)} · {t.description || t.category} · {formatCurrency(Number(t.amount), currency)}</option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No card purchases to convert yet. Record it as a new EMI purchase instead.</p>
          )
        ) : (
          <>
            <Field label="What did you buy?">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Phone, laptop, fridge…" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Purchase date"><Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></Field>
            </div>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="EMI amount" hint={mode === 'existing' && tx ? `Purchase was ${formatCurrency(Number(tx.amount), currency)}` : undefined}>
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
          </Field>
          <Field label="Months">
            <Input type="number" inputMode="numeric" min="1" max="120" value={months} onChange={(e) => setMonths(e.target.value)} required />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {[3, 6, 9, 12, 18, 24, 36].map((m) => (
            <button key={m} type="button" onClick={() => setMonths(String(m))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: String(m) === months ? 'rgba(var(--accent-rgb),0.12)' : 'var(--input-bg)',
                color: String(m) === months ? 'var(--accent)' : 'var(--text-2)',
                border: '1px solid var(--card-border)',
              }}>{m} mo</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Interest % / year" hint="0 for 0% EMI">
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={ratePct} onChange={(e) => setRatePct(e.target.value)} />
          </Field>
          <Field label="Processing fee">
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
          </Field>
        </div>
        {rows.length > 0 && (
          <div className="rounded-xl p-4 text-xs space-y-1" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
            <div className="flex justify-between"><span style={{ color: 'var(--text-2)' }}>Monthly installment</span><strong className="tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(rows[0].total, currency)}</strong></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-2)' }}>Total interest</span><strong className="tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(interest, currency)}</strong></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-2)' }}>Total cost</span><strong className="tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(P + interest + (Number(fee) || 0), currency)}</strong></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-2)' }}>First billed on</span><strong style={{ color: 'var(--text-1)' }}>{fmtDate(firstBill, true)} statement</strong></div>
          </div>
        )}
        {error && <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>}
        <Button type="submit" full disabled={mode === 'existing' && !convertible.length}>Create EMI</Button>
      </form>
    </Sheet>
  )
}

function ChargeSheet({ open, onClose, card }) {
  const { addCardCharge } = useFinance()
  const [label, setLabel] = useState('Interest')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const r = addCardCharge(card.id, { amount, date, label, note })
    if (!r.ok) { setError(r.error); return }
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Bank charge on card">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Type">
          <Select value={label} onChange={(e) => setLabel(e.target.value)}>
            {['Interest', 'Late payment fee', 'Annual fee', 'Over-limit fee', 'Cash advance fee', 'Other charge'].map((l) => <option key={l}>{l}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount"><Input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="As printed on the statement" /></Field>
        {error && <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>}
        <Button type="submit" full>Add charge</Button>
      </form>
    </Sheet>
  )
}

function SettingsSheet({ open, onClose, card }) {
  const { updateAccountCredit } = useFinance()
  const [v, setV] = useState({
    creditLimit: String(card.creditLimit || ''),
    statementDay: String(card.statementDay || ''),
    dueDay: String(card.dueDay || ''),
    minDuePct: String(card.minDuePct ?? 5),
    minDueFloor: String(card.minDueFloor || ''),
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const r = updateAccountCredit(card.id, { ...v, minDueFloor: v.minDueFloor || 0, dueDay: v.dueDay || 0 })
    if (!r.ok) { setError(r.error); return }
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={`${card.name} settings`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Credit limit"><Input type="number" min="1" required value={v.creditLimit} onChange={set('creditLimit')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Statement day" hint="Day the bill is generated"><Input type="number" min="1" max="31" required value={v.statementDay} onChange={set('statementDay')} /></Field>
          <Field label="Payment due day" hint="Blank = 20 days later"><Input type="number" min="1" max="31" value={v.dueDay} onChange={set('dueDay')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum due %" hint="Of the non-EMI balance"><Input type="number" min="0" max="100" step="0.1" value={v.minDuePct} onChange={set('minDuePct')} /></Field>
          <Field label="Minimum due at least" hint="e.g. 500"><Input type="number" min="0" value={v.minDueFloor} onChange={set('minDueFloor')} /></Field>
        </div>
        {error && <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>}
        <Button type="submit" full>Save</Button>
      </form>
    </Sheet>
  )
}

// ── Sections ───────────────────────────────────────────────────────────────

function StatementRow({ s, currency, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold" style={{ color: 'var(--text-1)' }}>{statementLabel(s.close)}</span>
            <StatusBadge statement={s} />
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            Billed {fmtDate(s.close)} · due {fmtDate(s.due)} · min {formatCurrency(s.minDue, currency)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(s.balance, currency)}</p>
          <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-2)' }}>paid {formatCurrency(s.paid, currency)}</p>
        </div>
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          {s.balance > 0 && (
            <div className="mb-3">
              <ProgressBar value={(s.paid / s.balance) * 100} color={STATUS_STYLE[s.status].color} height={6} />
              <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                {fmtDate(s.periodStart)} – {fmtDate(s.close)}
                {s.emiPart > 0 && <> · includes {formatCurrency(s.emiPart, currency)} EMI</>}
                {s.remaining > 0 && <> · {formatCurrency(s.remaining, currency)} carried forward</>}
              </p>
            </div>
          )}
          {s.payments.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-2 mb-1" style={{ color: 'var(--text-3)' }}>Payments</p>
              {s.payments.map((p) => (
                <TxLine key={p.id} currency={currency}
                  t={{ ...p, description: `From ${p.fromName}`, category: KIND_LABEL[p.paymentKind] || 'Payment' }} />
              ))}
            </>
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest mt-3 mb-1" style={{ color: 'var(--text-3)' }}>
            Spent this cycle · {formatCurrency(s.spent, currency)}
          </p>
          {s.spends.length ? s.spends.map((t) => <TxLine key={t.id} t={t} currency={currency} />)
            : <p className="text-xs py-2" style={{ color: 'var(--text-3)' }}>Nothing spent in this cycle.</p>}
          {s.credits.length > 0 && s.credits.map((t) => (
            <TxLine key={t.id} t={t} currency={currency} right={`−${formatCurrency(Number(t.amount), currency)}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmiCard({ card, emi, currency }) {
  const { closeCardEmi, deleteCardEmi } = useFinance()
  const pr = emiProgress(card, emi)
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text-1)' }}>{emi.description}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {formatCurrency(emi.principal, currency)} · {emi.months} months · {emi.ratePct ? `${emi.ratePct}% p.a.` : '0% EMI'}
            {emi.fee ? ` · fee ${formatCurrency(emi.fee, currency)}` : ''}
          </p>
        </div>
        {emi.closedOn ? <Badge color="var(--text-3)">Closed {fmtDate(emi.closedOn)}</Badge>
          : pr.done ? <Badge color="var(--success)"><CheckCircle2 className="w-3 h-3" />Completed</Badge>
            : <Badge>{formatCurrency(pr.monthly, currency)}/mo</Badge>}
      </div>
      <ProgressBar value={(pr.billed / pr.months) * 100} height={6} />
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <div><p style={{ color: 'var(--text-3)' }}>Billed</p><p className="font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{pr.billed}/{pr.months}</p></div>
        <div><p style={{ color: 'var(--text-3)' }}>Left to bill</p><p className="font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(pr.unbilledPrincipal, currency)}</p></div>
        <div><p style={{ color: 'var(--text-3)' }}>{pr.next ? 'Next bill' : 'Ends'}</p><p className="font-bold" style={{ color: 'var(--text-1)' }}>{fmtDate(pr.next?.billDate || pr.endsOn)}</p></div>
      </div>
      {pr.totalInterest > 0 && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--text-3)' }}>Interest over the plan: {formatCurrency(pr.totalInterest, currency)} · total cost {formatCurrency(pr.totalCost, currency)}</p>
      )}
      <div className="mt-3 flex gap-2">
        {!pr.done && (
          <Button size="sm" variant="secondary" onClick={() => {
            if (window.confirm(`Close "${emi.description}" early? The remaining ${formatCurrency(pr.unbilledPrincipal, currency)} is billed on the next statement.`)) closeCardEmi(emi.id)
          }}>Pre-pay / close</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => {
          if (window.confirm('Delete this EMI plan? The purchase stays; its fee and interest entries are removed.')) deleteCardEmi(emi.id)
        }}><Trash2 className="w-3.5 h-3.5" /> Delete</Button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CardPage() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const { currency, accounts, transactions, cardEmis } = useFinance()
  const [sheet, setSheet] = useState(null)

  const card = accounts.find((a) => a.id === id && a.kind === 'credit')
  const emis = useMemo(() => cardEmis.filter((e) => e.cardId === id), [cardEmis, id])
  const byId = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts])
  const ledger = useMemo(
    () => (card ? buildCardLedger(card, transactions, emis, byId) : null),
    [card, transactions, emis, byId]
  )

  if (loading || !user) return null
  if (!card || !ledger) {
    return (
      <EmptyState icon={CreditCard} title="Card not found"
        description="It may have been deleted, or this account isn't a credit card."
        action={<Link href="/dashboard/accounts" className="accent-btn px-4 py-2 text-sm">Back to accounts</Link>} />
    )
  }

  const st = ledger.current
  const today = todayISO()
  const dueIn = st && st.remaining > 0 ? daysBetween(today, st.due) : null
  const activeEmis = emis.filter((e) => !emiProgress(card, e).done)
  const nextEmiTotal = activeEmis.reduce((s, e) => s + (emiProgress(card, e).next?.total || 0), 0)
  const util = ledger.utilization

  return (
    <div className="space-y-5 pb-24">
      <Link href="/dashboard/accounts" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
        <ArrowLeft className="w-4 h-4" /> Accounts
      </Link>

      {/* Hero */}
      <div className="rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 55%, #4b5563 100%)', boxShadow: '0 18px 48px rgba(0,0,0,0.25)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white/80" />
            <span className="text-sm font-bold">{card.name}</span>
          </div>
          <button type="button" onClick={() => setSheet('settings')} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }} aria-label="Card settings">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Total outstanding</p>
        <p className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">{formatCurrency(ledger.owed, currency)}</p>
        {ledger.limit > 0 && (
          <div className="mt-4 max-w-md">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full rounded-full" style={{ width: `${util}%`, background: util >= 90 ? '#fca5a5' : util >= 70 ? '#fcd34d' : '#fff', transition: 'width 0.6s ease' }} />
            </div>
            <p className="mt-1.5 text-xs font-semibold text-white/80 tabular-nums">
              {formatCurrency(Math.max(0, ledger.available), currency)} available of {formatCurrency(ledger.limit, currency)} · {Math.round(util)}% used
            </p>
          </div>
        )}
        <p className="mt-3 text-xs text-white/70">
          Statement on day {card.statementDay} · due {card.dueDay ? `on day ${card.dueDay}` : '20 days after'} · min due {card.minDuePct}%{card.minDueFloor ? ` (at least ${formatCurrency(card.minDueFloor, currency)})` : ''}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSheet('pay')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#fff', color: '#111827' }}>
            <Receipt className="w-4 h-4" /> Pay bill
          </button>
          <button type="button" onClick={() => setSheet('emi')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.14)' }}>
            <Layers className="w-4 h-4" /> EMI
          </button>
          <button type="button" onClick={() => setSheet('charge')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.14)' }}>
            <Plus className="w-4 h-4" /> Fee / interest
          </button>
        </div>
      </div>

      {/* Due tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Statement balance" value={formatCurrency(st?.balance || 0, currency)} hint={st ? `${statementLabel(st.close)} bill` : 'No statement yet'} />
        <Tile label="Minimum due" value={formatCurrency(st?.minRemaining || 0, currency)}
          hint={st ? (st.minRemaining > 0 ? `of ${formatCurrency(st.minDue, currency)}` : 'Covered') : '—'}
          tone={st?.minRemaining > 0 && today > st.due ? 'var(--danger)' : undefined} />
        <Tile label="Due date" value={st ? fmtDate(st.due) : '—'}
          hint={dueIn === null ? (st ? STATUS_LABEL[st.status] : '') : dueIn >= 0 ? `in ${dueIn} day${dueIn === 1 ? '' : 's'}` : `${-dueIn} days overdue`}
          tone={dueIn !== null && dueIn < 0 ? 'var(--danger)' : dueIn !== null && dueIn <= 5 ? 'var(--warning)' : undefined} />
        <Tile label="Next statement" value={formatCurrency(ledger.cycle.spent + nextEmiTotal, currency)}
          hint={`so far · closes ${fmtDate(ledger.cycle.closesOn)}`} />
      </div>

      {/* Current statement */}
      {st && (
        <div className="glass-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>Latest bill — {statementLabel(st.close)}</h2>
            </div>
            <StatusBadge statement={st} />
          </div>
          {st.balance > 0 ? (
            <>
              <ProgressBar value={(st.paid / st.balance) * 100} color={STATUS_STYLE[st.status].color} />
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div><p style={{ color: 'var(--text-3)' }}>Billed</p><p className="font-extrabold tabular-nums text-sm" style={{ color: 'var(--text-1)' }}>{formatCurrency(st.balance, currency)}</p></div>
                <div><p style={{ color: 'var(--text-3)' }}>Paid</p><p className="font-extrabold tabular-nums text-sm" style={{ color: 'var(--text-1)' }}>{formatCurrency(st.paid, currency)}</p></div>
                <div><p style={{ color: 'var(--text-3)' }}>Remaining</p><p className="font-extrabold tabular-nums text-sm" style={{ color: 'var(--text-1)' }}>{formatCurrency(st.remaining, currency)}</p></div>
              </div>
              {st.remaining > 0 && (
                <p className="mt-3 text-xs" style={{ color: 'var(--text-2)' }}>
                  Pay the full {formatCurrency(st.remaining, currency)} by {fmtDate(st.due)} to avoid interest
                  {st.minRemaining > 0 ? <>, or at least {formatCurrency(st.minRemaining, currency)} to avoid a late fee.</> : '.'}
                </p>
              )}
            </>
          ) : <p className="text-sm" style={{ color: 'var(--text-2)' }}>Nothing billed on this statement.</p>}
        </div>
      )}

      {/* EMIs */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>EMI plans</h2>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setSheet('emi')}><Plus className="w-3.5 h-3.5" /> Add</Button>
        </div>
        {emis.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {emis.map((e) => <EmiCard key={e.id} card={card} emi={e} currency={currency} />)}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No EMIs. Convert a big purchase to pay it off over months.</p>
        )}
        {ledger.emiUnbilled > 0 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--text-2)' }}>
            {formatCurrency(ledger.emiUnbilled, currency)} of EMI principal is still to be billed — it counts against your limit but isn&apos;t due yet.
          </p>
        )}
      </div>

      {/* This cycle */}
      <div className="glass-card">
        <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>This cycle</h2>
        <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>
          {fmtDate(ledger.cycle.start)} – {fmtDate(ledger.cycle.closesOn)} · billed {fmtDate(ledger.cycle.closesOn)}, due {fmtDate(ledger.cycle.dueOn)}
        </p>
        {ledger.cycle.spends.length ? ledger.cycle.spends.map((t) => <TxLine key={t.id} t={t} currency={currency} />)
          : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No spending since the last statement.</p>}
      </div>

      {/* Statements */}
      <div className="glass-card">
        <h2 className="text-base font-extrabold mb-3" style={{ color: 'var(--text-1)' }}>Statements</h2>
        {ledger.statements.length ? (
          <div className="space-y-2">
            {ledger.statements.map((s, i) => <StatementRow key={s.close} s={s} currency={currency} defaultOpen={i === 0} />)}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>First statement on {fmtDate(ledger.cycle.closesOn, true)}.</p>
        )}
      </div>

      {/* Payments */}
      <div className="glass-card">
        <h2 className="text-base font-extrabold mb-1" style={{ color: 'var(--text-1)' }}>Payments</h2>
        {ledger.payments.length ? ledger.payments.map((p) => (
          <TxLine key={p.id} currency={currency} t={{ ...p, description: `From ${p.fromName}`, category: KIND_LABEL[p.paymentKind] || 'Payment' }} />
        )) : <p className="text-sm" style={{ color: 'var(--text-3)' }}>No payments yet.</p>}
      </div>

      {sheet === 'pay' && <PaySheet open onClose={() => setSheet(null)} card={card} ledger={ledger} currency={currency} />}
      {sheet === 'emi' && <EmiSheet open onClose={() => setSheet(null)} card={card} currency={currency} />}
      {sheet === 'charge' && <ChargeSheet open onClose={() => setSheet(null)} card={card} />}
      {sheet === 'settings' && <SettingsSheet open onClose={() => setSheet(null)} card={card} />}
    </div>
  )
}
