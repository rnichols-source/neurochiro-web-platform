import { Suspense } from 'react'
import QuizFlow from './QuizFlow'

export default function QuizPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto w-full max-w-xl min-h-[560px] px-4 py-10">
        <h1 className="font-heading text-2xl text-neuro-navy">What would you like help with?</h1>
        <p className="mt-2 text-base text-gray-600">4 quick questions, about a minute.</p>
      </main>
    }>
      <QuizFlow />
    </Suspense>
  )
}
