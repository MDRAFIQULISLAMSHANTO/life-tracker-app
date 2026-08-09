'use client'

import { Quote } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { Card, Skeleton } from '../ui'

/**
 * The shared morning quote. One document per day for everyone, generated
 * server-side on first read and delivered live — so it changes for every open
 * client at once, with no reload.
 */
export default function DailyQuoteCard() {
  const { quote, quoteLoading, quoteIsFallback } = useContent()

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(var(--accent-rgb),0.10), rgba(var(--accent-rgb),0.02))',
        borderColor: 'rgba(var(--accent-rgb),0.22)',
      }}
    >
      <Quote
        size={88}
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-4"
        style={{ color: 'rgba(var(--accent-rgb),0.10)' }}
      />
      <div className="relative">
        <p
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--accent)' }}
        >
          {quote?.theme ? `Today · ${quote.theme}` : 'Today'}
        </p>

        {quoteLoading ? (
          <div className="space-y-2 py-1">
            <Skeleton height={18} width="92%" />
            <Skeleton height={18} width="64%" />
          </div>
        ) : (
          <blockquote
            className="max-w-3xl text-base font-semibold leading-relaxed sm:text-lg"
            style={{ color: 'var(--text-1)' }}
          >
            {quote.text}
          </blockquote>
        )}

        {!quoteLoading && (quote.author || quoteIsFallback) && (
          <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text-3)' }}>
            {quote.author ? `— ${quote.author}` : 'Offline — showing a saved line'}
          </p>
        )}
      </div>
    </Card>
  )
}
