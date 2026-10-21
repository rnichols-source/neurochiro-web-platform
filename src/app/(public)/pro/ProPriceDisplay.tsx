"use client";

import { useProCountry } from "./ProCountryContext";
import { COUNTRY_PAGES } from "@/lib/country-pages";
import Link from "next/link";

const USD_MONTHLY = 99;
const ANNUAL_TOTAL = USD_MONTHLY * 12; // $1,188

/**
 * Hero arithmetic block — prices react to country selector.
 *
 * If the visitor's country has a native-currency price in country-pages.ts,
 * show that price and link them to their country page. No conversion estimate.
 *
 * If they are on /pro and we are charging USD, say "USD" plainly.
 */
export function HeroMathBlock() {
  const { country } = useProCountry();
  const nativeConfig = COUNTRY_PAGES[country];

  // Country has its own page with native pricing — redirect them
  if (nativeConfig) {
    const slug = country === 'GB' ? 'uk' : country.toLowerCase();
    return (
      <div style={{ margin: "40px 0 8px" }}>
        <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", color: "#D66829" }}>
              {nativeConfig.symbol}{nativeConfig.price}
            </div>
            <span style={{ color: "#93A0AC", fontSize: 16 }}>per month in {nativeConfig.currency}</span>
          </div>
          <p style={{ fontSize: 15, color: "#93A0AC", margin: "8px 0 0" }}>
            Billed in {nativeConfig.currency}. No currency conversion.
          </p>
        </div>
        <div style={{ marginTop: 16 }}>
          <Link
            href={`/${slug}`}
            style={{
              display: "inline-block",
              background: "#D66829",
              color: "#F0EBDD",
              fontWeight: 700,
              fontSize: 16,
              padding: "14px 28px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Go to the {nativeConfig.demonym} page →
          </Link>
        </div>
      </div>
    );
  }

  // US or unknown country — show USD plainly
  return (
    <div style={{ margin: "40px 0 8px" }}>
      <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>
            ${USD_MONTHLY} USD
          </div>
          <span style={{ color: "#93A0AC", fontSize: 16 }}>per month, cancel anytime</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>
          ${ANNUAL_TOTAL.toLocaleString()} USD
        </div>
        <span style={{ color: "#93A0AC", fontSize: 16 }}>what a full year costs you</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0" }}>
        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)", color: "#D66829" }}>1</div>
        <span style={{ color: "#93A0AC", fontSize: 16 }}>new patient who starts care, in most practices, covers it</span>
      </div>
    </div>
  );
}

/**
 * Inline price reference — "$1,188 USD" always. No conversion estimates.
 */
export function PriceRef({ amount }: { amount: number }) {
  return <>${amount.toLocaleString()} USD</>;
}
