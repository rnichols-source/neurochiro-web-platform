import { CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CarePlanCloserSuccessPage() {
  const CALENDLY_URL = "https://calendly.com/neurochiro/care-plan-closer";

  return (
    <div style={{ minHeight: "100dvh", background: "#0F1A24", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div style={{ background: "#1a2e40", borderRadius: 24, padding: 48, border: "1px solid rgba(255,255,255,0.08)" }}>
          <CheckCircle2 style={{ width: 64, height: 64, color: "#22c55e", margin: "0 auto 20px" }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>You're a Beta Founding Member!</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            Your setup fee is paid and your price is locked forever. Now let's build your care plans.
          </p>

          <div style={{ background: "rgba(214,104,41,0.1)", border: "1px solid rgba(214,104,41,0.2)", borderRadius: 16, padding: 24, marginBottom: 32, textAlign: "left" }}>
            <p style={{ color: "#D66829", fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Next Steps:</p>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                "Book your two 45-minute build calls with Dr. Ray",
                "Come prepared with your current care plan pricing and visit schedules",
                "After the calls, your Care Plan Closer is live and ready to use",
                "Your $97/mo billing starts after your build calls are complete",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "#D66829", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "16px 0", background: "#D66829", color: "#fff", fontWeight: 900,
              borderRadius: 12, textDecoration: "none", fontSize: 15,
              boxShadow: "0 4px 20px rgba(214,104,41,0.4)",
            }}
          >
            <Calendar style={{ width: 18, height: 18 }} />
            Book Your Build Calls
          </a>

          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 16 }}>
            Questions? Email support@neurochiro.co or reply to your confirmation email.
          </p>
        </div>
      </div>
    </div>
  );
}
