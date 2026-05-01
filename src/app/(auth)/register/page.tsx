"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createAccountAction, signInWithProvider, claimDoctorProfileAction } from "../actions/auth";

type Role = "doctor" | "student" | "patient";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("claim_id");
  const urlRole = searchParams.get("role");
  const billing = searchParams.get("billing");

  const [role, setRole] = useState<Role>(claimId ? "doctor" : urlRole === "student" ? "student" : urlRole === "patient" ? "patient" : "doctor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    if (licenseNumber) formData.append("licenseNumber", licenseNumber);
    if (licenseState) formData.append("licenseState", licenseState);
    if (billing) formData.append("billing", billing);

    const result = await createAccountAction(formData, role, "starter", "monthly");

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.user && claimId) {
      await claimDoctorProfileAction(result.user.id, claimId);
    }

    // Patient: redirect immediately (free, no verification needed)
    if (role === "patient") {
      router.push("/portal/dashboard");
      return;
    }

    // Claiming flow: redirect immediately
    if (claimId) {
      router.push(role === "doctor" ? "/doctor/dashboard" : "/student/dashboard");
      return;
    }

    // Session already active: redirect immediately
    if ((result as Record<string, unknown>).sessionActive) {
      router.push(role === "doctor" ? "/doctor/dashboard" : "/student/dashboard");
      return;
    }

    // Otherwise show email verification screen
    setVerificationEmail(email);
    setShowVerification(true);
    setPending(false);
  };

  if (showVerification) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h1>
          <p className="text-gray-500 mb-2">We sent a verification link to:</p>
          <p className="text-gray-900 font-semibold mb-6">{verificationEmail}</p>
          <p className="text-gray-500 text-sm mb-8">Click the link in the email to verify your account, then log in.</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {claimId ? "Claim Your Profile" : "Create your free account"}
        </h1>
        {claimId ? (
          <p className="text-center text-gray-500 text-sm mb-6">Create an account to manage your NeuroChiro listing. Takes 30 seconds.</p>
        ) : (
          <p className="text-center text-gray-500 text-sm mb-6">Free to join. No credit card required.</p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role toggle — hide when claiming (always doctor) */}
          {!claimId && (
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button type="button" onClick={() => setRole("doctor")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${role === "doctor" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              Doctor
            </button>
            <button type="button" onClick={() => setRole("student")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${role === "student" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              Student
            </button>
            <button type="button" onClick={() => setRole("patient")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${role === "patient" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              Patient
            </button>
          </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={role === "doctor" ? "Dr. Jane Smith" : "Your full name"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Phone number (optional)"
            />
          </div>

          {/* License info for doctors — skip for claim flow to reduce friction */}
          {role === "doctor" && !claimId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License # <span className="text-gray-400">(required)</span></label>
                <input
                  type="text" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="DC-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
                <input
                  type="text" required value={licenseState} onChange={(e) => setLicenseState(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g. TX, CA, NSW"
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={pending}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60">
            {pending ? "Creating..." : claimId ? "Claim My Profile" : "Create Free Account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button onClick={() => signInWithProvider("google")}
          className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><p>Loading...</p></div>}>
      <RegisterForm />
    </Suspense>
  );
}
