"use client"

import { useState } from "react"
import { InvisibleDoctor, geocodeDoctorFromAdmin, updateDoctorCoordinates } from "./actions"
import { MapPin, AlertTriangle, RefreshCw, Check, X } from "lucide-react"

const REASON_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  no_address: { label: "No Address", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  geocode_failed: { label: "Geocode Failed", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  zero_coords: { label: "Zero Coordinates", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
}

export default function InvisibleDoctorsClient({ doctors }: { doctors: InvisibleDoctor[] }) {
  const [items, setItems] = useState(doctors)
  const [geocoding, setGeocoding] = useState<string | null>(null)
  const [message, setMessage] = useState<{ id: string; text: string; type: "success" | "error" } | null>(null)

  const verified = items.filter(d => d.verification_status === "verified")
  const pending = items.filter(d => d.verification_status === "pending")
  const noAddress = items.filter(d => d.reason === "no_address")
  const geocodeFailed = items.filter(d => d.reason === "geocode_failed")

  async function handleGeocode(doctorId: string) {
    setGeocoding(doctorId)
    setMessage(null)
    try {
      const result = await geocodeDoctorFromAdmin(doctorId)
      if (result.success) {
        setMessage({ id: doctorId, text: `Geocoded via ${result.method}: ${result.lat?.toFixed(4)}, ${result.lng?.toFixed(4)}`, type: "success" })
        setItems(prev => prev.filter(d => d.id !== doctorId))
      } else {
        setMessage({ id: doctorId, text: result.error || "Unknown error", type: "error" })
      }
    } catch (e: any) {
      setMessage({ id: doctorId, text: e.message, type: "error" })
    }
    setGeocoding(null)
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Invisible" value={items.length} color="text-red-400" />
        <SummaryCard label="Verified (Paying)" value={verified.length} color="text-amber-400" />
        <SummaryCard label="No Address" value={noAddress.length} color="text-red-400" />
        <SummaryCard label="Geocode Failed" value={geocodeFailed.length} color="text-amber-400" />
      </div>

      {/* Verified doctors first — they're paying and invisible */}
      {verified.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Verified Doctors (Paying, Invisible)
          </h2>
          <div className="space-y-2">
            {verified.map(d => (
              <DoctorRow
                key={d.id}
                doctor={d}
                geocoding={geocoding === d.id}
                message={message?.id === d.id ? message : null}
                onGeocode={() => handleGeocode(d.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pending doctors */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-400 mb-3">
            Pending Doctors (Hidden, Not Active)
          </h2>
          <div className="space-y-2">
            {pending.map(d => (
              <DoctorRow
                key={d.id}
                doctor={d}
                geocoding={geocoding === d.id}
                message={message?.id === d.id ? message : null}
                onGeocode={() => handleGeocode(d.id)}
              />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
          <p className="text-lg font-bold text-emerald-400">All doctors have valid coordinates</p>
          <p className="text-sm mt-1">Every doctor in the directory is visible to location search.</p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function DoctorRow({
  doctor,
  geocoding,
  message,
  onGeocode,
}: {
  doctor: InvisibleDoctor
  geocoding: boolean
  message: { text: string; type: "success" | "error" } | null
  onGeocode: () => void
}) {
  const reason = REASON_LABELS[doctor.reason]
  const name = [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") || doctor.clinic_name || "Unknown"
  const location = [doctor.city, doctor.state].filter(Boolean).join(", ")

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white">{name}</span>
          {doctor.clinic_name && doctor.first_name && (
            <span className="text-gray-500 text-sm">{doctor.clinic_name}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${reason.bg} ${reason.color}`}>
            {reason.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
            {doctor.verification_status}
          </span>
        </div>
        <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {doctor.address ? (
            <span>{doctor.address}, {location}</span>
          ) : (
            <span className="text-red-400/70">No address on file, {location}</span>
          )}
        </div>
        {message && (
          <p className={`text-xs mt-1 ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {doctor.address && (
          <button
            onClick={onGeocode}
            disabled={geocoding}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neuro-orange/20 text-neuro-orange rounded-lg text-sm font-medium hover:bg-neuro-orange/30 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${geocoding ? "animate-spin" : ""}`} />
            {geocoding ? "Geocoding..." : "Retry Geocode"}
          </button>
        )}
        <a
          href={`/admin/directory?search=${encodeURIComponent(name)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
        >
          Edit
        </a>
      </div>
    </div>
  )
}
