"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Search, Target, Loader2 } from "lucide-react"
import { useRegion } from "@/context/RegionContext"

export default function HeroSearch() {
  const router = useRouter()
  const { region } = useRegion()
  const [location, setLocation] = useState("")
  const [name, setName] = useState("")
  const [locating, setLocating] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location.trim()) params.set("location", location.trim())
    if (name.trim()) params.set("q", name.trim())
    // Pass region so the directory picks up the correct country context
    if (region.code !== "US") params.set("region", region.code)
    router.push(`/directory?${params.toString()}`)
  }

  const handleNearMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          )
          const data = await res.json()
          const city = data.city || data.locality || ""
          const state = data.principalSubdivisionCode?.replace("US-", "") || ""
          setLocation(state ? `${city}, ${state}` : city)
        } catch {
          setLocation("Current Location")
        }
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 5000 }
    )
  }

  const placeholder = region.code === "CA"
    ? "Postal code or city..."
    : region.code === "UK"
    ? "Postcode or city..."
    : region.code === "NZ"
    ? "Postcode or city..."
    : "ZIP code or city..."

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-3">
      {/* Primary: location */}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neuro-orange" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-bold placeholder:text-gray-500 focus:outline-none focus:border-neuro-orange text-[16px]"
          aria-label={`Search by ${region.terminology.postalCode.toLowerCase()} or city`}
        />
        {location ? (
          <button
            type="button"
            onClick={() => setLocation("")}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 px-2"
            aria-label="Clear location"
          >
            &times;
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 text-neuro-orange text-xs font-bold rounded-lg hover:bg-neuro-orange/10 transition-colors flex items-center gap-1 min-h-[44px]"
          aria-label="Use my current location"
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Near me</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary: doctor/clinic name (visually smaller) */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Doctor name, clinic, or specialty..."
          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm placeholder:text-white/25 focus:outline-none focus:border-white/20"
          aria-label="Search by doctor name, clinic, or specialty"
        />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors min-h-[48px]"
      >
        Find a Doctor
      </button>
    </form>
  )
}
