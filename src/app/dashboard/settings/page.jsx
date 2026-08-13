'use client'

import { useState, useMemo, useEffect } from 'react'
import { User, Wallet, RotateCcw, CalendarRange, Settings2, Smartphone, Download, CheckCircle2, CreditCard, Bell, LogOut, Palette, Database, FlaskConical, AlertTriangle, FileJson, FileSpreadsheet, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useFinance } from '../../../context/FinanceContext'
import { useDashboardToday } from '../../../context/DashboardTodayContext'
import { useGrowth } from '../../../context/GrowthContext'
import { downloadAccountExport, downloadTransactionsCsv } from '../../../lib/exportData'
import CategoryManager from '../../../components/finance/CategoryManager'
import { LEATHER_THEMES } from '../../../components/dashboard/WalletCard'
import AccountManager from '../../../components/finance/AccountManager'
import NotificationSettings from '../../../components/settings/NotificationSettings'
import { CURRENCY_OPTIONS } from '../../../utils/currencyOptions'

const MONTHS = [
  { v: 1, label: 'January' }, { v: 2, label: 'February' }, { v: 3, label: 'March' },
  { v: 4, label: 'April' }, { v: 5, label: 'May' }, { v: 6, label: 'June' },
  { v: 7, label: 'July' }, { v: 8, label: 'August' }, { v: 9, label: 'September' },
  { v: 10, label: 'October' }, { v: 11, label: 'November' }, { v: 12, label: 'December' },
]

function InstallAppSection() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installState, setInstallState] = useState('idle') // 'idle' | 'success'
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches)

  useEffect(() => {
    if (isStandalone) { setIsInstalled(true); return }
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setInstallPrompt(null) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setInstallState('success'); setInstallPrompt(null) }
  }

  return (
    <section className="p-5 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
          <Smartphone className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Install App</h2>
      </div>

      {isInstalled || installState === 'success' ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#22c55e' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>App installed!</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Livio is running as a native app on your device.</p>
          </div>
        </div>
      ) : installPrompt ? (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
            Install Livio on your device for a faster, app-like experience — no browser UI, works offline.
          </p>
          <button
            onClick={handleInstall}
            className="accent-btn flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            Install on this device
          </button>
        </div>
      ) : isIOS ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            On iPhone/iPad, use Safari to install:
          </p>
          <ol className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
            <li className="flex items-start gap-2"><span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>1</span>Open this page in Safari</li>
            <li className="flex items-start gap-2"><span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>2</span>Tap the Share button (box with arrow)</li>
            <li className="flex items-start gap-2"><span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)' }}>3</span>Tap "Add to Home Screen"</li>
          </ol>
        </div>
      ) : (
        <div className="p-4 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Open Livio in Chrome or Edge on your phone or desktop to get the install option.
          </p>
        </div>
      )}
    </section>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const handle = async () => {
    setPending(true)
    const { error } = await logout()
    if (!error) router.replace('/login')
    else setPending(false)
  }
  return (
    <button
      onClick={handle}
      disabled={pending}
      className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all disabled:opacity-50 hover:opacity-80"
      style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger, #dc2626)', border: '1px solid rgba(220,38,38,0.2)' }}
    >
      <LogOut className="w-4 h-4" />
      {pending ? 'Logging out…' : 'Log out'}
    </button>
  )
}

