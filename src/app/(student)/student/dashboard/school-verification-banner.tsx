"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { getVerificationStatus, sendSchoolVerification, requestSchoolReview, updateGraduationYear } from "../actions/verify-school"

export default function SchoolVerificationBanner() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [gradYear, setGradYear] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [showUnlisted, setShowUnlisted] = useState(false)
  const [unlistedSchool, setUnlistedSchool] = useState("")
  const [unlistedEmail, setUnlistedEmail] = useState("")

  useEffect(() => {
    getVerificationStatus().then(s => { setStatus(s); setLoading(false) })
  }, [])

  if (loading) return null
  if (status?.verified) return null // Already verified, no banner needed

  const handleVerify = async () => {
    if (!email.trim()) return
    setSending(true)
    setResult(null)
    const res = await sendSchoolVerification(email.trim())
    if (res.success) {
      setResult({ ok: true, msg: `Verification email sent to ${email}. Check your inbox at ${res.schoolName}.` })
    } else if (res.error === 'unrecognized_domain') {
      setResult({ ok: false, msg: res.message || 'Unrecognized domain.' })
      setShowUnlisted(true)
    } else {
      setResult({ ok: false, msg: res.error || 'Something went wrong.' })
    }
    setSending(false)
  }

  const handleUnlisted = async () => {
    if (!unlistedSchool.trim() || !unlistedEmail.trim()) return
    setSending(true)
    const res = await requestSchoolReview(unlistedSchool.trim(), unlistedEmail.trim())
    if (res.success) {
      setResult({ ok: true, msg: "Request submitted. We'll review your school and get back to you." })
      setShowUnlisted(false)
    } else {
      setResult({ ok: false, msg: res.error || 'Failed to submit.' })
    }
    setSending(false)
  }

  const handleGradYear = async () => {
    const year = parseInt(gradYear)
    if (!year) return
    await updateGraduationYear(year)
  }

  return (
    <div className="bg-[#F7F8F9] border border-[#DDE2E5] rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <ShieldCheck className="w-5 h-5 text-[#3E6B7C] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-[#16222D]">Verify your school email</h3>
          <p className="text-xs text-[#5A6873] mt-0.5">Verified students get a badge on their profile that doctors see when you apply to jobs.</p>
        </div>
      </div>

      {result && (
        <div className={`rounded-xl p-3 mb-3 flex items-start gap-2 ${result.ok ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          {result.ok ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
          <p className={`text-xs ${result.ok ? 'text-green-400' : 'text-red-400'}`}>{result.msg}</p>
        </div>
      )}

      {!showUnlisted ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6873]/40" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your.name@palmer.edu"
                className="w-full pl-10 pr-3 py-3 bg-white border border-[#DDE2E5] rounded-xl text-sm text-[#16222D] placeholder:text-[#5A6873]/50 focus:outline-none focus:border-[#3E6B7C]"
                onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
              />
            </div>
            <button onClick={handleVerify} disabled={sending || !email.trim()}
              className="px-4 py-3 bg-[#3E6B7C] text-white rounded-xl text-xs font-bold hover:bg-[#2E5A6B] disabled:opacity-50 min-h-[44px] shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={gradYear}
              onChange={e => setGradYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={handleGradYear}
              placeholder="Graduation year (e.g. 2027)"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-[#5A6873]/40 focus:outline-none focus:border-blue-400/50"
            />
          </div>
          <button onClick={() => setShowUnlisted(true)} className="text-[11px] text-[#3E6B7C]/60 hover:text-[#3E6B7C] transition-colors">
            My school isn't listed
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#5A6873]">Tell us your school and we'll add it. We'll verify manually.</p>
          <input
            type="text"
            value={unlistedSchool}
            onChange={e => setUnlistedSchool(e.target.value)}
            placeholder="School name (e.g. Palmer College of Chiropractic)"
            className="w-full px-3 py-3 bg-white border border-[#DDE2E5] rounded-xl text-sm text-[#16222D] placeholder:text-[#5A6873]/50 focus:outline-none focus:border-[#3E6B7C]"
          />
          <input
            type="email"
            value={unlistedEmail}
            onChange={e => setUnlistedEmail(e.target.value)}
            placeholder="Your school email address"
            className="w-full px-3 py-3 bg-white border border-[#DDE2E5] rounded-xl text-sm text-[#16222D] placeholder:text-[#5A6873]/50 focus:outline-none focus:border-[#3E6B7C]"
          />
          <div className="flex gap-2">
            <button onClick={handleUnlisted} disabled={sending || !unlistedSchool.trim() || !unlistedEmail.trim()}
              className="px-4 py-2.5 bg-[#3E6B7C] text-white rounded-xl text-xs font-bold hover:bg-[#2E5A6B] disabled:opacity-50 min-h-[44px]">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Review'}
            </button>
            <button onClick={() => setShowUnlisted(false)} className="px-4 py-2.5 bg-[#EFF1F2] text-[#5A6873] rounded-xl text-xs font-bold hover:bg-[#DDE2E5]">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
