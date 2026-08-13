/**
 * Account deletion.
 *
 * Done server-side with the Admin SDK rather than the client's deleteUser(),
 * which refuses with `auth/requires-recent-login` unless the user signed in
 * minutes ago — a confusing wall to hit at the end of a deliberate, typed
 * confirmation. The Admin SDK has no such requirement.
 *
 * Order matters: Firestore documents go first, the auth user last. If the run
 * fails midway the account still exists and the user can retry; deleting the
 * auth user first would strand any remaining documents with no owner.
 */
import { adminDb, isAdminConfigured, verifyBearer } from '../../../lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'
import { getApps, getApp } from 'firebase-admin/app'

export async function DELETE(req) {
  if (!isAdminConfigured()) {
    return Response.json(
      { error: 'Account deletion is unavailable: the server is missing its credentials.' },
      { status: 500 }
    )
  }

  const caller = await verifyBearer(req)
  if (!caller) return Response.json({ error: 'Sign in first.' }, { status: 401 })

  const { uid } = caller
  const db = adminDb()
  const deleted = { docs: 0, trackers: 0, entries: 0 }

  try {
    // Everything the app writes for a user lives under users/{uid}.
    await db.recursiveDelete(db.doc(`users/${uid}`))
    deleted.docs = 1

    // Legacy top-level collections predate that layout.
    for (const [name, key] of [
      ['trackers', 'trackers'],
      ['tracker_entries', 'entries'],
    ]) {
      const snap = await db.collection(name).where('userId', '==', uid).get()
      if (!snap.empty) {
        const batch = db.batch()
        snap.docs.forEach((d) => batch.delete(d.ref))
        await batch.commit()
        deleted[key] = snap.size
      }
    }

    // Auth user last, so a failure above leaves an account that can retry.
    const app = getApps().find((a) => a.name === 'livio-admin') || getApp('livio-admin')
    await getAuth(app).deleteUser(uid)

    console.info('[account] deleted', uid, deleted)
    return Response.json({ ok: true, deleted })
  } catch (e) {
    console.error('[account] deletion failed for', uid, e?.message || e)
    return Response.json(
      { error: 'Could not finish deleting the account. Nothing else was removed — please try again.' },
      { status: 500 }
    )
  }
}
