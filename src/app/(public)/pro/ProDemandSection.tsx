"use client";

import ProDemandMap from "./ProDemandMap";
import ProDemandLookup from "./ProDemandLookup";
import { useProCountry } from "./ProCountryContext";
import type { MapDoctor, MapDemandCity } from "./actions";

export default function ProDemandSection({
  allDoctors,
  allDemandCities,
}: {
  allDoctors: MapDoctor[];
  allDemandCities: MapDemandCity[];
}) {
  const { country, setCountry } = useProCountry();

  const doctors = allDoctors.filter((d) => d.country === country);
  const demandCities = allDemandCities.filter((d) => d.country === country);

  const demandCount = demandCities.reduce((sum, d) => sum + d.count, 0);
  const doctorCount = doctors.length;

  return (
    <>
      {/* ═══ MAP ═══ */}
      <section>
        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px 12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <p style={{ fontFamily: "Archivo, sans-serif", fontSize: 13, letterSpacing: "0.06em", color: "#D66829", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>
              Here&rsquo;s where they are
            </p>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                fontFamily: "Archivo, sans-serif",
                fontSize: 13,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #2A3B49",
                background: "#1A2833",
                color: "#93A0AC",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="US">🇺🇸 United States</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="GB">🇬🇧 United Kingdom</option>
              <option value="NZ">🇳🇿 New Zealand</option>
              <option value="AU">🇦🇺 Australia</option>
            </select>
          </div>
          {/* Country stats bar */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#93A0AC", marginBottom: 4 }}>
            <span>
              <span style={{ color: "#06b6d4", fontWeight: 700 }}>{demandCount}</span>{" "}
              {demandCount === 1 ? "person looking" : "people looking"}
            </span>
            <span>
              <span style={{ color: "#D66829", fontWeight: 700 }}>{doctorCount}</span>{" "}
              {doctorCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>
        <ProDemandMap
          doctors={doctors}
          demandCities={demandCities}
          country={country}
        />
      </section>

      {/* ═══ DEMAND LOOKUP ═══ */}
      <ProDemandLookup country={country} onCountryChange={setCountry} />
    </>
  );
}
