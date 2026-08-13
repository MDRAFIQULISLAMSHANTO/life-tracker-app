'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Eye, EyeOff, Plus, RefreshCw, Save, ShieldAlert, Trash2 } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { isOwner } from '../../../../lib/owner'
import { normalizeSlug } from '../../../../lib/contentPaths'
import { renderMarkdown } from '../../../../lib/markdown'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../../../../components/ui'

const BLANK = {
  slug: '',
  title: '',
  icon: '📄',
  group: 'Daily practice',
  markdown: '',
  order: 0,
  published: true,
  // Private until deliberately shared — see PAGE_AUDIENCES in contentPaths.
  audience: 'owner',
}

/**
 * Authoring surface for the shared study library. Every save goes through
 * /api/admin/library, which re-checks ownership against a verified ID token —
 * the `isOwner` gate here only decides what the browser draws.
 */
export default function AdminLibraryPage() {
  const { user, loading } = useAuth()
  const owner = isOwner(user)

  const [pages, setPages] = useState([])
  const [draft, setDraft] = useState(BLANK)
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const [busy, setBusy] = useState(false)

  const authedFetch = useCallback(
    async (url, options = {}) => {
      const token = await user.getIdToken()
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      return body
    },
    [user]
  )

  const reload = useCallback(async () => {
    if (!user || !owner) return
    try {
      const { pages: rows } = await authedFetch('/api/admin/library')
      setPages(rows || [])
    } catch (e) {
      setStatus({ kind: 'error', message: e.message })
    }
  }, [user, owner, authedFetch])

  useEffect(() => {
    reload()
  }, [reload])

  const previewHtml = useMemo(() => renderMarkdown(draft.markdown || ''), [draft.markdown])
  const effectiveSlug = normalizeSlug(draft.slug || draft.title)

  const selectPage = (page) => {
    setSelectedSlug(page.slug)
    setDraft({ ...BLANK, ...page })
    setStatus({ kind: 'idle', message: '' })
  }

  const startNew = () => {
    setSelectedSlug(null)
    setDraft({ ...BLANK, order: pages.length })
    setStatus({ kind: 'idle', message: '' })
  }

  const save = async () => {
    setBusy(true)
    setStatus({ kind: 'idle', message: '' })
    try {
      const { page } = await authedFetch('/api/admin/library', {
        method: 'POST',
        body: JSON.stringify(draft),
      })
      setSelectedSlug(page.slug)
      setDraft({ ...BLANK, ...page })
      await reload()
      setStatus({
        kind: 'ok',
        message: page.audience === 'everyone'
          ? `Saved — live for every account at /dashboard/growth/${page.slug}`
          : `Saved — private to you at /dashboard/growth/${page.slug}`,
      })
    } catch (e) {
      setStatus({ kind: 'error', message: e.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!selectedSlug) return
    // Deleting removes the page for every user, so make it a deliberate action.
    if (!window.confirm(`Delete "${draft.title}" for everyone? This cannot be undone.`)) return
    setBusy(true)
    try {
      await authedFetch(`/api/admin/library?slug=${encodeURIComponent(selectedSlug)}`, {
        method: 'DELETE',
      })
      startNew()
      await reload()
      setStatus({ kind: 'ok', message: 'Page deleted.' })
    } catch (e) {
      setStatus({ kind: 'error', message: e.message })
    } finally {
      setBusy(false)
    }
  }

  const seed = async () => {
    if (!window.confirm('Seed the built-in reference pages? Existing pages with the same slugs are overwritten.')) return
    setBusy(true)
    try {
      const res = await authedFetch('/api/admin/seed-library?force=1', { method: 'POST' })
      await reload()
      setStatus({ kind: 'ok', message: `Seeded ${res.seeded} page(s).` })
    } catch (e) {
      setStatus({ kind: 'error', message: e.message })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null
  if (!owner) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Not available"
        description="The shared study library can only be edited by the workspace owner."
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Study library"
        subtitle="Shared pages every signed-in account reads live. Saving updates them without a reload."
        icon={BookOpen}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={seed} disabled={busy}>
              <RefreshCw className="h-4 w-4" /> Seed built-ins
            </Button>
            <Button size="sm" onClick={startNew} disabled={busy}>
              <Plus className="h-4 w-4" /> New page
            </Button>
          </>
        }
      />

      {status.message && (
        <Card
          style={{
            borderColor:
              status.kind === 'error' ? 'rgba(var(--danger-rgb),0.35)' : 'rgba(var(--accent-rgb),0.35)',
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: status.kind === 'error' ? 'var(--danger)' : 'var(--text-1)' }}
          >
            {status.message}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Pages ({pages.length})
          </h2>
          <div className="space-y-1">
            {pages.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => selectPage(p)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold"
                style={{
                  background: p.slug === selectedSlug ? 'rgba(var(--accent-rgb),0.12)' : 'transparent',
                  color: p.slug === selectedSlug ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                <span aria-hidden>{p.icon}</span>
                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                {p.audience === 'everyone' && (
                  <span
                    className="shrink-0 rounded px-1 text-[9px] font-bold uppercase tracking-wide"
                    style={{ background: 'rgba(var(--accent-rgb),0.14)', color: 'var(--accent)' }}
                  >
                    Public
                  </span>
                )}
                {p.published ? (
                  <Eye className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                )}
              </button>
            ))}
            {!pages.length && (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                No pages yet — seed the built-ins or create one.
              </p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Study Materials — Daily Drivers"
              />
            </Field>
            <Field label="Slug" hint={effectiveSlug ? `/dashboard/growth/${effectiveSlug}` : 'Derived from the title'}>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                placeholder="study-materials"
              />
            </Field>
            <Field label="Icon">
              <Input
                value={draft.icon}
                onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
                maxLength={4}
              />
            </Field>
            <Field label="Group">
              <Input
                value={draft.group}
                onChange={(e) => setDraft((d) => ({ ...d, group: e.target.value }))}
                placeholder="Daily practice"
              />
            </Field>
            <Field label="Order">
              <Input
                type="number"
                value={draft.order}
                onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.published ? 'published' : 'draft'}
                onChange={(e) => setDraft((d) => ({ ...d, published: e.target.value === 'published' }))}
              >
                <option value="published">Published</option>
                <option value="draft">Draft — only visible here</option>
              </Select>
            </Field>
            <Field
              label="Who can read it"
              hint={draft.audience === 'everyone'
                ? 'Every signed-in account will see this page.'
                : 'Only you. Personal plans and targets belong here.'}
            >
              <Select
                value={draft.audience}
                onChange={(e) => setDraft((d) => ({ ...d, audience: e.target.value }))}
              >
                <option value="owner">Just me — private</option>
                <option value="everyone">Everyone with an account</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Markdown">
              <Textarea
                rows={14}
                value={draft.markdown}
                onChange={(e) => setDraft((d) => ({ ...d, markdown: e.target.value }))}
                placeholder={'## Block 1\n\n1. Step one\n2. Step two'}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}
              />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={save} disabled={busy || !draft.title.trim()}>
              <Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save & publish'}
            </Button>
            {selectedSlug && (
              <Button variant="danger" onClick={remove} disabled={busy}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              Preview
            </p>
            {/*
              Same renderer readers get, so the preview is exactly what ships.
              Safe by construction: renderMarkdown escapes &, <, > and " on every
              text segment BEFORE it emits any tag, and only emits its own fixed
              tag set. Link hrefs must match ^https?:// so javascript: URLs can't
              slip through. Do not add a raw-HTML passthrough to that renderer.
            */}
            <div className="prose-livio" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </Card>
      </div>
    </div>
  )
}
