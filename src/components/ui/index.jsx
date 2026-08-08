'use client'

/**
 * Shared UI primitives.
 *
 * Everything here reads from the CSS variables in globals.css, so a component
 * built out of these is correct in both themes by construction. Prefer these
 * over raw Tailwind colour classes — `bg-white` / `text-gray-900` are hardcoded
 * light-mode values and were the source of every dark-mode bug in the app.
 */

import { forwardRef, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// ── Card ───────────────────────────────────────────────────────────────────

export function Card({ as: Tag = 'div', className = '', padded = true, hover = false, style, ...rest }) {
  return (
    <Tag
      className={`${hover ? 'glass-card' : ''} ${className}`}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
        borderRadius: 'var(--radius)',
        ...(padded ? { padding: '1.25rem' } : null),
        ...style,
      }}
      {...rest}
    />
  )
}

// ── Button ─────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = {
  primary: { className: 'accent-btn', style: {} },
  secondary: {
    className: '',
    style: {
      background: 'var(--input-bg)',
      border: '1px solid var(--card-border)',
      color: 'var(--text-1)',
    },
  },
  ghost: { className: '', style: { background: 'transparent', color: 'var(--text-2)' } },
  danger: {
    className: '',
    style: {
      background: 'rgba(var(--danger-rgb),0.12)',
      border: '1px solid rgba(var(--danger-rgb),0.25)',
      color: 'var(--danger)',
    },
  },
}

const BUTTON_SIZES = {
  sm: { minHeight: 36, padding: '0 0.75rem', fontSize: 13 },
  md: { minHeight: 44, padding: '0 1rem', fontSize: 14 },
  lg: { minHeight: 50, padding: '0 1.5rem', fontSize: 15 },
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', full = false, className = '', style, type = 'button', ...rest },
  ref
) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${v.className} ${className}`}
      style={{ ...BUTTON_SIZES[size], ...v.style, width: full ? '100%' : undefined, ...style }}
      {...rest}
    />
  )
})

// ── Page header ────────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, icon: Icon, actions, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1
            className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: 'var(--text-1)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center" style={{ padding: '3rem 1.5rem' }}>
      {Icon && (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-3xl"
          style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)' }}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-1)' }}>
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────

export function Skeleton({ height = 16, width = '100%', radius = 8, className = '' }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ height, width, borderRadius: radius, background: 'var(--input-bg)' }}
    />
  )
}

export function CardSkeleton({ lines = 3, height = 140 }) {
  return (
    <Card className="flex flex-col gap-3" style={{ minHeight: height }}>
      <Skeleton height={18} width="45%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={`${90 - i * 12}%`} />
      ))}
    </Card>
  )
}

// ── Form field ─────────────────────────────────────────────────────────────

// 16px minimum — anything smaller makes iOS Safari zoom the viewport on focus
const CONTROL = {
  width: '100%',
  minHeight: 46,
  padding: '0 12px',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 500,
  border: '1px solid var(--card-border)',
  background: 'var(--input-bg)',
  color: 'var(--text-1)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  appearance: 'none',
  WebkitAppearance: 'none',
  display: 'block',
}

export const controlStyle = CONTROL

export function Label({ children, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ color: 'var(--text-3)' }}
    >
      {children}
    </label>
  )
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input({ style, ...rest }, ref) {
  return <input ref={ref} style={{ ...CONTROL, ...style }} {...rest} />
})

export const Select = forwardRef(function Select({ style, children, ...rest }, ref) {
  return (
    <select ref={ref} style={{ ...CONTROL, ...style }} {...rest}>
      {children}
    </select>
  )
})

export const Textarea = forwardRef(function Textarea({ style, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      style={{ ...CONTROL, minHeight: 88, padding: '10px 12px', resize: 'vertical', ...style }}
      {...rest}
    />
  )
})

// ── Segmented control ──────────────────────────────────────────────────────

export function SegmentedControl({ options, value, onChange, size = 'md' }) {
  const pad = size === 'sm' ? '0.35rem 0.6rem' : '0.5rem 0.85rem'
  return (
    <div
      role="tablist"
      className="inline-flex gap-1 rounded-2xl p-1"
      style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
            style={{
              padding: pad,
              background: active ? 'var(--card-bg)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-2)',
              boxShadow: active ? 'var(--card-shadow)' : 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Progress ───────────────────────────────────────────────────────────────

export function ProgressBar({ value = 0, color = 'var(--accent)', height = 8 }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className="w-full overflow-hidden"
      style={{ height, borderRadius: 999, background: 'rgba(var(--accent-rgb),0.12)' }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 999,
          background: color,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </div>
  )
}

export function ProgressRing({ value = 0, size = 64, stroke = 6, color = 'var(--accent)', label, sublabel }) {
  const pct = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(var(--accent-rgb),0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>
          {label ?? `${pct}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Stat tile ──────────────────────────────────────────────────────────────

export function StatTile({ label, value, hint, icon: Icon, tone = 'neutral' }) {
  const toneColor =
    tone === 'positive' ? 'var(--success)' : tone === 'negative' ? 'var(--danger)' : 'var(--text-1)'
  return (
    <Card className="flex flex-col gap-1" style={{ padding: '1rem' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4" style={{ color: 'var(--text-3)' }} />}
      </div>
      <span className="text-xl font-extrabold tabular-nums tracking-tight" style={{ color: toneColor }}>
        {value}
      </span>
      {hint && (
        <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
          {hint}
        </span>
      )}
    </Card>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────

export function Badge({ children, color = 'var(--accent)', bg }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ color, background: bg || `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {children}
    </span>
  )
}

// ── Sheet / modal ──────────────────────────────────────────────────────────

/**
 * Bottom sheet on mobile, centred dialog on desktop. Handles Escape, focus
 * return, scroll lock and a labelled dialog role — the hand-rolled sheets
 * scattered through the app did none of that.
 */
export function Sheet({ open, onClose, title, children, footer, maxWidth = 520 }) {
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    restoreFocusRef.current = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the panel so screen readers and keyboards follow it
    const t = setTimeout(() => panelRef.current?.focus(), 30)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="scroll-touch relative w-full overflow-y-auto outline-none"
        style={{
          maxWidth,
          maxHeight: '90dvh',
          background: 'var(--surface)',
          border: '1px solid var(--card-border)',
          borderBottom: 'none',
          borderRadius: '22px 22px 0 0',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.24)',
          padding: '12px 20px max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full sm:hidden"
          style={{ background: 'var(--card-border)' }}
          aria-hidden
        />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
