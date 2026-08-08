import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms you agree to when using Livio.',
}

const UPDATED = '8 August 2026'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16" style={{ color: 'var(--text-2)' }}>
      <Link href="/" className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
        ← Livio
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
        Terms of Service
      </h1>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
        Last updated {UPDATED}
      </p>

      <div className="prose-livio mt-8">
        <h2>Using Livio</h2>
        <p>
          Livio is a personal tracking tool for money, habits and goals. You need an account to use
          it, and you are responsible for keeping your sign-in credentials secure and for the
          accuracy of the data you enter.
        </p>

        <h2>Not financial advice</h2>
        <p>
          Livio — including the AI advisor — provides general information only. It is not financial,
          investment, tax, legal, medical or nutritional advice. Figures and suggestions may be
          wrong or incomplete. Decisions you make are your own; check anything important with a
          qualified professional.
        </p>

        <h2>Availability</h2>
        <p>
          Livio is provided as-is, without warranty. Features may change or be withdrawn, and there
          is no guarantee of uninterrupted service. Keep your own backup of anything you cannot
          afford to lose — Settings can export your data.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Don’t attempt to access another user’s data</li>
          <li>Don’t use the service to break the law</li>
          <li>Don’t abuse the AI endpoint or attempt to circumvent rate limits</li>
        </ul>

        <h2>Ending your use</h2>
        <p>
          You can stop using Livio and delete your data at any time from Settings. Accounts that
          abuse the service may be suspended.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:rishanto.001@gmail.com">rishanto.001@gmail.com</a>
        </p>
      </div>
    </main>
  )
}
