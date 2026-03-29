'use client'

import { useState, useMemo, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { TRANSACTION_TYPES } from '../../utils/constants'
import { useFinance } from '../../context/FinanceContext'

const transactionTypes = [
  { id: TRANSACTION_TYPES.INCOME, label: 'Income', icon: '↑' },
  { id: TRANSACTION_TYPES.EXPENSE, label: 'Expense', icon: '↓' },
]

function QuickAddModal({ isOpen, onClose }) {
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES.EXPENSE)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)

  const { expenseCategories, incomeCategories, addTransaction } = useFinance()

  const categories = useMemo(() => {
    return selectedType === TRANSACTION_TYPES.INCOME ? incomeCategories : expenseCategories
  }, [selectedType])

  // Ensure we always have a valid default category for the selected type.
  // (Otherwise quick-add can submit with an empty category.)
  const activeCategories = categories && categories.length ? categories : ['Other']

  useEffect(() => {
    // Keep a valid default selection; prevents empty category submissions.
    if (!category && activeCategories[0]) setCategory(activeCategories[0])
  }, [selectedType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory)
    setCategoryDropdownOpen(false)
  }

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = addTransaction({
      type: selectedType,
      amount,
      category,
      description,
      date,
    })

    if (!result.ok) {
      // Simple UX: keep modal open for user to fix inputs
      console.warn(result.error)
      return
    }

    // Reset form
    setAmount('')
    setCategory('')
    setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
    onClose()
  }

  const handleTypeChange = (type) => {
    setSelectedType(type)
    const next =
      type === TRANSACTION_TYPES.INCOME ? (incomeCategories[0] || '') : (expenseCategories[0] || '')
    setCategory(next)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto z-50 mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Quick Add</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {transactionTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedType === type.id
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium text-text-primary">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-left flex items-center justify-between ${
                    category
                      ? 'border-gray-300 text-text-primary'
                      : 'border-gray-300 text-text-secondary'
                  }`}
                >
                  <span>{category || 'Select category...'}</span>
                  <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform ${categoryDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {categoryDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setCategoryDropdownOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategorySelect(cat)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            category === cat ? 'bg-primary-50 text-primary font-medium' : 'text-text-primary'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-text-primary font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
              >
                Add Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default QuickAddModal