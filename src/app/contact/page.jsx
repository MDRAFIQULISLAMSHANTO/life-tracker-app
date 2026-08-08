'use client'

import Navbar from '../../components/landing/Navbar'
import Footer from '../../components/landing/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
            Get in Touch
          </h1>
          <p className="text-base text-neutral-600 sm:text-lg">
            Have questions or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 surface-1 p-8 text-center shadow-sm sm:p-12">
          <p className="text-neutral-500 mb-6 text-sm sm:text-base">
            Send an email and I&apos;ll get back to you as soon as possible.
          </p>
          <a
            href="mailto:rishanto.001@gmail.com"
            className="inline-flex items-center px-8 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            rishanto.001@gmail.com
          </a>
          <p className="mt-6 text-xs text-neutral-400">
            Or visit{' '}
            <a
              href="https://www.rishanto.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#6366f1' }}
            >
              www.rishanto.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}


