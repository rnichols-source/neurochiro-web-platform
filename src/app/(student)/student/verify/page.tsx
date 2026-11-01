import { VerifyResend } from './resend'

export default function StudentVerifyPage() {
  return (
    <main className="min-h-dvh bg-[#F5F3EF] px-4 py-16 text-[#1E2D3B]">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold">School email</h1>
        <p className="mt-4 text-base">This link expired — send a new one</p>
        <VerifyResend />
      </div>
    </main>
  )
}
