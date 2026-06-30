// CPT Code Catalog for Chiropractic Care Plans
// Used by the Care Plan Closer for billing calculations

export interface CptCode {
  code: string;
  description: string;
  category: "cmt" | "therapy" | "exam" | "xray" | "evaluation" | "modality";
  timeUnits?: boolean; // true = per 15-min unit
  typicalUnits?: number;
  notes?: string;
}

export const CPT_CODES: CptCode[] = [
  // Chiropractic Manipulative Treatment
  { code: "98940", description: "CMT, 1-2 Spinal Regions", category: "cmt", notes: "Use when adjusting only 1-2 regions" },
  { code: "98941", description: "CMT, 3-4 Spinal Regions", category: "cmt", notes: "Most common CMT code" },
  { code: "98942", description: "CMT, 5 Spinal Regions", category: "cmt", notes: "Full spine. Use sparingly (>15% triggers audits)" },
  { code: "98943", description: "Extraspinal CMT, 1+ Regions", category: "cmt", notes: "Extremity adjusting (shoulder, knee, wrist, etc.)" },

  // Therapeutic Procedures
  { code: "97110", description: "Therapeutic Exercises", category: "therapy", timeUnits: true, typicalUnits: 1, notes: "Stretching, strengthening, ROM. Per 15-min unit." },
  { code: "97112", description: "Neuromuscular Re-education", category: "therapy", timeUnits: true, typicalUnits: 1, notes: "Balance, posture, proprioception training" },
  { code: "97140", description: "Manual Therapy Techniques", category: "therapy", timeUnits: true, typicalUnits: 1, notes: "Soft tissue mobilization, myofascial release" },
  { code: "97530", description: "Therapeutic Activities", category: "therapy", timeUnits: true, typicalUnits: 1, notes: "Functional movements, dynamic stabilization" },

  // Modalities
  { code: "97012", description: "Mechanical Traction", category: "modality", notes: "Spinal decompression / traction" },
  { code: "97014", description: "Electrical Stimulation (Unattended)", category: "modality", notes: "E-stim, TENS (supervised, unattended)" },
  { code: "97032", description: "Electrical Stimulation (Attended)", category: "modality", timeUnits: true, typicalUnits: 1, notes: "E-stim requiring constant attendance" },
  { code: "97035", description: "Ultrasound", category: "modality", timeUnits: true, typicalUnits: 1, notes: "Therapeutic ultrasound per 15-min unit" },

  // Examinations
  { code: "99202", description: "New Patient Office Visit (Level 2)", category: "exam", notes: "Straightforward MDM" },
  { code: "99203", description: "New Patient Office Visit (Level 3)", category: "exam", notes: "Low complexity MDM" },
  { code: "99204", description: "New Patient Office Visit (Level 4)", category: "exam", notes: "Moderate complexity MDM" },
  { code: "99213", description: "Established Patient Visit (Level 3)", category: "exam", notes: "Low complexity MDM" },
  { code: "99214", description: "Established Patient Visit (Level 4)", category: "exam", notes: "Moderate complexity MDM" },

  // Re-examinations
  { code: "99212", description: "Re-examination (Brief)", category: "evaluation", notes: "Brief re-eval, 10-19 min" },
  { code: "99215", description: "Re-examination (Comprehensive)", category: "evaluation", notes: "Comprehensive re-eval" },

  // X-Rays
  { code: "72040", description: "X-Ray, Cervical Spine (2-3 views)", category: "xray" },
  { code: "72050", description: "X-Ray, Cervical Spine (4+ views)", category: "xray" },
  { code: "72070", description: "X-Ray, Thoracic Spine (2 views)", category: "xray" },
  { code: "72100", description: "X-Ray, Lumbar Spine (2-3 views)", category: "xray" },
  { code: "72110", description: "X-Ray, Lumbar Spine (4+ views)", category: "xray" },
  { code: "72170", description: "X-Ray, Pelvis (1-2 views)", category: "xray" },
  { code: "72202", description: "X-Ray, Sacroiliac Joints", category: "xray" },
  { code: "72220", description: "X-Ray, Sacrum/Coccyx (2 views)", category: "xray" },
];

// Common visit code bundles for care plans
export const VISIT_BUNDLES = {
  standard: {
    name: "Standard Adjustment",
    codes: ["98941"],
    description: "CMT 3-4 regions",
  },
  standard_therapy: {
    name: "Adjustment + Therapy",
    codes: ["98941", "97140"],
    description: "CMT 3-4 regions + manual therapy",
  },
  comprehensive: {
    name: "Comprehensive Visit",
    codes: ["98942", "97140", "97110"],
    description: "CMT 5 regions + manual therapy + exercises",
  },
  pi_standard: {
    name: "PI Standard Visit",
    codes: ["98942", "97140", "97110", "97012"],
    description: "Full spine CMT + therapy + exercises + traction",
  },
};

export function getCptByCode(code: string): CptCode | undefined {
  return CPT_CODES.find(c => c.code === code);
}

export function getCptsByCategory(category: CptCode["category"]): CptCode[] {
  return CPT_CODES.filter(c => c.category === category);
}
