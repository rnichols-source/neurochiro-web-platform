"use client";

import { useState } from "react";
import { checkDemandNearby, type DemandNearbyResult } from "./actions";

const PLACEHOLDERS: Record<string, string> = {
  US: "29651 or Greenville, SC",
  CA: "V5K 1A1 or Vancouver, BC",
  GB: "SW1A 1AA or Manchester",
  NZ: "1010 or Auckland",
  AU: "3000 or Melbourne, VIC",
};

export default function ProDemandLookup() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemandNearbyResult | null>(null);

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

  return (
    <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", color: "#F1EDE7" }}>
          Is there demand where you practice?
        </h2>
        <p style={{ color: "#93A0AC", fontSize: 16, margin: "0 0 22px" }}>
          Enter your city or postal code to see how many people in your area are looking.
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
              fontSize: 16,
              padding: "14px 16px",
              borderRadius: 8,
              border: "2px solid #2A3B49",
              background: "#1A2833",
              color: "#F1EDE7",
              outline: "none",
            }}
          />
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setResult(null); }}
            style={{
              fontFamily: "Archivo, sans-serif",
              fontSize: 14,
              padding: "14px 8px",
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
              padding: "14px 24px",
              borderRadius: 8,
              border: "none",
              background: "#D66829",
              color: "#fff",
              cursor: loading ? "wait" : "pointer",
              opacity: loading || !query.trim() ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "..." : "Check"}
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

        {/* Error — distinct from "no demand" */}
        {result?.error && (
          <div style={{ marginTop: 20, background: "#1A2833", border: "1px solid #f43f5e40", borderRadius: 10, padding: 24 }}>
            <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, color: "#f43f5e", margin: "0 0 6px" }}>
              Couldn't find that location
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
                  <p style={{ fontSize: 14, color: "#93A0AC", margin: "0 0 12px" }}>
                    {result.mentionsNearby} asked in comments. {result.subscribersNearby} joined the waitlist.
                  </p>
                ) : null}
              </>
            ) : result.hasDemand ? (
              /* Case (a) with suppression: demand exists but count < 3 */
              <p style={{ fontSize: 16, color: "#06b6d4", fontWeight: 700, margin: "0 0 12px" }}>
                There is demand in your area.
              </p>
            ) : (
              /* Case (c): no demand recorded */
              <div>
                <p style={{ fontSize: 15, color: "#93A0AC", lineHeight: 1.6, margin: "0 0 16px" }}>
                  I haven't had anyone ask me for a chiropractor in {result.cityLabel} yet. Most of my audience is in the US, and that's where the requests come from today.
                </p>
                <p style={{ fontSize: 15, color: "#A5B0BB", lineHeight: 1.6, margin: 0 }}>
                  Here's what you'd get anyway: two interviews cut into 80–100 clips posted for you across IG, TikTok and YouTube for a year, in front of an audience of 185K. A verified profile patients can find and book from. And you'd be the doctor I point to first when someone in your area does ask.
                </p>
              </div>
            )}

            {/* Doctor count — always shown when demand exists */}
            {(result.hasDemand) && (
              result.doctorsNearby > 0 ? (
                <p style={{ fontSize: 14, color: "#93A0AC", margin: "12px 0 0" }}>
                  {result.doctorsNearby} NeuroChiro {result.doctorsNearby === 1 ? "member practices" : "members practice"} within 50 miles.
                </p>
              ) : (
                <p style={{ fontSize: 14, color: "#D66829", fontWeight: 700, margin: "12px 0 0" }}>
                  No NeuroChiro member listed here yet. You'd be the first.
                </p>
              )
            )}
          </div>
        )}

        <p style={{ fontSize: 12, color: "#5A6873", marginTop: 12 }}>
          Demand signals include waitlist subscribers and comment requests. Counts below 3 are not shown.
        </p>
      </div>
    </section>
  );
}
