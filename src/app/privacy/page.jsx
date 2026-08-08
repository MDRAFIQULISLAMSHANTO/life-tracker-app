import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Livio handles your data.',
}

const UPDATED = '8 August 2026'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16" style={{ color: 'var(--text-2)' }}>
      <Link href="/" className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
        ← Livio
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
        Privacy Policy
      </h1>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
        Last updated {UPDATED}
      </p>

      <div className="prose-livio mt-8">
        <h2>What Livio stores</h2>
        <p>
          Livio stores the data you enter: transactions, accounts, budgets, loans, habits, goals,
          daily plans, reviews and notes. It also stores your account identifier and email address
          from your sign-in provider.
        </p>

        <h2>Where it is stored</h2>
        <p>
          Data lives in two places: your device (browser local storage, so the app works offline)
          and your private Google Firestore document, scoped to your user ID. Security rules
          restrict every document to the account that created it — no other user can read it.
        </p>

        <h2>Sign-in</h2>
        <p>
          Authentication is handled by Firebase Authentication (Google, email/password, or phone).
          Livio never sees or stores your password.
        </p>

        <h2>The AI advisor</h2>
        <p>
          When you use the AI advisor, a summary of your financial figures is sent to Google’s
          Gemini API to generate a reply. It is not used to train models by default, and Livio does
          not retain the conversation on a server. If you would rather not share those figures,
          simply do not use the advisor.
        </p>

        <h2>What Livio does not do</h2>
        <ul>
          <li>No advertising, no ad networks, no third-party trackers</li>
          <li>No selling or sharing of your data</li>
          <li>No access to bank accounts — you enter figures yourself</li>
        </ul>

        <h2>Notifications</h2>
        <p>
          Reminder notifications are generated on your device by the app’s service worker. Reminder
          content is never sent to a server.
        </p>

        <h2>Deleting your data</h2>
        <p>
          Settings includes a full data reset. To remove your account entirely, email the address
          below and it will be deleted along with its stored documents.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy: <a href="mailto:rishanto.001@gmail.com">rishanto.001@gmail.com</a>
        </p>
      </div>
    </main>
  )
}
