/**
 * Utility functions for formatting data
 * UI-agnostic formatters that can be reused in React Native
 */

/** When Intl returns the ISO code instead of a glyph (common for BDT in en-US), use this map. */
const CURRENCY_SYMBOL_FALLBACK = {
  AED: 'د.إ',
  BDT: '৳',
  BHD: '.د.ب',
  BTC: '₿',
  CHF: 'CHF',
  CNY: '¥',
  EGP: 'E£',
  ETB: 'Br',
  GBP: '£',
  GHS: '₵',
  HKD: 'HK$',
  IDR: 'Rp',
  ILS: '₪',
  INR: '₹',
  JPY: '¥',
  KRW: '₩',
  KWD: 'د.ك',
  LKR: 'Rs',
  MAD: 'د.م.',
  MXN: 'MX$',
  MYR: 'RM',
  NGN: '₦',
  NPR: 'रू',
  OMR: 'ر.ع.',
  PHP: '₱',
  PKR: '₨',
  PLN: 'zł',
  QAR: 'ر.ق',
  SAR: '﷼',
  SGD: 'S$',
  THB: '฿',
  TRY: '₺',
  TWD: 'NT$',
  USD: '$',
  VND: '₫',
  ZAR: 'R',
}

/**
 * Short display string for the current currency (symbol when possible, else code).
 */
export function getCurrencySymbol(currencyCode) {
  const code = String(currencyCode || 'USD').toUpperCase()
  for (const display of ['narrowSymbol', 'symbol']) {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        currencyDisplay: display,
      }).formatToParts(0)
      const cur = parts.find((p) => p.type === 'currency')
      if (cur?.value && cur.value !== code) return cur.value
    } catch {
      /* continue */
    }
  }
  return CURRENCY_SYMBOL_FALLBACK[code] || code
}

function formatCurrencyParts(code, num) {
  const intlOpts = {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }
  for (const display of ['narrowSymbol', 'symbol']) {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        ...intlOpts,
        currencyDisplay: display,
      }).formatToParts(num)
      const cur = parts.find((p) => p.type === 'currency')
      if (cur?.value && cur.value !== code) return parts.map((p) => p.value).join('')
    } catch {
      /* try next */
    }
  }
  const sym = CURRENCY_SYMBOL_FALLBACK[code] || code
  const rest = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
  return `${sym}${rest}`
}

export const formatCurrency = (amount, currency = 'BDT') => {
  const num = Number(amount) || 0
  const code = String(currency || 'USD').toUpperCase()
  try {
    return formatCurrencyParts(code, num)
  } catch {
    const sym = CURRENCY_SYMBOL_FALLBACK[code] || code
    return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }
}

export const formatCurrencyCompact = (amount, currency = 'BDT') => {
  const num = Number(amount) || 0
  const code = String(currency || 'USD').toUpperCase()
  const sym = getCurrencySymbol(code)
  if (Math.abs(num) >= 1000) {
    const compact = new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num)
    return `${sym}${compact}`
  }
  return formatCurrency(num, code)
}

export const formatDate = (date, format = 'short') => {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  
  return d.toLocaleDateString()
}

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

export const formatRelativeTime = (date) => {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(date, 'short')
}

export const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}