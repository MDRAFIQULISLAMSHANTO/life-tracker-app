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

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-text-secondary mb-8">
            Send us an email and we'll get back to you as soon as possible.
          </p>
          <a
            href="mailto:hello@rishanto.com"
            className="inline-flex items-center px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}


