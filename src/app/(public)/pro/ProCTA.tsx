"use client";

import { useSearchParams } from "next/navigation";
import { useProCountry } from "./ProCountryContext";
import { CURRENCY_RATES, USD_MONTHLY, USD_ANNUAL } from "./currency-config";

const STRIPE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || "";
const STRIPE_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL || "";
const FIT_CALL_LINK = process.env.NEXT_PUBLIC_FIT_CALL_LINK || "";

function buildLink(base: string, source: string) {
  if (!base) return "#";
  return `${base}${base.includes("?") ? "&" : "?"}client_reference_id=pro_${source}`;
}

export default function ProCTA({ variant }: { variant: "hero" | "close" | "mid" }) {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "direct";
  const { country } = useProCountry();

  const monthlyLink = buildLink(STRIPE_MONTHLY, source);
  const annualLink = buildLink(STRIPE_ANNUAL, source);
  const fitCallLink = FIT_CALL_LINK || "#";

  const isIntl = country !== "US" && country in CURRENCY_RATES;
  const usdSuffix = isIntl ? " USD" : "";

  if (variant === "hero") {
    return (
      <div style={{ marginTop: 30 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <a
            href={monthlyLink}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: 6,
              background: "#D66829",
              color: "#fff",
              border: "2px solid #D66829",
              display: "inline-block",
              textAlign: "center",
              flex: "1 1 auto",
              minWidth: 180,
            }}
          >
            Join for ${USD_MONTHLY}{usdSuffix}/month
          </a>
          <a
            href={fitCallLink}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: 6,
              background: "transparent",
              color: "#F1EDE7",
              border: "2px solid #F1EDE7",
              display: "inline-block",
              textAlign: "center",
              flex: "1 1 auto",
              minWidth: 180,
            }}
          >
            Book a Fit Call
          </a>
        </div>
        <p style={{ fontSize: 14, color: "#93A0AC", margin: "10px 0 0" }}>
          Fifteen minutes. I&rsquo;ll pull up your city and show you exactly who&rsquo;s asking.
        </p>
      </div>
    );
  }

  if (variant === "mid") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <a
          href={monthlyLink}
          style={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
            padding: "14px 22px",
            borderRadius: 6,
            background: "#D66829",
            color: "#fff",
            border: "2px solid #D66829",
            flex: "1 1 auto",
            textAlign: "center",
          }}
        >
          Join for ${USD_MONTHLY}{usdSuffix}/month
        </a>
        <a
          href={fitCallLink}
          style={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
            padding: "14px 22px",
            borderRadius: 6,
            background: "transparent",
            color: "#F1EDE7",
            border: "2px solid #F1EDE7",
            flex: "1 1 auto",
            textAlign: "center",
          }}
        >
          Book a Fit Call
        </a>
      </div>
    );
  }

  // Close variant — two clear paths
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
        {/* Path 1: Ready */}
        <div style={{ flex: "1 1 280px" }}>
          <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16, color: "#F1EDE7", margin: "0 0 10px" }}>Ready to join</p>
          <a
            href={monthlyLink}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: 6,
              background: "#D66829",
              color: "#fff",
              border: "2px solid #D66829",
              display: "block",
              textAlign: "center",
            }}
          >
            Join for ${USD_MONTHLY}{usdSuffix}/month
          </a>
          <a
            href={annualLink}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: "#93A0AC",
              textDecoration: "none",
              display: "block",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            or ${USD_ANNUAL.toLocaleString()}{usdSuffix}/year (two months free)
          </a>
        </div>

        {/* Path 2: Questions */}
        <div style={{ flex: "1 1 280px" }}>
          <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16, color: "#F1EDE7", margin: "0 0 10px" }}>Have questions</p>
          <a
            href={fitCallLink}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              padding: "14px 22px",
              borderRadius: 6,
              background: "transparent",
              color: "#F1EDE7",
              border: "2px solid #F1EDE7",
              display: "block",
              textAlign: "center",
            }}
          >
            Book a Fit Call
          </a>
          <p style={{ fontSize: 14, color: "#93A0AC", margin: "8px 0 0", textAlign: "center" }}>
            Fifteen minutes. No pitch.
          </p>
        </div>
      </div>
    </>
  );
}
