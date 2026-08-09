'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { useContent } from '../../../../context/ContentContext'
import { renderMarkdown } from '../../../../lib/markdown'
import { Button, Card, EmptyState } from '../../../../components/ui'

export default function ReferencePage() {
  const { slug } = useParams()
  // Shared content — one live copy for every account, not a per-user snapshot.
  const { pageBySlug } = useContent()
  const page = pageBySlug[slug]

  const html = useMemo(() => (page ? renderMarkdown(page.markdown) : ''), [page])

  if (!page) {
    return (
      <div className="space-y-5">
        <BackLink />
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="This page isn’t in the study library — it may have been renamed or unpublished."
          action={
            <Link href="/dashboard/growth">
              <Button>Back to Growth</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <BackLink />
      <Card className="max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {page.icon}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              {page.title}
            </h1>
            {page.group && (
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                {page.group}
              </p>
            )}
          </div>
        </div>
        {/*
          Safe by construction: renderMarkdown escapes &, <, > and " on every
          text segment BEFORE it emits any tag, and only emits its own fixed tag
          set. Link hrefs must match ^https?:// so javascript: URLs can't slip
          through. Do not add a raw-HTML passthrough to that renderer.
        */}
        <div className="prose-livio" dangerouslySetInnerHTML={{ __html: html }} />
      </Card>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/dashboard/growth"
      className="inline-flex items-center gap-1.5 text-sm font-bold"
      style={{ color: 'var(--text-2)' }}
    >
      <ArrowLeft className="h-4 w-4" />
      Growth
    </Link>
  )
}
