"use client";

import { useProCountry } from "./ProCountryContext";
import { CURRENCY_RATES, convertToLocal, USD_MONTHLY, USD_ANNUAL } from "./currency-config";

const ANNUAL_TOTAL = USD_MONTHLY * 12; // $1,188

/**
 * Hero arithmetic block — prices react to country selector.
 * For US: bare dollar amounts, no suffix.
 * For international: adds "USD" label + conversion note below.
 */
export function HeroMathBlock() {
  const { country } = useProCountry();
  const isIntl = country !== "US" && country in CURRENCY_RATES;
  const usdSuffix = isIntl ? " USD" : "";

  const conversionLine = isIntl
    ? `about ${convertToLocal(USD_MONTHLY, country)}/month, billed in US dollars`
    : null;

  return (
    <div style={{ margin: "40px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>
          ${USD_MONTHLY}{usdSuffix}
        </div>
        <span style={{ color: "#93A0AC", fontSize: 16 }}>per month, cancel anytime</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>
          ${ANNUAL_TOTAL.toLocaleString()}{usdSuffix}
        </div>
        <span style={{ color: "#93A0AC", fontSize: 16 }}>what a full year costs you</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0" }}>
        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)", color: "#D66829" }}>1</div>
        <span style={{ color: "#93A0AC", fontSize: 16 }}>new patient who starts care, in most practices, covers it</span>
      </div>
      {conversionLine && (
        <p style={{ fontSize: 13, color: "#93A0AC", margin: "10px 0 0" }}>
          {conversionLine}
        </p>
      )}
    </div>
  );
}

/**
 * Inline price reference — "$1,188" or "$1,188 USD" depending on country.
 * Used in prose where the number appears mid-sentence.
 */
export function PriceRef({ amount }: { amount: number }) {
  const { country } = useProCountry();
  const isIntl = country !== "US" && country in CURRENCY_RATES;
  return <>${amount.toLocaleString()}{isIntl ? " USD" : ""}</>;
}
