/**
 * Owner detection.
 *
 * This is a CONTENT switch, not a security boundary — it only decides which
 * seed a brand-new account receives. All growth data is already isolated
 * per-uid by the Firestore rules, so an impersonated email grants nothing.
 */
export const OWNER_EMAILS = ['rishanto.001@gmail.com']

export function isOwner(user) {
  const email = user?.email
  if (!email) return false
  return OWNER_EMAILS.includes(email.toLowerCase())
}
