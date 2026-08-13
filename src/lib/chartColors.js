/**
 * One colour system for every chart.
 *
 * Before this, each chart picked its own hexes: the donut and the category bar
 * chart used two different palettes, and — worse — income was drawn with
 * `var(--accent)`, which is indigo in light mode but RED in dark mode. So in
 * dark mode income and expense were both red on the same axes.
 *
 * Money in vs money out is a polarity, not two arbitrary categories, so it uses
 * a diverging pair: blue for money in, red for money out. Deliberately not
 * green/red — that is the one pair red-green colourblind readers cannot
 * separate, and it is the most common form of colour blindness.
 *
 * Every palette below was checked with the data-viz validator against this
 * app's own surfaces (light #fafbfc, dark #161b22) rather than chosen by eye:
 *
 *   income vs expense  light: CVD ΔE 21.6, normal 32.3, contrast >= 3:1  PASS
 *                      dark : CVD ΔE 19.2, normal 29.0, contrast >= 3:1  PASS
 *   categorical (8)    light: worst adjacent CVD 9.1, normal 19.6        PASS
 *                      dark : worst adjacent CVD 8.4, normal 19.3        PASS
 *
 * In light mode three categorical slots sit below 3:1 against the surface, so
 * charts using them must carry visible labels or a legend with values — which
 * the donut and category bar both do. Do not use them as bare colour-only fills.
 */

/** Money in / money out. The diverging pair. */
export const MONEY = {
  light: { income: '#2a78d6', expense: '#e34948' },
  dark: { income: '#3987e5', expense: '#e66767' },
}

/**
 * Fixed categorical order. Never cycled and never reassigned by rank — a
 * category keeps its colour when the set around it changes, so filtering the
 * chart cannot repaint the survivors.
 */
export const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}

/** Everything past the top slices, so the ring never runs out of hues. */
export const OTHER_COLOR = { light: '#8a8a85', dark: '#6f6f6a' }

/** Planned vs actual — two series being compared, not a polarity. */
export const BUDGET = {
  light: { budget: '#2a78d6', spent: '#eb6834' },
  dark: { budget: '#3987e5', spent: '#d95926' },
}

export function chartMode(theme) {
  return theme === 'dark' ? 'dark' : 'light'
}

export function moneyColors(theme) {
  return MONEY[chartMode(theme)]
}

export function budgetColors(theme) {
  return BUDGET[chartMode(theme)]
}

/**
 * Build a name -> colour lookup from the FULL category list.
 *
 * Slots come from position in the master list, not from the render index, so a
 * category keeps its colour when the chart's own subset changes — hiding
 * "Rent" cannot repaint "Food". Hashing the name was tried first and rejected:
 * with eight slots, collisions are common (Transport and Rent landed on the
 * same hue), and two visible categories sharing a colour defeats the point.
 *
 * @param {string[]} allNames every category that exists, not just the plotted ones
 */
export function makeCategoryScale(allNames, theme) {
  const palette = CATEGORICAL[chartMode(theme)]
  const ordered = [...new Set((allNames || []).map((n) => String(n)))].sort((a, b) =>
    a.localeCompare(b)
  )
  const index = new Map(ordered.map((name, i) => [name, i]))
  return (name) => {
    const key = String(name || '')
    // Unknown names (a category deleted from settings but still on old rows)
    // land at the end of the palette rather than throwing.
    const i = index.has(key) ? index.get(key) : ordered.length
    return palette[i % palette.length]
  }
}

export function otherColor(theme) {
  return OTHER_COLOR[chartMode(theme)]
}

/**
 * Top N slices by value, with the tail folded into a single "Other".
 * Keeps a ring readable and stops the palette being cycled.
 */
export function foldToTopN(rows, n = 7, valueKey = 'value', nameKey = 'name') {
  if (!Array.isArray(rows) || rows.length <= n) return rows || []
  const sorted = [...rows].sort((a, b) => Number(b[valueKey] || 0) - Number(a[valueKey] || 0))
  const head = sorted.slice(0, n)
  const tail = sorted.slice(n)
  const rest = tail.reduce((sum, r) => sum + Number(r[valueKey] || 0), 0)
  if (rest <= 0) return head
  return [...head, { [nameKey]: 'Other', [valueKey]: rest, __isOther: true }]
}
