"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import DoctorCard from "@/components/directory/DoctorCard";
import type { DirectoryDoctor } from "@/components/directory/useDirectorySearch";
import { formatDistance } from "@/lib/geo";

type NearbyPayload = {
  city: string | null;
  regionCode: string | null;
  countryCode: string | null;
  unit?: "mi" | "km";
  doctors: DirectoryDoctor[];
  nearest?: DirectoryDoctor | null;
  source?: string;
};

const inflight = new Map<string, Promise<NearbyPayload>>();

function loadNearby(search: string) {
  const cached = inflight.get(search);
  if (cached) return cached;
  const pending = fetch(`/api/home/nearby${search}`)
    .then((response) => {
      if (!response.ok) throw new Error("nearby failed");
      return response.json() as Promise<NearbyPayload>;
    })
    .catch((error) => {
      inflight.delete(search);
      throw error;
    });
  inflight.set(search, pending);
  return pending;
}

function storedSearch() {
  try {
    const params = new URLSearchParams();
    const lat = localStorage.getItem("nc_user_lat");
    const lng = localStorage.getItem("nc_user_lng");
    const city = localStorage.getItem("nc_last_location");
    if (lat && lng) {
      params.set("lat", lat);
      params.set("lng", lng);
    }
    if (city) params.set("city", city);
    const query = params.toString();
    return query ? `?${query}` : "";
  } catch {
    return "";
  }
}

function doctorName(doctor: DirectoryDoctor) {
  return `Dr. ${doctor.first_name || ""} ${doctor.last_name || ""}`.replace(/^Dr\.\s+Dr\./i, "Dr.").trim();
}

function placeOf(doctor: DirectoryDoctor) {
  return [doctor.city, doctor.state].filter(Boolean).join(", ");
}

function PreviewCard({ doctor, unit }: { doctor: DirectoryDoctor; unit: "mi" | "km" }) {
  const name = doctorName(doctor);
  return (
    <article className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
      {doctor.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doctor.photo_url} alt={name} width={48} height={48} sizes="48px" className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-neuro-navy text-sm font-bold text-white" aria-hidden>
          {name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-neuro-navy">{name}</p>
        <p className="truncate text-sm text-gray-500">
          {doctor.distance_miles != null ? `${formatDistance(doctor.distance_miles, unit)} · ` : ""}
          {placeOf(doctor)}
        </p>
        <Link href={`/directory/${doctor.slug || doctor.id}#appointment-form`} className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">
          Request appointment
        </Link>
      </div>
    </article>
  );
}

export default function NearbyDoctors() {
  const [data, setData] = useState<NearbyPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const slot = useSyncExternalStore(
    () => () => {},
    () => document.getElementById("home-nearby-preview"),
    () => null,
  );

  useEffect(() => {
    let cancelled = false;
    loadNearby(storedSearch())
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data?.city) return;
    document.getElementById("home-nearby-fallback")?.setAttribute("hidden", "true");
  }, [data]);

  const unit = data?.unit === "km" ? "km" : "mi";
  const city = data?.city || null;
  const doctors = data?.doctors || [];
  const nearest = data?.nearest || null;
  const country = data?.regionCode || data?.countryCode || "US";
  const showEmpty = !!city && doctors.length === 0 && !failed;
  const directoryHref = city
    ? `/directory?location=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`
    : `/directory?country=${encodeURIComponent(country)}`;

  const preview = slot && city && doctors.length > 0
    ? createPortal(
        <div className="rounded-2xl bg-white p-4 text-neuro-navy shadow-xl">
          <h2 className="mb-3 text-lg font-heading font-black text-neuro-navy">Doctors near {city}</h2>
          <div className="space-y-3">
            {doctors.slice(0, 2).map((doctor) => (
              <PreviewCard key={doctor.id} doctor={doctor} unit={unit} />
            ))}
          </div>
        </div>,
        slot,
      )
    : null;

  return (
    <section className="bg-neuro-cream px-4 py-12 sm:px-6" aria-busy={!data && !failed}>
      {preview}
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-heading font-black text-neuro-navy">
            {city ? `Doctors near ${city}` : "Featured doctors"}
          </h2>
          <a href="#hero-location" className="inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">
            {city ? "Change" : "Set your location"}
          </a>
        </div>

        {!data && !failed && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="min-h-[180px] animate-pulse rounded-2xl border border-gray-100 bg-white p-4 motion-reduce:animate-none">
                <div className="flex gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-1/3 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="mt-4 h-11 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {showEmpty && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="text-[15px] leading-relaxed text-neuro-navy">
              {nearest
                ? `No NeuroChiro doctor near ${city} yet. The closest is ${doctorName(nearest)} in ${placeOf(nearest)}${
                    nearest.distance_miles != null ? ` (${formatDistance(nearest.distance_miles, unit)})` : ""
                  }.`
                : `No NeuroChiro doctor near ${city} yet.`}
            </p>
            <Link
              href={`/list?source=homepage_nearby&city=${encodeURIComponent(city || "")}`}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-neuro-orange-ink px-5 text-sm font-bold text-white"
            >
              Join the patient list
            </Link>
          </div>
        )}

        {doctors.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {doctors.map((doctor, index) => (
                <div key={doctor.id} className={index >= 3 ? "hidden lg:block" : undefined}>
                  <DoctorCard doc={doctor} index={index} dark={false} distanceUnit={unit} />
                </div>
              ))}
            </div>
            <Link href={directoryHref} className="mt-6 inline-flex min-h-11 items-center text-base font-bold text-neuro-orange-ink">
              {city ? `See all doctors near ${city} →` : "See all doctors →"}
            </Link>
          </>
        )}

        {failed && (
          <p className="text-[15px] text-neuro-navy">
            Set your location to see doctors near you.{" "}
            <a href="#hero-location" className="font-bold text-neuro-orange-ink">Search by city or ZIP</a>
          </p>
        )}
      </div>
    </section>
  );
}
