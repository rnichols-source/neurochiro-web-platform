'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // In production, log this to an error reporting service (e.g., Sentry)
    console.error('CRITICAL PLATFORM ERROR:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-red-50 p-10 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-heading font-black text-neuro-navy mb-4">Something went wrong</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          The NeuroChiro node encountered an unexpected state. Our developers have been notified.
          {error.digest && (
            <span className="block mt-2 text-[10px] text-gray-400 font-mono">
              Error ID: {error.digest}
            </span>
          )}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          
          <Link
            href="/"
            className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 hover:text-neuro-navy transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-900 rounded-2xl text-left overflow-auto max-h-40">
            <p className="text-[10px] font-mono text-red-400 leading-tight">
              {error.message}
              <br />
              {error.stack}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
