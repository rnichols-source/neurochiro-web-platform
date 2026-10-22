"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { unsubscribeByEmail } from "./actions";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    const result = await unsubscribeByEmail(email.trim());
    if (result.success) {
      setStatus("done");
      setMessage("You have been unsubscribed. You will not receive any more emails from NeuroChiro.");
    } else {
      setStatus("error");
      setMessage(result.error || "Something went wrong. Please email support@neurochirodirectory.com.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F0EBDD", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 24, padding: 48, boxShadow: "0 10px 40px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB", textAlign: "center" }}>
        <img src="/logo.png" alt="NeuroChiro" width={100} style={{ margin: "0 auto 24px", display: "block" }} />

        {status === "done" ? (
          <>
            <h1 style={{ fontFamily: "'Lato', sans-serif", fontWeight: 900, fontSize: 24, color: "#1E2D3B", marginBottom: 12 }}>Unsubscribed</h1>
            <p style={{ color: "#4B5563", fontSize: 16, lineHeight: 1.6 }}>{message}</p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Lato', sans-serif", fontWeight: 900, fontSize: 24, color: "#1E2D3B", marginBottom: 12 }}>Unsubscribe</h1>
            <p style={{ color: "#4B5563", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              Enter your email to stop receiving emails from NeuroChiro.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ width: "100%", padding: "14px 18px", border: "1px solid #DDE2E5", borderRadius: 12, fontSize: 16, marginBottom: 16, outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                style={{ width: "100%", padding: "14px 24px", background: "#D66829", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: status === "loading" ? 0.6 : 1 }}
              >
                {status === "loading" ? "Processing..." : "Unsubscribe"}
              </button>
            </form>
            {status === "error" && (
              <p style={{ color: "#dc2626", fontSize: 14, marginTop: 12 }}>{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F0EBDD", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#4B5563" }}>Loading...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
