/**
 * One-shot: copies the built-in reference pages into the shared study library.
 *
 * Idempotent — the seed uses the same stable slugs the pages have always had,
 * so re-running replaces those documents rather than duplicating them. Pages
 * you have edited since seeding WILL be overwritten, which is why it needs
 * ?force=1 once the collection is no longer empty.
 */
import { LIBRARY_COLLECTION, normalizeAudience, normalizeSlug } from '../../../../lib/contentPaths'
import { adminDb, isAdminConfigured, verifyBearer } from '../../../../lib/firebaseAdmin'
import { REFERENCE } from '../../../../lib/growthSeed'
import { OWNER_EMAILS } from '../../../../lib/owner'

export async function POST(req) {
  if (!isAdminConfigured()) {
    return Response.json(
      { error: 'FIREBASE_SERVICE_ACCOUNT is not configured on the server.' },
      { status: 500 }
    )
  }

  const caller = await verifyBearer(req)
  if (!caller) return Response.json({ error: 'Sign in first.' }, { status: 401 })
  if (!caller.email || !OWNER_EMAILS.includes(caller.email.toLowerCase())) {
    return Response.json({ error: 'Not allowed.' }, { status: 403 })
  }

  const db = adminDb()
  const collectionPath = LIBRARY_COLLECTION.join('/')
  const force = new URL(req.url).searchParams.get('force') === '1'

  const existing = await db.collection(collectionPath).get()
  if (!existing.empty && !force) {
    return Response.json(
      {
        error: `The library already has ${existing.size} page(s). Re-run with ?force=1 to overwrite them with the built-in seed.`,
      },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()
  const batch = db.batch()
  const slugs = []

  REFERENCE.forEach((page, i) => {
    const slug = normalizeSlug(page.slug)
    if (!slug) return
    slugs.push(slug)
    batch.set(db.doc(`${collectionPath}/${slug}`), {
      slug,
      title: page.title,
      icon: page.icon || '📄',
      group: page.group || '',
      markdown: page.markdown || '',
      order: i,
      published: true,
      audience: normalizeAudience(page.audience),
      updatedAt: now,
      updatedBy: caller.email,
    })
  })

  await batch.commit()
  return Response.json({ ok: true, seeded: slugs.length, slugs })
}
