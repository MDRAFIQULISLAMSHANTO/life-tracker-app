'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SummaryCard from '../dashboard/SummaryCard'
import ExpenseDonutChart from '../charts/ExpenseDonutChart'
import DailyTrendChart from '../charts/DailyTrendChart'
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function DashboardPreview() {
  const sectionRef = useRef(null)
  const containerRef = useRef(null)
  const titleRef = useRef(null)
  const cardsRef = useRef(null)
  const chartsRef = useRef(null)

  const expenseData = [
    { name: 'Food & Dining', value: 12500 },
    { name: 'Transportation', value: 8500 },
    { name: 'Shopping', value: 6800 },
    { name: 'Bills & Utilities', value: 9500 },
  ]

  const dailyTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    income: 1500 + Math.random() * 300,
    expense: 1200 + Math.random() * 200,
  }))

  const summaryData = {
    balance: { value: formatCurrency(125450, 'USD'), change: '+12.5%', changeType: 'positive' },
    income: { value: formatCurrency(45000, 'USD'), change: '+8.2%', changeType: 'positive' },
    expense: { value: formatCurrency(37500, 'USD'), change: '-3.1%', changeType: 'negative' },
    savings: { value: formatCurrency(7500, 'USD'), change: '+15.3%', changeType: 'positive' },
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.from(titleRef.current, {
          opacity: 0,
          y: 50,
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          duration: 1,
          ease: 'power3.out',
        })
      }

      if (containerRef.current) {
        gsap.from(containerRef.current, {
          opacity: 0,
          scale: 0.95,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          duration: 1.2,
          ease: 'power3.out',
        })
      }

      if (cardsRef.current) {
        const cardsArray = Array.from(cardsRef.current.children)
        gsap.from(cardsArray, {
          opacity: 0,
          y: 50,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        })
      }

      if (chartsRef.current && chartsRef.current.children) {
        const chartsArray = Array.from(chartsRef.current.children)
        gsap.from(chartsArray, {
          opacity: 0,
          x: -50,
          scrollTrigger: {
            trigger: chartsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Your dashboard, simplified
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your money, tasks, and life in one beautiful interface.
          </p>
        </div>

        <div 
          ref={containerRef}
          className="relative bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden"
        >
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Hey there! Welcome back
                </h3>
                <p className="text-gray-600 mt-1">
                  Here's your overview for today
                </p>
              </div>
              <button className="hidden sm:flex px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Quick Add
              </button>
            </div>

            <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                title="Balance"
                value={summaryData.balance.value}
                change={summaryData.balance.change}
                changeType={summaryData.balance.changeType}
                icon={Wallet}
                iconColor="primary"
              />
              <SummaryCard
                title="Income"
                value={summaryData.income.value}
                change={summaryData.income.change}
                changeType={summaryData.income.changeType}
                icon={TrendingUp}
                iconColor="success"
              />
              <SummaryCard
                title="Expenses"
                value={summaryData.expense.value}
                change={summaryData.expense.change}
                changeType={summaryData.expense.changeType}
                icon={TrendingDown}
                iconColor="danger"
              />
              <SummaryCard
                title="Savings"
                value={summaryData.savings.value}
                change={summaryData.savings.change}
                changeType={summaryData.savings.changeType}
                icon={Target}
                iconColor="success"
              />
            </div>

            <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h4>
                <ExpenseDonutChart data={expenseData} />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h4>
                <DailyTrendChart data={dailyTrendData} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Clean, intuitive, and designed for daily use
          </p>
        </div>
      </div>
    </section>
  )
}
