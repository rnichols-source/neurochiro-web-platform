"use client";

import { useState } from "react";

export default function ProFAQ({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px", color: "#F1EDE7" }}>Questions doctors ask me</h2>
        {faqs.map((faq, i) => (
          <div key={i} style={{ borderBottom: "1px solid #2A3B49", padding: "16px 0", borderTop: i === 0 ? "1px solid #2A3B49" : "none" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 17, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 16, width: "100%", background: "none", border: "none", color: "#F1EDE7", textAlign: "left", padding: 0 }}
            >
              {faq.q}
              <span style={{ color: "#D66829", fontWeight: 700, flexShrink: 0 }}>{openFaq === i ? "\u2013" : "+"}</span>
            </button>
            {openFaq === i && (
              <p style={{ color: "#A5B0BB", fontSize: 16, margin: "12px 0 0" }}>{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
