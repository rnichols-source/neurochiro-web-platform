"use client";

import { useSearchParams } from "next/navigation";
import { useProCountry } from "./ProCountryContext";
import { CURRENCY_RATES, convertToLocal, USD_MONTHLY, USD_ANNUAL } from "./currency-config";

const STRIPE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || "";
const STRIPE_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL || "";
const FIT_CALL_LINK = process.env.NEXT_PUBLIC_FIT_CALL_LINK || "";

function buildLink(base: string, source: string) {
  if (!base) return "#";
  return `${base}${base.includes("?") ? "&" : "?"}client_reference_id=pro_${source}`;
}

export default function ProCTA({ variant }: { variant: "hero" | "close" }) {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "direct";
  const { country } = useProCountry();

  const monthlyLink = buildLink(STRIPE_MONTHLY, source);
  const annualLink = buildLink(STRIPE_ANNUAL, source);
  const fitCallLink = FIT_CALL_LINK || "#";

  const isIntl = country !== "US" && country in CURRENCY_RATES;
  const usdSuffix = isIntl ? " USD" : "";
  const conversionLine = isIntl
    ? `about ${convertToLocal(USD_MONTHLY, country)}/month, billed in US dollars`
    : null;

  const btnStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
    fontFamily: "Archivo, sans-serif",
    fontWeight: 700,
    fontSize: 16,
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: 6,
    background: bg,
    color,
    border: `2px solid ${border}`,
    display: "inline-block",
    textAlign: "center",
    flex: "1 1 auto",
    minWidth: variant === "hero" ? 180 : 140,
  });

  if (variant === "hero") {
    return (
      <div style={{ marginTop: 30 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <a href={monthlyLink} style={btnStyle("#D66829", "#D66829", "#fff")}>
            Join for ${USD_MONTHLY}{usdSuffix}/month
          </a>
          <a href={fitCallLink} style={btnStyle("transparent", "rgba(255,255,255,.35)", "#F1EDE7")}>
            Talk to me first
          </a>
        </div>
        {conversionLine && (
          <p style={{ fontSize: 13, color: "#93A0AC", margin: "10px 0 0" }}>
            {conversionLine}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, color: "#F1EDE7", marginBottom: 6 }}>
        ${USD_MONTHLY}{usdSuffix}/month &nbsp;&middot;&nbsp; or ${USD_ANNUAL.toLocaleString()}{usdSuffix}/year, two months free
      </div>
      {conversionLine && (
        <p style={{ fontSize: 13, color: "#93A0AC", margin: "4px 0 12px" }}>
          {conversionLine}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: conversionLine ? 8 : 20 }}>
        <a href={monthlyLink} style={btnStyle("#D66829", "#D66829", "#fff")}>Join monthly</a>
        <a href={annualLink} style={btnStyle("#D66829", "#D66829", "#fff")}>Join annual</a>
        <a href={fitCallLink} style={btnStyle("transparent", "rgba(255,255,255,.35)", "#F1EDE7")}>Book a Fit Call</a>
      </div>
    </>
  );
}
