'use client'

/**
 * Correcting an existing entry.
 *
 * Until now a transaction could only be added or deleted, so fixing a
 * mistyped amount meant deleting the row and retyping it — losing the
 * original date and account in the process. One sheet serves income and
 * expenses; the category list follows the entry's own type.
 */

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { Button, Field, Input, Select, Sheet, Textarea } from '../ui'

export default function TransactionEditSheet({ open, tx, onClose }) {
  const {
    updateTransaction,
    deleteTransaction,
    accounts,
    expenseCategories,
    incomeCategories,
    otherCategories,
  } = useFinance()

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')

  // Refill on every open so editing one row then another never shows the
  // previous row's values.
  useEffect(() => {
    if (!open || !tx) return
    setAmount(String(tx.amount ?? ''))
    setCategory(tx.category || '')
    setDescription(tx.description || '')
    setDate(tx.date || '')
    setAccountId(tx.accountId || accounts[0]?.id || '')
    setError('')
  }, [open, tx, accounts])

  if (!tx) return null

  const categories =
    tx.type === 'income'
      ? [...incomeCategories, ...otherCategories]
      : [...expenseCategories, ...otherCategories]

  // Loan rows are rebuilt from the loan, so an edit here would be discarded.
  const derived = !!tx.sourceLoanId

  const submit = (e) => {
    e.preventDefault()
    const res = updateTransaction(tx.id, { amount, category, description, date, accountId })
    if (!res.ok) {
      setError(res.error || 'Could not save.')
      return
    }
    onClose()
  }

  const remove = () => {
    if (!window.confirm('Delete this entry?')) return
    deleteTransaction(tx.id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={tx.type === 'income' ? 'Edit income' : 'Edit expense'}
    >
      {derived ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            This entry is generated from a loan, so editing it here wouldn&apos;t stick — it gets
            rebuilt whenever the loan changes. Edit the loan itself and this row will follow.
          </p>
          <Button type="button" onClick={onClose} full>
            Got it
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <Field label="Amount">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>

          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {/* The saved category may have since been removed from settings —
                  keep it selectable so editing can't silently reassign it. */}
              {!categories.includes(category) && category && (
                <option value={category}>{category}</option>
              )}
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="Account">
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Note">
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {error && (
            <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <Button type="submit" size="lg" full>
            Save changes
          </Button>
          <Button type="button" variant="danger" onClick={remove} full>
            <Trash2 className="h-4 w-4" /> Delete entry
          </Button>
        </form>
      )}
    </Sheet>
  )
}
