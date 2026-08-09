/**
 * Shared (not per-user) content lives outside `users/{uid}` so one copy can be
 * read live by everybody:
 *
 *   content/quotes/daily/{YYYY-MM-DD}  — the daily morning quote
 *   content/library/pages/{slug}       — study / reference pages
 *
 * Only the server writes here (Admin SDK); clients read and subscribe. Both
 * sides import these constants so a path or date key can never drift apart.
 */

export const QUOTES_COLLECTION = ['content', 'quotes', 'daily']
export const LIBRARY_COLLECTION = ['content', 'library', 'pages']

/**
 * The app's editorial timezone. A UTC date key would roll the "morning" quote
 * over in the middle of the local afternoon, so the day boundary is pinned
 * here rather than taken from whatever device is asking.
 */
export const APP_TZ = 'Asia/Dhaka'

/** Today (or a given Date) as YYYY-MM-DD in APP_TZ. */
export function appDateKey(date = new Date()) {
  // en-CA formats as YYYY-MM-DD, which is exactly the key shape we want.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Slugs are document ids, so keep them to a safe, stable character set. */
export function normalizeSlug(raw) {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
