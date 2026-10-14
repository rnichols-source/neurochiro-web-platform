/**
 * Centralized distance thresholds.
 *
 * Every distance number used for coverage, gap detection, directory search,
 * outreach tiers, and demand logging lives here.  Values are read from
 * `platform_settings` key "distance_thresholds" with a per-field fallback
 * to the defaults below if the key is missing or the DB is unreachable.
 *
 * Existing per-feature settings (far_distance_threshold, coverage_queue_rules,
 * coverage_auto_log, demand_scatter, doctor_outreach) are still authoritative
 * for their own features.  This module re-exports their values so that
 * consumers import from one place.
 */

// ── Default values (current production behaviour) ──────────────────────────
// These match the values that were previously hardcoded across ~15 files.
// Changing a default here changes the fallback only — DB values take priority.

export const THRESHOLD_DEFAULTS = {
  // Coverage template selection (DB: coverage_queue_rules)
  standard_cutoff: 30,      // <= this = "standard" template
  waitlist_cutoff: 75,      // > this = waitlist (no doctor recommended)
  tiebreak: 5,              // auto-pick tiebreak window
  claim_timeout: 30,        // minutes before unclaimed intro expires
  max_intros_per_doctor_per_day: 25,

  // Far distance (DB: far_distance_threshold)
  far_distance: 30,         // visual flag + template switch in coverage map

  // Gap detection — was hardcoded "50" in 11 locations
  gap_radius: 50,

  // Directory search
  directory_default: 50,    // initial search radius
  directory_expansion_1: 100,
  directory_expansion_2: 250,
  city_page_radius: 30,     // SEARCH_RADIUS_MILES for /chiropractor/[slug]

  // Profile page nearby doctors
  profile_nearby: 50,

  // Subscribe route — nearby doctors in confirmation email
  subscribe_nearby: 30,

  // Doctor-joined notification — match subscribers within this radius
  doctor_joined_radius: 50,

  // Lookup max — coverage map result cap
  lookup_max: 100,

  // Auto-log demand (DB: coverage_auto_log)
  auto_log_distance: 20,    // log demand if nearest doctor > this

  // Scatter jitter (DB: demand_scatter)
  scatter_jitter: 4,        // jitter radius for demand dots

  // Outreach tiers (DB: doctor_outreach)
  outreach_thin: 30,        // < this = covered
  outreach_gap: 75,         // > this = gap
  outreach_prefilter: 200,  // bounding-box pre-filter
  demand_buckets: [25, 50, 100] as readonly number[],
} as const

export type Thresholds = {
  -readonly [K in keyof typeof THRESHOLD_DEFAULTS]: (typeof THRESHOLD_DEFAULTS)[K]
}

// ── In-memory cache ────────────────────────────────────────────────────────
let _cached: Thresholds | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load all distance thresholds.  Server-side only.
 *
 * Reads from multiple platform_settings keys and merges into one object.
 * Caches for 5 minutes.  Falls back to THRESHOLD_DEFAULTS on any error.
 */
export async function getThresholds(): Promise<Thresholds> {
  if (_cached && Date.now() - _cacheTime < CACHE_TTL) return _cached

  try {
    const { createAdminClient } = await import('./supabase-admin')
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'distance_thresholds',
        'far_distance_threshold',
        'coverage_queue_rules',
        'coverage_auto_log',
        'demand_scatter',
        'doctor_outreach',
      ])

    const s: Record<string, any> = {}
    for (const row of data || []) s[row.key] = row.value

    // distance_thresholds is the new unified key; overlay on defaults
    const dt = s.distance_thresholds || {}

    const result: Thresholds = {
      // Start with defaults
      ...THRESHOLD_DEFAULTS,

      // Override from the unified key (covers previously-hardcoded values)
      ...dt,

      // Override from existing per-feature keys (authoritative)
      far_distance:
        s.far_distance_threshold?.miles ?? dt.far_distance ?? THRESHOLD_DEFAULTS.far_distance,
      standard_cutoff:
        s.coverage_queue_rules?.standard ?? dt.standard_cutoff ?? THRESHOLD_DEFAULTS.standard_cutoff,
      waitlist_cutoff:
        s.coverage_queue_rules?.waitlist ?? dt.waitlist_cutoff ?? THRESHOLD_DEFAULTS.waitlist_cutoff,
      tiebreak:
        s.coverage_queue_rules?.tiebreak ?? dt.tiebreak ?? THRESHOLD_DEFAULTS.tiebreak,
      claim_timeout:
        s.coverage_queue_rules?.claimTimeout ?? dt.claim_timeout ?? THRESHOLD_DEFAULTS.claim_timeout,
      max_intros_per_doctor_per_day:
        s.coverage_queue_rules?.maxIntrosPerDoctorPerDay ?? dt.max_intros_per_doctor_per_day ?? THRESHOLD_DEFAULTS.max_intros_per_doctor_per_day,
      auto_log_distance:
        s.coverage_auto_log?.distance_threshold_miles ?? dt.auto_log_distance ?? THRESHOLD_DEFAULTS.auto_log_distance,
      scatter_jitter:
        s.demand_scatter?.jitter_radius_miles ?? dt.scatter_jitter ?? THRESHOLD_DEFAULTS.scatter_jitter,
      outreach_gap:
        s.doctor_outreach?.gap_threshold ?? dt.outreach_gap ?? THRESHOLD_DEFAULTS.outreach_gap,
      outreach_thin:
        s.doctor_outreach?.thin_threshold ?? dt.outreach_thin ?? THRESHOLD_DEFAULTS.outreach_thin,
      demand_buckets:
        s.doctor_outreach?.radius_buckets ?? dt.demand_buckets ?? THRESHOLD_DEFAULTS.demand_buckets,
    }

    _cached = result
    _cacheTime = Date.now()
    return result
  } catch {
    return { ...THRESHOLD_DEFAULTS }
  }
}

/** Bust the cache (e.g. after an admin updates a setting). */
export function invalidateThresholdCache() {
  _cached = null
  _cacheTime = 0
}
