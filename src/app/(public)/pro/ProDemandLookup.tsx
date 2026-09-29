"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { checkDemandNearby, type DemandNearbyResult } from "./actions";
import { useProCountry } from "./ProCountryContext";
import { CURRENCY_RATES, USD_MONTHLY } from "./currency-config";

const PLACEHOLDERS: Record<string, string> = {
  US: "29651 or Greenville, SC",
  CA: "V5K 1A1 or Vancouver, BC",
  GB: "SW1A 1AA or Manchester",
  NZ: "1010 or Auckland",
  AU: "3000 or Melbourne, VIC",
};

const STRIPE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || "";
const FIT_CALL_LINK = process.env.NEXT_PUBLIC_FIT_CALL_LINK || "";

function buildLink(base: string, source: string) {
  if (!base) return "#";
  return `${base}${base.includes("?") ? "&" : "?"}client_reference_id=pro_${source}`;
}

export default function ProDemandLookup() {
  const { country, setCountry } = useProCountry();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "direct";
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemandNearbyResult | null>(null);

  const isIntl = country !== "US" && country in CURRENCY_RATES;
  const usdSuffix = isIntl ? " USD" : "";

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await checkDemandNearby(q, country);
      setResult(r);
    } catch {
      setResult({ cityLabel: "", hasDemand: false, mentionsNearby: null, subscribersNearby: null, doctorsNearby: 0, error: "Something went wrong. Try again." });
    }
    setLoading(false);
  };

  const handlePickAmbiguous = (city: string, state: string) => {
    const q = `${city}, ${state}`;
    setQuery(q);
    setResult(null);
    handleSearch(q);
  };

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setResult(null);
  };

  const monthlyLink = buildLink(STRIPE_MONTHLY, source);
  const fitCallLink = FIT_CALL_LINK || "#";

  const resultButtons = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
      <a
        href={monthlyLink}
        style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
          padding: "12px 20px",
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
          fontSize: 15,
          textDecoration: "none",
          padding: "12px 20px",
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

  return (
    <section style={{ padding: "52px 0 48px", borderTop: "1px solid #2A3B49" }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#F1EDE7" }}>
          Is there demand where you practice?
        </h2>
        <p style={{ color: "#93A0AC", fontSize: 17, margin: "0 0 24px" }}>
          Enter your city or postal code to see how many people in your area are looking for a nervous system chiropractor.
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder={PLACEHOLDERS[country] || "City or postal code"}
            style={{
              flex: 1,
              fontFamily: "Archivo, sans-serif",
              fontSize: 17,
              padding: "16px 18px",
              borderRadius: 8,
              border: "2px solid #2A3B49",
              background: "#1A2833",
              color: "#F1EDE7",
              outline: "none",
            }}
          />
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontSize: 14,
              padding: "16px 8px",
              borderRadius: 8,
              border: "2px solid #2A3B49",
              background: "#1A2833",
              color: "#93A0AC",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="US">🇺🇸 US</option>
            <option value="CA">🇨🇦 CA</option>
            <option value="GB">🇬🇧 UK</option>
            <option value="NZ">🇳🇿 NZ</option>
            <option value="AU">🇦🇺 AU</option>
          </select>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              padding: "16px 24px",
              borderRadius: 8,
              border: "none",
              background: "#D66829",
              color: "#fff",
              cursor: loading ? "wait" : "pointer",
              opacity: loading || !query.trim() ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "..." : "See who's looking"}
          </button>
        </div>

        {/* Ambiguous options */}
        {result?.ambiguous && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <p style={{ width: "100%", color: "#93A0AC", fontSize: 14, margin: "0 0 4px" }}>
              Which one?
            </p>
            {result.ambiguous.map((opt, i) => (
              <button
                key={i}
                onClick={() => handlePickAmbiguous(opt.city, opt.state)}
                style={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "2px solid #2A3B49",
                  background: "#1A2833",
                  color: "#F1EDE7",
                  cursor: "pointer",
                }}
              >
                {opt.city}, {opt.state}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div style={{ marginTop: 20, background: "#1A2833", border: "1px solid #f43f5e40", borderRadius: 10, padding: 24 }}>
            <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, color: "#f43f5e", margin: "0 0 6px" }}>
              Couldn&rsquo;t find that location
            </p>
            <p style={{ fontSize: 14, color: "#93A0AC", margin: 0 }}>{result.error}</p>
          </div>
        )}

        {/* Results */}
        {result && !result.ambiguous && !result.error && (
          <div style={{ marginTop: 20, background: "#1A2833", border: "1px solid #2A3B49", borderRadius: 10, padding: 24 }}>
            <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 18, color: "#F1EDE7", margin: "0 0 8px" }}>
              {result.cityLabel}
            </p>

            {/* Case (a): demand nearby, show count */}
            {result.hasDemand && result.mentionsNearby !== null ? (
              <>
                <p style={{ fontSize: 16, color: "#06b6d4", fontWeight: 700, margin: "0 0 6px" }}>
                  {(result.mentionsNearby! + (result.subscribersNearby || 0))} people in this area are looking for a nervous system chiropractor.
                </p>
                {result.mentionsNearby! > 0 && (result.subscribersNearby || 0) > 0 ? (
                  <p style={{ fontSize: 14, color: "#93A0AC", margin: "0 0 4px" }}>
                    {result.mentionsNearby} asked in comments. {result.subscribersNearby} joined the waitlist.
                  </p>
                ) : null}
                {result.doctorsNearby > 0 ? (
                  <p style={{ fontSize: 14, color: "#93A0AC", margin: "4px 0 0" }}>
                    {result.doctorsNearby} {result.doctorsNearby === 1 ? "member practices" : "members practice"} within 50 miles.
                  </p>
                ) : (
                  <p style={{ fontSize: 15, color: "#D66829", fontWeight: 700, margin: "4px 0 0" }}>
                    You&rsquo;d be the first doctor I could send these people to.
                  </p>
                )}
              </>
            ) : result.hasDemand ? (
              /* Suppressed count */
              <>
                <p style={{ fontSize: 16, color: "#06b6d4", fontWeight: 700, margin: "0 0 6px" }}>
                  There is demand in your area.
                </p>
                {result.doctorsNearby > 0 ? (
                  <p style={{ fontSize: 14, color: "#93A0AC", margin: "4px 0 0" }}>
                    {result.doctorsNearby} {result.doctorsNearby === 1 ? "member practices" : "members practice"} within 50 miles.
                  </p>
                ) : (
                  <p style={{ fontSize: 15, color: "#D66829", fontWeight: 700, margin: "4px 0 0" }}>
                    You&rsquo;d be the first doctor I could send these people to.
                  </p>
                )}
              </>
            ) : (
              /* No demand */
              <div>
                <p style={{ fontSize: 15, color: "#93A0AC", lineHeight: 1.6, margin: "0 0 12px" }}>
                  I haven&rsquo;t had anyone ask me for a chiropractor in {result.cityLabel} yet. Most of my audience is in the US, and that&rsquo;s where the requests come from today.
                </p>
                <p style={{ fontSize: 15, color: "#A5B0BB", lineHeight: 1.6, margin: 0 }}>
                  Here&rsquo;s what you&rsquo;d get anyway: two interviews cut into 80-100 clips posted for you across IG, TikTok and YouTube for a year, in front of an audience of 185K. A verified profile patients can find and book from. And you&rsquo;d be the doctor I point to first when someone in your area does ask.
                </p>
              </div>
            )}

            {/* CTA buttons inside every result */}
            {resultButtons}
          </div>
        )}

        <p style={{ fontSize: 12, color: "#5A6873", marginTop: 12 }}>
          Demand signals include waitlist subscribers and comment requests. Counts below 3 are not shown.
        </p>
      </div>
    </section>
  );
}
