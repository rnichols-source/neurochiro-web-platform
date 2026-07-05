import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase-server";

export const metadata = {
  title: "Find Nervous System Chiropractors by City | NeuroChiro",
  description: "Browse nervous system chiropractors by city and state. Find verified specialists near you in the NeuroChiro directory.",
};

async function getCitiesWithDoctors() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("doctors")
    .select("city, state")
    .eq("verification_status", "verified")
    .not("city", "is", null)
    .not("state", "is", null)
    .neq("city", "")
    .neq("state", "");

  if (!data) return {};

  // Group by state
  const stateMap: Record<string, { cities: Set<string>; count: number }> = {};
  for (const doc of data) {
    const state = doc.state;
    if (!stateMap[state]) stateMap[state] = { cities: new Set(), count: 0 };
    stateMap[state].cities.add(doc.city);
    stateMap[state].count++;
  }

  return stateMap;
}

export default async function CityIndexPage() {
  const stateMap = await getCitiesWithDoctors();
  const states = Object.entries(stateMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="min-h-dvh bg-neuro-cream">
      <div className="bg-neuro-navy py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-heading font-black text-white">Find a Nervous System Chiropractor Near You</h1>
          <p className="text-white/50 mt-3">Browse by state and city. Every doctor is verified.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {states.map(([state, info]) => {
            const stateSlug = state.toLowerCase().replace(/ /g, "-");
            const cities = Array.from(info.cities).sort();
            return (
              <div key={state} className="bg-white rounded-2xl border border-gray-100 p-5">
                <Link href={`/directory/city/${stateSlug}`} className="flex items-center justify-between mb-3 group">
                  <h2 className="font-heading font-black text-neuro-navy group-hover:text-neuro-orange transition-colors">{state}</h2>
                  <span className="text-xs font-bold text-gray-400">{info.count} doctors</span>
                </Link>
                <div className="space-y-1">
                  {cities.slice(0, 6).map(city => {
                    const citySlug = city.toLowerCase().replace(/ /g, "-");
                    return (
                      <Link key={city} href={`/directory/city/${citySlug}-${stateSlug}`}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-neuro-orange transition-colors py-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {city}
                      </Link>
                    );
                  })}
                  {cities.length > 6 && (
                    <Link href={`/directory/city/${stateSlug}`} className="text-xs text-neuro-orange font-bold hover:underline mt-2 inline-block">
                      View all {cities.length} cities <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