export default function SettingsPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const { currency, setCurrency, accounts, addAccount, renameAccount, deleteAccount, updateAccountBalance, expenseCategories, incomeCategories, otherCategories, addCategory, removeCategory, resetFinanceDataForMonth, resetAllFinanceToEmpty, loadDemoData } = useFinance()
  const { resetDashboardForMonth, loadDemoAgenda, events, tasks, notes } = useDashboardToday()
  // Full context objects, for the "download everything" export.
  const growth = useGrowth()
  const finance = useFinance()

  const [walletTheme, setWalletTheme] = useState(3)
  const [msg, setMsg] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetYear, setResetYear] = useState(new Date().getFullYear())
  const [resetMonth, setResetMonth] = useState(new Date().getMonth() + 1)
  const [confirmText, setConfirmText] = useState('')
  const [dbResetOpen, setDbResetOpen] = useState(false)
  const [dbResetConfirm, setDbResetConfirm] = useState('')
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false)

  const optionsForSelect = useMemo(() => {
    const q = currencyFilter.trim().toLowerCase()
    const current = CURRENCY_OPTIONS.find((c) => c.code === currency)
    const base = q ? CURRENCY_OPTIONS.filter((c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)) : CURRENCY_OPTIONS
    if (base.length === 0) return current ? [current] : []
    if (q && current && !base.some((c) => c.code === current.code)) return [current, ...base]
    return base
  }, [currencyFilter, currency])

  useEffect(() => {
    const saved = localStorage.getItem('livio_wallet_theme')
    if (saved !== null) setWalletTheme(Number(saved))
  }, [])

  const handleWalletTheme = (idx) => {
    setWalletTheme(idx)
    localStorage.setItem('livio_wallet_theme', String(idx))
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i)

  const runReset = () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      setMsg('Type RESET to confirm.')
      setTimeout(() => setMsg(''), 3000)
      return
    }
    resetFinanceDataForMonth(resetYear, resetMonth)
    resetDashboardForMonth(resetYear, resetMonth)
    setConfirmText('')
    setResetOpen(false)
    setMsg(`Data for ${resetYear}-${String(resetMonth).padStart(2, '0')} cleared.`)
    setTimeout(() => setMsg(''), 4000)
  }

  const sectionClass = 'p-5 sm:p-8'
  const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all'
  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-1)' }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
          <Settings2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Settings</h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-2)' }}>Profile, currency, install app, and more.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden divide-y" style={{ padding: 0, borderRadius: '1.75rem', divideColor: 'var(--card-border)' }}>
        {/* Install App */}
        <InstallAppSection />

        {/* Notifications */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <Bell className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Notifications</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Reminder alerts for today's tasks</p>
            </div>
          </div>
          <NotificationSettings />
        </section>

        {/* Profile */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <User className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Profile</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Signed in as</p>
          <p className="mt-1 font-bold break-all text-sm sm:text-base" style={{ color: 'var(--text-1)' }}>{user.email || user.uid}</p>
        </section>

        {/* Finance */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <Wallet className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Finance</h2>
          </div>

          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-1)' }}>Currency (ISO 4217)</label>
          <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>All amounts use this currency.</p>
          <input
            type="search"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            placeholder="Filter by code or name…"
            className={`${inputClass} mb-3`}
            style={inputStyle}
            autoComplete="off"
          />
          <select
            value={currency}
            onChange={(e) => {
              const res = setCurrency(e.target.value)
              if (!res.ok) setMsg(res.error || 'Invalid currency')
              else setMsg('')
            }}
            className={`${inputClass} min-h-[48px]`}
            style={inputStyle}
          >
            {optionsForSelect.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          {msg && <div className="text-sm font-bold mt-4" style={{ color: '#22c55e' }}>{msg}</div>}

          <div className="mt-8 p-5 rounded-2xl" style={{ background: 'rgba(var(--danger,239,68,68),0.06)', border: '1px solid rgba(var(--danger,239,68,68),0.15)' }}>
            <div className="flex items-start gap-3 mb-4">
              <CalendarRange className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--danger, #ef4444)' }} />
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>Reset data for a month</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                  Removes transactions, loans, budgets, events, tasks, and notes for the chosen month.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setResetOpen(true); setConfirmText('') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm min-h-[44px] transition-colors"
              style={{ border: '1px solid var(--danger, #ef4444)', color: 'var(--danger, #ef4444)' }}
            >
              <RotateCcw className="w-4 h-4" />
              Reset month data…
            </button>
          </div>
        </section>

        {/* Accounts */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <CreditCard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Accounts</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Add custom accounts like bKash, City Bank, Cash, etc.</p>
            </div>
          </div>
          <AccountManager
            accounts={accounts}
            onAdd={addAccount}
            onRename={renameAccount}
            onDelete={deleteAccount}
            onUpdateBalance={updateAccountBalance}
          />
        </section>

        {/* Categories */}
        <section className={`${sectionClass} space-y-6`} style={{ borderTop: '1px solid var(--card-border)' }}>
          <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Categories</h2>
          <div className="grid grid-cols-1 gap-6">
            <CategoryManager title="Expense categories" categories={expenseCategories} onAdd={(n) => addCategory('expense', n)} onRemove={(n) => removeCategory('expense', n)} />
            <CategoryManager title="Income categories" categories={incomeCategories} onAdd={(n) => addCategory('income', n)} onRemove={(n) => removeCategory('income', n)} />
            <CategoryManager title="Other categories" categories={otherCategories} onAdd={(n) => addCategory('other', n)} onRemove={(n) => removeCategory('other', n)} />
          </div>
        </section>

        {/* Wallet Cover — leather theme picker */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <Palette className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Wallet Cover</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Choose your leather wallet colour</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {LEATHER_THEMES.map((t, i) => (
              <div key={t.id} style={{ flexShrink: 0, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleWalletTheme(i)}
                  style={{
                    display: 'block',
                    width: 64, height: 46, borderRadius: 12, cursor: 'pointer',
                    background: t.swatch,
                    border: i === walletTheme ? '2.5px solid var(--accent)' : '2px solid transparent',
                    outline: i === walletTheme ? '2px solid rgba(var(--accent-rgb),0.25)' : 'none',
                    outlineOffset: 2,
                    position: 'relative', overflow: 'hidden',
                    transition: 'transform 0.15s',
                    boxShadow: i === walletTheme ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Mini stitch */}
                  <div style={{ position: 'absolute', inset: 4, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.30)', pointerEvents: 'none' }} />
                </button>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Your data — export before you leave, and leaving properly */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <Download className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Your data</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Take a copy with you, or close the account for good</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                downloadAccountExport({
                  user,
                  finance,
                  agenda: { events, tasks, notes },
                  growth,
                })
                setMsg('Export downloaded.')
                setTimeout(() => setMsg(''), 4000)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-80"
              style={{ background: 'var(--input-bg)', color: 'var(--text-1)', border: '1px solid var(--card-border)' }}
            >
              <FileJson className="w-4 h-4" />
              Download everything (JSON)
            </button>
            <button
              type="button"
              onClick={() => {
                const res = downloadTransactionsCsv({ transactions: finance.transactions, currency })
                setMsg(`Exported ${res.count} transaction(s).`)
                setTimeout(() => setMsg(''), 4000)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-80"
              style={{ background: 'var(--input-bg)', color: 'var(--text-1)', border: '1px solid var(--card-border)' }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Transactions (CSV)
            </button>
          </div>

          <div className="pt-5" style={{ borderTop: '1px solid var(--card-border)' }}>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-1)' }}>Delete this account</p>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Removes your money, tasks, notes and growth data from the server, then deletes your
              sign-in. This cannot be undone — download a copy first if you might want it.
            </p>
            <button
              type="button"
              onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); setDeleteError('') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-80"
              style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger, #dc2626)', border: '1px solid rgba(220,38,38,0.20)' }}
            >
              <Trash2 className="w-4 h-4" />
              Delete account
            </button>
          </div>
        </section>

        {/* Database */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <Database className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Database</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Reset all data or load sample demo entries</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => { setDemoConfirmOpen(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-80"
              style={{ background: 'rgba(var(--accent-rgb),0.10)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.22)' }}
            >
              <FlaskConical className="w-4 h-4" />
              Load demo data
            </button>
            <button
              type="button"
              onClick={() => { setDbResetOpen(true); setDbResetConfirm('') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-80"
              style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger, #dc2626)', border: '1px solid rgba(220,38,38,0.20)' }}
            >
              <AlertTriangle className="w-4 h-4" />
              Reset entire database
            </button>
          </div>
        </section>

        {/* Logout — always at the very end */}
        <section className={sectionClass} style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
              <LogOut className="w-5 h-5" style={{ color: '#dc2626' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>Sign out</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>You are signed in as {user.email || user.uid}</p>
            </div>
          </div>
          <LogoutButton />
        </section>
      </div>

      {/* Delete account Modal — typed confirmation, because it is irreversible */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={() => !deleting && setDeleteOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
            <h3 className="text-lg font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>Delete your account</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-2)' }}>
              This permanently removes every transaction, task, note, habit and goal on this
              account, then deletes your sign-in. It cannot be undone.
            </p>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
              Type <span style={{ color: 'var(--danger, #dc2626)' }}>DELETE</span> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="glass-input mb-3"
              placeholder="DELETE"
              autoComplete="off"
              disabled={deleting}
            />
            {deleteError && (
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--danger, #dc2626)' }}>{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[44px]"
                style={{ border: '1px solid var(--card-border)', color: 'var(--text-1)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirm !== 'DELETE'}
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError('')
                  try {
                    const token = await user.getIdToken()
                    const res = await fetch('/api/account', {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    const body = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(body?.error || 'Deletion failed.')
                    // Local caches are namespaced per uid; clear this account's
                    // so nothing lingers on a shared browser.
                    try {
                      Object.keys(localStorage)
                        .filter((k) => k.includes(`::${user.uid}`))
                        .forEach((k) => localStorage.removeItem(k))
                    } catch {
                      // non-fatal — the server copy is already gone
                    }
                    await logout()
                    router.replace('/')
                  } catch (err) {
                    setDeleteError(err.message || 'Could not delete the account.')
                    setDeleting(false)
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-50"
                style={{ background: 'var(--danger, #dc2626)', color: '#fff' }}
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset month Modal */}
      {resetOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={() => setResetOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
            <h3 className="text-lg font-extrabold mb-2" style={{ color: 'var(--text-1)' }}>Reset month data</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Choose the calendar month to wipe. This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>Year</label>
                <select value={resetYear} onChange={(e) => setResetYear(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl min-h-[44px] text-sm" style={inputStyle}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>Month</label>
                <select value={resetMonth} onChange={(e) => setResetMonth(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl min-h-[44px] text-sm" style={inputStyle}>
                  {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>Type <span className="font-mono" style={{ color: 'var(--danger, #ef4444)' }}>RESET</span> to confirm</label>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="w-full px-3 py-2 rounded-xl mb-4 min-h-[44px] text-sm" style={inputStyle} placeholder="RESET" autoComplete="off" />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" onClick={() => setResetOpen(false)} className="px-4 py-2.5 rounded-xl font-bold text-sm min-h-[44px] transition-colors" style={{ border: '1px solid var(--card-border)', color: 'var(--text-1)' }}>Cancel</button>
              <button type="button" onClick={runReset} className="accent-btn px-4 py-2.5 text-sm min-h-[44px]">Erase data</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset entire database modal */}
      {dbResetOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={() => setDbResetOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(220,38,38,0.1)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-1)' }}>Reset entire database</h3>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
              This will permanently delete <strong>all</strong> your accounts, transactions, loans, budgets, and settings. This action cannot be undone.
            </p>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
              Type <span className="font-mono px-1 py-0.5 rounded" style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)' }}>RESET ALL</span> to confirm
            </label>
            <input
              value={dbResetConfirm}
              onChange={(e) => setDbResetConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl mb-5 min-h-[44px] text-sm"
              style={inputStyle}
              placeholder="RESET ALL"
              autoComplete="off"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" onClick={() => setDbResetOpen(false)} className="px-4 py-2.5 rounded-xl font-bold text-sm min-h-[44px]" style={{ border: '1px solid var(--card-border)', color: 'var(--text-1)' }}>Cancel</button>
              <button
                type="button"
                disabled={dbResetConfirm.trim().toUpperCase() !== 'RESET ALL'}
                onClick={() => {
                  resetAllFinanceToEmpty()
                  setDbResetOpen(false)
                  setDbResetConfirm('')
                  setMsg('Database reset. All data cleared.')
                  setTimeout(() => setMsg(''), 4000)
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm min-h-[44px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                Erase everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load demo data confirmation modal */}
      {demoConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" onClick={() => setDemoConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
                <FlaskConical className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-1)' }}>Load demo data</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
              This will add sample accounts, transactions, and loans to your database so you can explore all features. Your existing data will be merged — nothing is deleted.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" onClick={() => setDemoConfirmOpen(false)} className="px-4 py-2.5 rounded-xl font-bold text-sm min-h-[44px]" style={{ border: '1px solid var(--card-border)', color: 'var(--text-1)' }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  loadDemoData()
                  loadDemoAgenda()
                  setDemoConfirmOpen(false)
                  setMsg('Demo data loaded successfully.')
                  setTimeout(() => setMsg(''), 4000)
                }}
                className="accent-btn px-4 py-2.5 text-sm min-h-[44px]"
              >
                Load demo data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
