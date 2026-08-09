/**
 * Server-side Firebase, for API routes only.
 *
 * The client SDK writes as the signed-in user and is bound by firestore.rules,
 * which deny every client write under `content/**`. Shared content is therefore
 * written exclusively here — the Admin SDK bypasses rules, so authorship is
 * enforced in the route handler (a verified ID token, checked against
 * OWNER_EMAILS) instead of being trusted from the browser.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT: base64 of the service-account JSON.
 * It is a secret — it must never gain a NEXT_PUBLIC_ prefix.
 */
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const APP_NAME = 'livio-admin'

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    // Accept both base64 (what the setup docs tell you to paste) and raw JSON,
    // since some hosts mangle one or the other.
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch (e) {
    console.error('[admin] FIREBASE_SERVICE_ACCOUNT is not valid JSON/base64:', e?.message || e)
    return null
  }
}

/** @returns {import('firebase-admin/app').App | null} */
function adminApp() {
  const existing = getApps().find((a) => a.name === APP_NAME)
  if (existing) return existing
  const serviceAccount = loadServiceAccount()
  if (!serviceAccount) return null
  return initializeApp(
    { credential: cert(serviceAccount), projectId: serviceAccount.project_id },
    APP_NAME
  )
}

export function isAdminConfigured() {
  return !!adminApp()
}

export function adminDb() {
  const app = adminApp()
  if (!app) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set')
  return getFirestore(app)
}

/**
 * Verify a Firebase ID token from an Authorization: Bearer header.
 * @returns {Promise<{ uid: string, email: string | null } | null>}
 */
export async function verifyBearer(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  const app = adminApp()
  if (!app) return null
  try {
    const decoded = await getAuth(app).verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email || null }
  } catch (e) {
    console.warn('[admin] token verification failed:', e?.message || e)
    return null
  }
}

/** Firestore doc ref for a shared-content path, e.g. (['content','quotes','daily'], '2026-08-09'). */
export function contentDocRef(pathSegments, docId) {
  return adminDb().doc([...pathSegments, docId].join('/'))
}
