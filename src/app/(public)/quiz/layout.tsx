import type { Metadata } from 'next'

const title = 'Find a nervous system chiropractor near you: 4-question match | NeuroChiro'
const description = 'Answer 4 quick questions and see verified nervous system chiropractors near your ZIP code, ranked by distance and fit. Free, no account needed.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: 'https://www.neurochiro.co/quiz' },
  openGraph: {
    title,
    description,
    url: 'https://www.neurochiro.co/quiz',
    siteName: 'NeuroChiro',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: { index: true, follow: true },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-neuro-cream">{children}</div>
}
