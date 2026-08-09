/**
 * Owner-only authoring endpoint for the shared study library.
 *
 * firestore.rules deny every client write under `content/**`, so this route is
 * the only way pages change. Ownership is checked here, against the email on a
 * verified ID token — the browser's `isOwner()` check only hides the UI.
 */
import { LIBRARY_COLLECTION, normalizeSlug } from '../../../../lib/contentPaths'
import { adminDb, contentDocRef, isAdminConfigured, verifyBearer } from '../../../../lib/firebaseAdmin'
import { OWNER_EMAILS } from '../../../../lib/owner'

async function requireOwner(req) {
  if (!isAdminConfigured()) {
    return { error: Response.json({ error: 'FIREBASE_SERVICE_ACCOUNT is not configured on the server.' }, { status: 500 }) }
  }
  const caller = await verifyBearer(req)
  if (!caller) {
    return { error: Response.json({ error: 'Sign in first.' }, { status: 401 }) }
  }
  if (!caller.email || !OWNER_EMAILS.includes(caller.email.toLowerCase())) {
    return { error: Response.json({ error: 'Not allowed.' }, { status: 403 }) }
  }
  return { caller }
}

export async function GET(req) {
  const { error } = await requireOwner(req)
  if (error) return error

  // Owners need the unpublished drafts too, which the client listener filters out.
  const snap = await adminDb().collection(LIBRARY_COLLECTION.join('/')).get()
  const pages = snap.docs
    .map((d) => d.data())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.title).localeCompare(String(b.title)))
  return Response.json({ pages })
}

export async function POST(req) {
  const { error, caller } = await requireOwner(req)
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })

  const slug = normalizeSlug(body.slug || body.title)
  if (!slug) return Response.json({ error: 'A slug or title is required.' }, { status: 400 })

  const title = String(body.title || '').trim()
  if (!title) return Response.json({ error: 'Title is required.' }, { status: 400 })

  const markdown = String(body.markdown || '')
  if (markdown.length > 100_000) {
    return Response.json({ error: 'Page is too long (100k character limit).' }, { status: 400 })
  }

  const page = {
    slug,
    title: title.slice(0, 160),
    icon: String(body.icon || '📄').slice(0, 8),
    group: String(body.group || '').trim().slice(0, 80),
    markdown,
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    published: body.published !== false,
    updatedAt: new Date().toISOString(),
    updatedBy: caller.email,
  }

  await contentDocRef(LIBRARY_COLLECTION, slug).set(page, { merge: true })
  return Response.json({ ok: true, page })
}

export async function DELETE(req) {
  const { error } = await requireOwner(req)
  if (error) return error

  const slug = normalizeSlug(new URL(req.url).searchParams.get('slug'))
  if (!slug) return Response.json({ error: 'slug query parameter is required.' }, { status: 400 })

  await contentDocRef(LIBRARY_COLLECTION, slug).delete()
  return Response.json({ ok: true, slug })
}
