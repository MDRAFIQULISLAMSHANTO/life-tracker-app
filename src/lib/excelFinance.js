import * as XLSX from 'xlsx'

/** Template / export column order (row 1 headers) */
export const TEMPLATE_HEADERS = [
  'Date',
  'Type',
  'Amount',
  'Category',
  'Description',
  'AccountId',
  'SourceLoanId',
]

const HEADER_ALIASES = {
  date: 'Date',
  type: 'Type',
  amount: 'Amount',
  category: 'Category',
  description: 'Description',
  accountid: 'AccountId',
  'account id': 'AccountId',
  account_id: 'AccountId',
  sourceloanid: 'SourceLoanId',
  'source loan id': 'SourceLoanId',
  source_loan_id: 'SourceLoanId',
}

function normalizeHeader(h) {
  if (h == null) return ''
  const k = String(h).trim().toLowerCase().replace(/\s+/g, '')
  return HEADER_ALIASES[k] || String(h).trim()
}

function cellToDateString(cell) {
  if (cell == null || cell === '') return ''
  if (cell instanceof Date && !isNaN(cell.getTime())) {
    return cell.toISOString().slice(0, 10)
  }
  if (typeof cell === 'number' && cell > 1 && cell < 1000000) {
    const ms = Math.round((cell - 25569) * 86400 * 1000)
    const dt = new Date(ms)
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  }
  const s = String(cell).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return s
}

function sanitizeType(v) {
  const t = String(v || '').toLowerCase().trim()
  if (t === 'income' || t === 'expense' || t === 'loan') return t
  if (t === 'exp') return 'expense'
  if (t === 'inc') return 'income'
  return ''
}

/**
 * Build .xlsx for a single calendar month: Transactions + Summary + _Instructions
 */
export function downloadMonthExcelReport({ monthKey, transactions, currency, summaryLines }) {
  const filtered = (transactions || []).filter((t) => t?.date && String(t.date).slice(0, 7) === monthKey)

  const txRows = filtered.map((t) => ({
    Date: t.date,
    Type: t.type,
    Amount: Number(t.amount) || 0,
    Category: t.category || '',
    Description: t.description || '',
    AccountId: t.accountId || '',
    SourceLoanId: t.sourceLoanId || '',
  }))

  const wsTx = XLSX.utils.aoa_to_sheet(
    txRows.length
      ? [TEMPLATE_HEADERS, ...txRows.map((r) => TEMPLATE_HEADERS.map((h) => r[h]))]
      : [TEMPLATE_HEADERS]
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions')

  if (summaryLines?.length) {
    const wsSum = XLSX.utils.aoa_to_sheet(summaryLines)
    XLSX.utils.book_append_sheet(wb, wsSum, 'Summary')
  }

  const instr = [
    ['Import instructions', ''],
    ['Use the Transactions sheet with these exact headers on row 1:', ''],
    ...TEMPLATE_HEADERS.map((h) => [h, '']),
    ['', ''],
    ['Type must be:', 'income | expense | loan'],
    ['Date format:', 'YYYY-MM-DD (or Excel date cell)'],
    ['SourceLoanId:', 'leave empty for normal rows; only for linked loan ledger rows'],
    ['', ''],
    ['App currency at export:', currency],
    ['', ''],
    ['To import:', 'Reports → Import Excel → same template'],
  ]
  const wsIn = XLSX.utils.aoa_to_sheet(instr)
  XLSX.utils.book_append_sheet(wb, wsIn, '_Instructions')

  XLSX.writeFile(wb, `livio-report-${monthKey}.xlsx`)
}

/** Blank template with example rows + instructions */
export function downloadImportTemplate() {
  const examples = [
    TEMPLATE_HEADERS,
    ['2025-03-15', 'expense', 125.5, 'Food & Dining', 'Groceries', 'acc_cash', ''],
    ['2025-03-01', 'income', 2500, 'Salary', 'Monthly pay', 'acc_bank', ''],
  ]
  const ws = XLSX.utils.aoa_to_sheet(examples)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

  const instr = [
    ['Fill rows under Transactions starting at row 2.'],
    ['Do not rename row 1 headers.'],
    ['Type:', 'income, expense, or loan'],
    ['Amount:', 'positive number only'],
    ['AccountId:', 'optional; acc_cash / acc_bank if you use default accounts'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instr), '_Instructions')

  XLSX.writeFile(wb, 'livio-import-template.xlsx')
}

/**
 * Parse uploaded workbook → array of objects with canonical keys { date, type, amount, category, description, accountId, sourceLoanId }
 */
export function parseTransactionsFromExcelFile(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames.includes('Transactions') ? 'Transactions' : wb.SheetNames[0]
  if (!sheetName) return { ok: false, error: 'No sheet found in workbook.' }

  const ws = wb.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true })
  if (!matrix.length) return { ok: false, error: 'Transactions sheet is empty.' }

  const headerRow = matrix[0].map(normalizeHeader)
  const colIndex = {}
  TEMPLATE_HEADERS.forEach((h) => {
    const i = headerRow.indexOf(h)
    if (i >= 0) colIndex[h] = i
  })

  if (colIndex.Date === undefined || colIndex.Type === undefined || colIndex.Amount === undefined) {
    return {
      ok: false,
      error:
        'Missing required columns. Row 1 must include: Date, Type, Amount (and optionally Category, Description, AccountId, SourceLoanId).',
    }
  }

  const rows = []
  const rowErrors = []

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r]
    if (!line || !line.some((c) => c !== '' && c != null)) continue

    const date = cellToDateString(line[colIndex.Date])
    const type = sanitizeType(line[colIndex.Type])
    const rawAmt = line[colIndex.Amount]
    const amount = typeof rawAmt === 'number' ? rawAmt : parseFloat(String(rawAmt).replace(/,/g, ''))

    const category = colIndex.Category !== undefined ? String(line[colIndex.Category] ?? '').trim() : ''
    const description = colIndex.Description !== undefined ? String(line[colIndex.Description] ?? '').trim() : ''
    const accountId =
      colIndex.AccountId !== undefined ? String(line[colIndex.AccountId] ?? '').trim() : ''
    const sourceLoanId =
      colIndex.SourceLoanId !== undefined ? String(line[colIndex.SourceLoanId] ?? '').trim() : ''

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      rowErrors.push(`Row ${r + 1}: invalid or missing Date`)
      continue
    }
    if (!type) {
      rowErrors.push(`Row ${r + 1}: Type must be income, expense, or loan`)
      continue
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      rowErrors.push(`Row ${r + 1}: Amount must be a positive number`)
      continue
    }

    rows.push({
      date,
      type,
      amount: Math.round(amount * 100) / 100,
      category: category || 'Other',
      description,
      accountId: accountId || undefined,
      sourceLoanId: sourceLoanId || undefined,
    })
  }

  return { ok: true, rows, rowErrors }
}
