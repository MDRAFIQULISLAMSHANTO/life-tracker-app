import currencyCodes from 'currency-codes'

/** Sorted list for dropdowns: { code, label } */
export const CURRENCY_OPTIONS = currencyCodes.data
  .map((c) => ({
    code: c.code,
    label: `${c.code} — ${c.currency}`,
  }))
  .sort((a, b) => a.code.localeCompare(b.code))

const VALID = new Set(currencyCodes.codes())

export function isValidCurrencyCode(code) {
  if (!code || typeof code !== 'string') return false
  return VALID.has(code.toUpperCase())
}
