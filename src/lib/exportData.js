/**
 * "Download everything I have here."
 *
 * The Excel report in Reports covers one month of transactions; this is the
 * whole account — money, agenda and growth — in a format that can be read
 * without Livio and re-imported by hand if needed.
 */

function stamp() {
  return new Date().toISOString().slice(0, 10)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * @param {object} parts
 * @param {{ email?: string, uid?: string }} parts.user
 * @param {object} parts.finance  full finance state
 * @param {object} parts.agenda   { events, tasks, notes }
 * @param {object} parts.growth   full growth state
 */
export function downloadAccountExport({ user, finance, agenda, growth }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    // Bumped only if the shape changes in a way an importer would care about.
    formatVersion: 1,
    account: { email: user?.email || null, uid: user?.uid || null },
    finance,
    agenda,
    growth,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `livio-export-${stamp()}.json`)
  return { ok: true }
}

/** Transactions as CSV — the part people actually want in a spreadsheet. */
export function downloadTransactionsCsv({ transactions = [], currency = '' }) {
  const header = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Account']
  const escape = (v) => {
    const s = String(v ?? '')
    // Quote anything containing a comma, quote or newline; double inner quotes.
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = [...transactions]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((t) =>
      [t.date, t.type, t.amount, currency, t.category, t.description, t.accountId]
        .map(escape)
        .join(',')
    )
  const csv = [header.join(','), ...rows].join('\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `livio-transactions-${stamp()}.csv`)
  return { ok: true, count: rows.length }
}
