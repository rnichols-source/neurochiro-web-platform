import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Doctor not found | NeuroChiro",
};

export default function DoctorNotFound() {
  return (
    <div style={{ minHeight: "70vh", background: "#F5F3EF", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D66829", marginBottom: 12 }}>NeuroChiro</p>
        <h1 style={{ fontFamily: "Lato, sans-serif", fontSize: 36, fontWeight: 900, color: "#1E2D3B", lineHeight: 1.15 }}>Doctor not found</h1>
        <p style={{ color: "#718096", marginTop: 12, lineHeight: 1.6, fontSize: 15 }}>
          That link does not match a doctor in the directory. The profile may have moved, or the address was typed wrong.
        </p>
        <Link href="/directory" style={{ display: "inline-block", marginTop: 24, background: "#D66829", color: "white", fontWeight: 800, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>
          Browse the directory
        </Link>
      </div>
    </div>
  );
}
