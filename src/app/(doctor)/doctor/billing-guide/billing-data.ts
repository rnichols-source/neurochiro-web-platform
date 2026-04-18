// billing-data.ts
// Comprehensive chiropractic insurance billing reference data.
// Current as of 2025-2026 CPT/ICD-10 coding cycles.

export interface BillingSection {
  id: string;
  title: string;
  description: string;
  items: BillingItem[];
}

export interface BillingItem {
  id: string;
  title: string;
  type: 'code' | 'modifier' | 'script' | 'letter' | 'template' | 'checklist' | 'payer';
  code?: string;
  content: string;
}

export const BILLING_SECTIONS: BillingSection[] = [
  // ---------------------------------------------------------------------------
  // SECTION 1: CPT CODE BIBLE
  // ---------------------------------------------------------------------------
  {
    id: 'cpt-codes',
    title: 'CPT Code Bible',
    description:
      'Complete reference for every CPT code a chiropractic office uses regularly. Each entry includes plain-English meaning, when to use it, when NOT to use it, documentation requirements, average reimbursement ranges, bundling rules, and common denial reasons.',
    items: [
      // -----------------------------------------------------------------------
      // CMT CODES
      // -----------------------------------------------------------------------
      {
        id: 'cpt-98940',
        title: 'CMT 1-2 Spinal Regions',
        type: 'code',
        code: '98940',
        content: `CPT 98940 -- Chiropractic Manipulative Treatment (CMT), 1-2 Spinal Regions

PLAIN ENGLISH
A chiropractic adjustment delivered to one or two spinal regions in a single visit. Spinal regions are: cervical, thoracic, lumbar, sacral, and pelvic.

WHEN TO USE
- Patient presents with complaints limited to one or two spinal regions (e.g., neck pain only, or neck + mid-back).
- Examination and treatment are confined to those regions for that visit.
- This is the most commonly billed CMT code in most practices.

WHEN NOT TO USE
- Do NOT use if you adjusted three or more spinal regions -- use 98941 instead.
- Do NOT use for extremity-only adjustments -- use 98943.
- Do NOT downcode from 98941 to 98940 just because a payer reimburses poorly on 98941; this is considered fraud.

DOCUMENTATION REQUIREMENTS
- Identify the specific regions adjusted (e.g., "cervical and lumbar").
- Record the subluxation level(s) by spinal segment (e.g., C5, L4).
- Include subjective complaint, objective findings (palpation, ROM, muscle tone), assessment, and plan (SOAP).
- For Medicare: subluxation must be documented by X-ray or physical exam findings (PART criteria -- Pain/tenderness, Asymmetry, Range of motion abnormality, Tissue/tone changes) within the initial visit.

AVERAGE REIMBURSEMENT
- Medicare: $28-$38
- Commercial: $35-$65
- PI/Auto: $55-$85

BUNDLING RULES
- Can be billed same-day with E/M if the E/M service is separately identifiable (use modifier -25 on E/M).
- Can be billed with therapeutic procedures (97110, 97140) on the same date.
- Cannot be billed with osteopathic manipulation (98925-98929) on the same date.

COMMON DENIAL REASONS
- Missing subluxation documentation on initial visit (especially Medicare).
- Exceeding payer visit limits without prior authorization.
- Diagnosis code does not support spinal manipulation (e.g., using a soft-tissue-only diagnosis).
- Failing to document medical necessity for continued treatment past 30 days.`,
      },
      {
        id: 'cpt-98941',
        title: 'CMT 3-4 Spinal Regions',
        type: 'code',
        code: '98941',
        content: `CPT 98941 -- Chiropractic Manipulative Treatment (CMT), 3-4 Spinal Regions

PLAIN ENGLISH
A chiropractic adjustment delivered to three or four spinal regions in a single visit.

WHEN TO USE
- Patient presents with complaints or findings spanning three or four spinal regions (e.g., cervical + thoracic + lumbar).
- Your examination documents subluxation or dysfunction in each region treated.
- Common in new patients, acute trauma, or full-spine technique practitioners.

WHEN NOT TO USE
- Do NOT use if you only adjusted one or two regions -- use 98940.
- Do NOT use if you adjusted five regions -- use 98942.
- Do NOT "upcode" by claiming regions you did not actually treat just to increase reimbursement. Auditors compare documentation to billed regions.

DOCUMENTATION REQUIREMENTS
- Name all three or four spinal regions treated.
- Document subluxation findings per region (specific segments).
- SOAP note must justify medical necessity for each region.
- For Medicare: same PART criteria as 98940 plus the AT modifier.

AVERAGE REIMBURSEMENT
- Medicare: $42-$55
- Commercial: $50-$85
- PI/Auto: $70-$110

BUNDLING RULES
- Same bundling rules as 98940.
- Can bill same-day with 98943 (extremity) if both spinal and extremity adjustments are performed.
- E/M requires modifier -25 for separate identifiable service.

COMMON DENIAL REASONS
- Documentation lists only two regions but 98941 was billed (instant audit flag).
- No segment-specific subluxation findings.
- Pattern billing (billing 98941 on every single visit regardless of presentation -- triggers payer audits).`,
      },
      {
        id: 'cpt-98942',
        title: 'CMT 5 Spinal Regions',
        type: 'code',
        code: '98942',
        content: `CPT 98942 -- Chiropractic Manipulative Treatment (CMT), 5 Spinal Regions

PLAIN ENGLISH
A chiropractic adjustment delivered to all five spinal regions in a single visit: cervical, thoracic, lumbar, sacral, and pelvic.

WHEN TO USE
- Patient requires treatment to all five spinal regions based on clinical findings.
- Common in MVA patients, severe scoliosis, or post-surgical rehab with global spinal involvement.
- Must have documented subluxation or joint dysfunction in each of the five regions.

WHEN NOT TO USE
- Do NOT bill this code routinely. If every patient gets 98942 every visit, expect an audit.
- Do NOT use when you adjusted four or fewer regions.
- Rarely appropriate for maintenance or wellness care.

DOCUMENTATION REQUIREMENTS
- Each of the five regions must have specific subluxation or dysfunction findings.
- Detail the clinical rationale for treating all five regions.
- Time spent and complexity should be consistent with a full-spine treatment.
- For Medicare: requires AT modifier and subluxation documentation.

AVERAGE REIMBURSEMENT
- Medicare: $52-$68
- Commercial: $65-$100
- PI/Auto: $85-$130

BUNDLING RULES
- Same rules as 98940/98941.
- If also performing extremity adjustments, add 98943 separately.
- Very high scrutiny code -- ensure documentation is bulletproof.

COMMON DENIAL REASONS
- Frequency of use (billing 98942 on >15% of visits triggers audits).
- Insufficient documentation to justify all five regions.
- Payer downcode to 98941 if documentation only supports 3-4 regions.`,
      },
      {
        id: 'cpt-98943',
        title: 'CMT Extraspinal Regions',
        type: 'code',
        code: '98943',
        content: `CPT 98943 -- Chiropractic Manipulative Treatment (CMT), Extraspinal

PLAIN ENGLISH
A chiropractic adjustment to one or more extraspinal (extremity) joints -- shoulder, elbow, wrist, hip, knee, ankle, TMJ, etc.

WHEN TO USE
- Patient presents with extremity joint dysfunction (e.g., frozen shoulder, carpal tunnel-related wrist fixation, ankle sprain with talocrural fixation).
- You perform a specific articular adjustment or manipulation to the extremity joint.
- Can be billed in addition to a spinal CMT code (98940-98942) on the same date.

WHEN NOT TO USE
- Do NOT use for soft tissue work on extremities -- that is 97140.
- Do NOT use for extremity stretching or ROM exercises -- that is 97110 or 97112.
- Not all payers cover extremity adjustments (especially Medicare, which does NOT cover 98943).

DOCUMENTATION REQUIREMENTS
- Identify the specific joint(s) adjusted.
- Document subluxation or fixation findings for each joint.
- Note the technique used and the clinical indication.
- Separate SOAP findings for the extremity complaint.

AVERAGE REIMBURSEMENT
- Medicare: NOT COVERED (non-covered service; bill with GY modifier if needed for denial on file).
- Commercial: $25-$50
- PI/Auto: $40-$65

BUNDLING RULES
- Can be billed alongside spinal CMT codes (98940-98942).
- Cannot be billed with osteopathic manipulation of the same region.
- Some payers bundle 98943 into the spinal CMT -- check payer policy.

COMMON DENIAL REASONS
- Medicare denial (not a covered service).
- Missing extremity-specific diagnosis code.
- Documentation does not differentiate extremity treatment from spinal treatment.
- Payer considers it bundled into the spinal CMT.`,
      },

      // -----------------------------------------------------------------------
      // E/M NEW PATIENT
      // -----------------------------------------------------------------------
      {
        id: 'cpt-99202',
        title: 'E/M New Patient Level 2',
        type: 'code',
        code: '99202',
        content: `CPT 99202 -- Office Visit, New Patient, Level 2

PLAIN ENGLISH
A straightforward evaluation and management visit for a new patient with a low-complexity problem.

WHEN TO USE
- New patient with a single, uncomplicated musculoskeletal complaint.
- Requires straightforward medical decision making (MDM).
- Minimum 15-29 minutes of total time OR straightforward MDM.
- Example: new patient with acute low back pain, no red flags, no comorbidities.

WHEN NOT TO USE
- Do NOT use for established patients -- use 99212-99215.
- Do NOT use if the visit involves moderate or high complexity decision making.
- Do NOT bill this on the same day as CMT without modifier -25 on the E/M code.

DOCUMENTATION REQUIREMENTS
- History of present illness (HPI).
- Review of systems (can be limited).
- Physical examination relevant to the complaint.
- Medical decision making documented as straightforward.
- If billing by time: document total time on date of encounter.

AVERAGE REIMBURSEMENT
- Medicare: $65-$80
- Commercial: $75-$110
- PI/Auto: $100-$150

BUNDLING RULES
- When billed with CMT same-day, requires modifier -25 on the E/M code.
- The E/M must be a separately identifiable service -- not just the exam you would normally do before adjusting.
- Cannot bill both 99202 and 99203+ for the same encounter.

COMMON DENIAL REASONS
- Missing modifier -25 when billed with CMT.
- Documentation does not support a separately identifiable E/M service beyond the CMT exam.
- Payer considers the E/M bundled into the CMT.`,
      },
      {
        id: 'cpt-99203',
        title: 'E/M New Patient Level 3',
        type: 'code',
        code: '99203',
        content: `CPT 99203 -- Office Visit, New Patient, Level 3

PLAIN ENGLISH
A new patient visit with low-to-moderate complexity medical decision making.

WHEN TO USE
- New patient with two or more musculoskeletal complaints, or one complaint with comorbidities.
- Low complexity MDM at minimum.
- Minimum 30-44 minutes of total time OR low MDM.
- Example: new patient with neck pain radiating to arm, plus headaches and a history of prior cervical surgery.

WHEN NOT TO USE
- Do NOT use for simple, single-complaint new patients (use 99202).
- Do NOT use for high-complexity cases (use 99204 or 99205).
- Confirm documentation supports the MDM level -- do not upcode.

DOCUMENTATION REQUIREMENTS
- Detailed HPI with at least four elements.
- Pertinent review of systems (2-9 systems).
- Examination of affected body areas and organ systems.
- Assessment with documented differential considerations or comorbidity management.
- If billing by time: document total time.

AVERAGE REIMBURSEMENT
- Medicare: $105-$130
- Commercial: $120-$175
- PI/Auto: $150-$225

BUNDLING RULES
- Same as 99202. Modifier -25 required with same-day CMT.
- Cannot be billed with other E/M codes same day.

COMMON DENIAL REASONS
- Documentation supports only straightforward MDM (should be 99202).
- Modifier -25 missing.
- Time not documented when billing by time.`,
      },
      {
        id: 'cpt-99204',
        title: 'E/M New Patient Level 4',
        type: 'code',
        code: '99204',
        content: `CPT 99204 -- Office Visit, New Patient, Level 4

PLAIN ENGLISH
A comprehensive new patient visit with moderate complexity medical decision making.

WHEN TO USE
- New patient with multiple musculoskeletal complaints, comorbidities, or a complex presentation.
- Moderate MDM: multiple diagnoses, ordering/reviewing tests, prescription drug management.
- Minimum 45-59 minutes of total time OR moderate MDM.
- Example: new patient post-MVA with cervical, thoracic, and lumbar pain; numbness in extremities; history of disc surgery; needs X-rays, possible MRI referral.

WHEN NOT TO USE
- Do NOT use for routine new patient exams.
- Must have documentation supporting moderate MDM -- not just a long visit.
- Rarely appropriate without diagnostic testing or complex comorbidities.

DOCUMENTATION REQUIREMENTS
- Extended HPI.
- Complete review of systems (10+ systems).
- Comprehensive physical examination.
- Moderate MDM with documented data review, diagnosis complexity, and risk assessment.
- If billing by time: document total time.

AVERAGE REIMBURSEMENT
- Medicare: $165-$200
- Commercial: $190-$280
- PI/Auto: $250-$400

BUNDLING RULES
- Modifier -25 required if billed same-day with CMT.
- X-ray interpretation codes can be billed separately same-day.

COMMON DENIAL REASONS
- Documentation does not support moderate MDM.
- Auditors find the exam was not comprehensive enough for level 4.
- Routine for this code to be downcoded to 99203 on audit if documentation is thin.`,
      },
      {
        id: 'cpt-99205',
        title: 'E/M New Patient Level 5',
        type: 'code',
        code: '99205',
        content: `CPT 99205 -- Office Visit, New Patient, Level 5

PLAIN ENGLISH
The highest-level new patient visit with high complexity medical decision making.

WHEN TO USE
- New patient with severe, complex, multi-system presentation.
- High MDM: acute or chronic illness posing threat to life or function, extensive data review, high-risk management.
- Minimum 60-74 minutes of total time OR high MDM.
- Example: new patient with severe radiculopathy, suspected cauda equina, multiple comorbidities requiring urgent referral and complex care coordination.

WHEN NOT TO USE
- This code is rarely used in chiropractic. If you bill this more than 1-2% of the time, expect scrutiny.
- Do NOT use for standard new patient exams regardless of how long the visit takes.
- Must have documentation proving high MDM.

DOCUMENTATION REQUIREMENTS
- Comprehensive HPI, ROS, and examination.
- High MDM with documented threat to life/function, complex data reviewed, and high-risk management decisions.
- Coordination of care with other providers should be documented.
- If billing by time: document total time on the date of encounter.

AVERAGE REIMBURSEMENT
- Medicare: $210-$260
- Commercial: $250-$375
- PI/Auto: $350-$500

BUNDLING RULES
- Same as other E/M codes. Modifier -25 for same-day CMT.
- Can bill diagnostic codes separately.

COMMON DENIAL REASONS
- Documentation does not support high MDM (most common).
- Payer requests records and downcodes to 99204 or 99203.
- Pattern of billing 99205 frequently triggers immediate audit.`,
      },

      // -----------------------------------------------------------------------
      // E/M ESTABLISHED PATIENT
      // -----------------------------------------------------------------------
      {
        id: 'cpt-99212',
        title: 'E/M Established Patient Level 2',
        type: 'code',
        code: '99212',
        content: `CPT 99212 -- Office Visit, Established Patient, Level 2

PLAIN ENGLISH
A brief follow-up visit for an established patient with a straightforward problem.

WHEN TO USE
- Established patient with a single, uncomplicated complaint that is improving.
- Straightforward MDM.
- Minimum 10-19 minutes of total time OR straightforward MDM.
- Example: two-week follow-up for acute low back strain that is responding to care.

WHEN NOT TO USE
- Do NOT use for new patients.
- Do NOT use when the visit involves more than straightforward MDM.
- Do NOT bill this routinely on every visit just to add revenue to a CMT visit.

DOCUMENTATION REQUIREMENTS
- Brief HPI update.
- Focused physical exam.
- Straightforward MDM with documented assessment and plan.
- Must be a separately identifiable service from the CMT if billed same-day.

AVERAGE REIMBURSEMENT
- Medicare: $45-$55
- Commercial: $50-$80
- PI/Auto: $65-$100

BUNDLING RULES
- Modifier -25 required when billed with CMT same-day.
- The E/M must document a reason beyond "I examined the patient before adjusting."

COMMON DENIAL REASONS
- Modifier -25 missing.
- Documentation is just a standard SOAP note that any CMT visit would have -- payer sees no separately identifiable service.
- Billing E/M on every CMT visit triggers pattern audits.`,
      },
      {
        id: 'cpt-99213',
        title: 'E/M Established Patient Level 3',
        type: 'code',
        code: '99213',
        content: `CPT 99213 -- Office Visit, Established Patient, Level 3

PLAIN ENGLISH
A moderate follow-up visit for an established patient with low complexity decision making.

WHEN TO USE
- Established patient with a worsening condition, new complaint, or need for care plan modification.
- Low MDM.
- Minimum 20-29 minutes of total time OR low MDM.
- Example: patient at 4-week re-exam; symptoms have plateaued, need to modify treatment plan, add therapies, or consider imaging.

WHEN NOT TO USE
- Do NOT use if the patient is just coming in for a routine adjustment with no change in status.
- Do NOT use if MDM is straightforward (use 99212).

DOCUMENTATION REQUIREMENTS
- Updated HPI.
- Pertinent ROS.
- Focused exam with measurable findings (ROM, orthopedic tests, pain scale changes).
- Low MDM with documented care plan changes or new data review.
- Re-examination findings compared to baseline.

AVERAGE REIMBURSEMENT
- Medicare: $70-$90
- Commercial: $80-$125
- PI/Auto: $100-$165

BUNDLING RULES
- Modifier -25 with same-day CMT.
- Commonly billed on re-exam days.
- Cannot bill two E/M codes same-day for same patient.

COMMON DENIAL REASONS
- Documentation does not show a change in condition or care plan.
- Modifier -25 missing.
- Billed too frequently without clinical justification for E/M beyond CMT.`,
      },
      {
        id: 'cpt-99214',
        title: 'E/M Established Patient Level 4',
        type: 'code',
        code: '99214',
        content: `CPT 99214 -- Office Visit, Established Patient, Level 4

PLAIN ENGLISH
A detailed follow-up visit for an established patient with moderate complexity decision making.

WHEN TO USE
- Established patient with a significant change in condition, new diagnosis, or need for complex care coordination.
- Moderate MDM.
- Minimum 30-39 minutes of total time OR moderate MDM.
- Example: patient develops new radicular symptoms; you order an MRI, review results, coordinate with orthopedist, modify treatment plan significantly.

WHEN NOT TO USE
- Do NOT use for routine re-exams without significant findings.
- Must have moderate MDM supported by documentation.
- If you are billing 99214 more than 15-20% of established visits, expect payer review.

DOCUMENTATION REQUIREMENTS
- Detailed HPI.
- Extended ROS.
- Detailed physical exam.
- Moderate MDM with new or worsening diagnoses, data reviewed (labs, imaging, reports from other providers), and risk assessment.
- Document time if billing by time.

AVERAGE REIMBURSEMENT
- Medicare: $105-$135
- Commercial: $120-$185
- PI/Auto: $150-$250

BUNDLING RULES
- Modifier -25 with same-day CMT.
- Diagnostic interpretation codes can be billed separately.

COMMON DENIAL REASONS
- Documentation does not support moderate MDM.
- Downcoded to 99213 on audit.
- Too frequent use without complex presentations.`,
      },
      {
        id: 'cpt-99215',
        title: 'E/M Established Patient Level 5',
        type: 'code',
        code: '99215',
        content: `CPT 99215 -- Office Visit, Established Patient, Level 5

PLAIN ENGLISH
The highest-level established patient visit with high complexity medical decision making.

WHEN TO USE
- Established patient with severe, complex, or life-threatening presentation.
- High MDM.
- Minimum 40-54 minutes of total time OR high MDM.
- Example: patient develops progressive myelopathy symptoms; you perform comprehensive neuro exam, order urgent MRI, provide emergent referral to neurosurgeon, coordinate care.

WHEN NOT TO USE
- Extremely rare in chiropractic practice.
- Do NOT bill this for lengthy but clinically straightforward visits.
- If billing this more than 1-2% of established visits, you will be audited.

DOCUMENTATION REQUIREMENTS
- Comprehensive exam and history.
- High MDM: acute illness posing threat to life/function, extensive data review, high-risk decision making.
- Coordination of care documentation.
- If by time: document total time.

AVERAGE REIMBURSEMENT
- Medicare: $150-$190
- Commercial: $175-$275
- PI/Auto: $225-$375

BUNDLING RULES
- Modifier -25 with same-day CMT.
- Can bill diagnostic codes separately.

COMMON DENIAL REASONS
- Documentation fails to support high MDM.
- Payer downcodes to 99214 or 99213.
- Audit red flag if used with any frequency.`,
      },

      // -----------------------------------------------------------------------
      // THERAPEUTIC PROCEDURE CODES
      // -----------------------------------------------------------------------
      {
        id: 'cpt-97140',
        title: 'Manual Therapy Techniques',
        type: 'code',
        code: '97140',
        content: `CPT 97140 -- Manual Therapy Techniques (15-minute unit)

PLAIN ENGLISH
Skilled, hands-on therapeutic techniques including myofascial release, manual traction, joint mobilization (non-thrust), soft tissue mobilization, or manual lymphatic drainage. This is a timed code billed in 15-minute increments.

WHEN TO USE
- Patient has soft tissue dysfunction (adhesions, trigger points, muscle spasm, fascial restrictions) that requires skilled manual intervention.
- The technique is distinct from the CMT adjustment.
- Must provide direct, one-on-one, skilled contact for the duration billed.
- Example: 15 minutes of myofascial release to the cervical paraspinals and upper trapezius following a CMT.

WHEN NOT TO USE
- Do NOT use for the adjustment itself -- that is CMT (98940-98943).
- Do NOT use for passive modalities (e-stim, ultrasound) -- those have separate codes.
- Do NOT bill 97140 if a therapy aide or tech is performing the service.
- Do NOT bill multiple units without spending the actual time (8-minute rule applies).

DOCUMENTATION REQUIREMENTS
- Document the specific technique used (myofascial release, trigger point therapy, etc.).
- Identify the body area treated.
- Record the time spent (start/stop or total minutes).
- Note the clinical rationale (what dysfunction are you treating?).
- Document the patient's response to treatment.

AVERAGE REIMBURSEMENT
- Medicare: $28-$38 per unit
- Commercial: $35-$55 per unit
- PI/Auto: $50-$75 per unit

BUNDLING RULES
- Can be billed with CMT same-day (different service, different purpose).
- CCI edits may bundle 97140 with CMT for some payers -- use modifier -59 or X-codes (XE, XS) if truly distinct.
- Follow the 8-minute rule for timed codes: 1 unit = 8-22 minutes, 2 units = 23-37 minutes, etc.
- When billing multiple timed codes same-day, total minutes across all timed codes must support total units billed.

COMMON DENIAL REASONS
- Billed same-day as CMT without proper documentation distinguishing the two services.
- Time documentation missing or insufficient to support units billed.
- Payer bundles 97140 into CMT -- need modifier -59 or appeal.
- Performed by unlicensed staff.`,
      },
      {
        id: 'cpt-97110',
        title: 'Therapeutic Exercises',
        type: 'code',
        code: '97110',
        content: `CPT 97110 -- Therapeutic Exercises (15-minute unit)

PLAIN ENGLISH
One-on-one therapeutic exercises to develop strength, endurance, flexibility, and range of motion. The provider (or qualified therapist under direct supervision) must be present and actively involved.

WHEN TO USE
- Patient needs guided therapeutic exercise to restore function.
- Exercises must be skilled -- not something the patient could do independently.
- Example: supervised spinal stabilization exercises, McKenzie protocol exercises, progressive resistance exercises for a deconditioned patient.
- Must have direct one-on-one contact time to bill.

WHEN NOT TO USE
- Do NOT use for exercises the patient performs independently (that is 97530 or HEP -- no code for home exercise).
- Do NOT use for group exercise.
- Do NOT use if a therapy aide is running the exercises without direct supervision.
- Do NOT bill if the patient is just lying on a table with an ice pack -- that is not therapeutic exercise.

DOCUMENTATION REQUIREMENTS
- Describe the specific exercises performed.
- Document sets, reps, resistance, or duration for each exercise.
- Record total one-on-one time spent.
- Tie the exercises to functional goals in the treatment plan.
- Document patient performance, tolerance, and progress toward goals.

AVERAGE REIMBURSEMENT
- Medicare: $30-$42 per unit
- Commercial: $35-$55 per unit
- PI/Auto: $50-$75 per unit

BUNDLING RULES
- Can be billed with CMT and 97140 same-day if time supports it.
- 8-minute rule applies.
- CCI edits generally allow 97110 with CMT without modifiers.
- When billing 97110 + 97112 same-day, ensure they target different functional deficits.

COMMON DENIAL REASONS
- Time documentation missing.
- Exercises are not "skilled" level (e.g., "patient walked on treadmill" without clinical justification).
- Total timed units across all codes exceed total documented minutes.
- No functional goals documented.`,
      },
      {
        id: 'cpt-97112',
        title: 'Neuromuscular Re-education',
        type: 'code',
        code: '97112',
        content: `CPT 97112 -- Neuromuscular Re-education (15-minute unit)

PLAIN ENGLISH
Training to restore movement, balance, coordination, kinesthetic sense, posture, and proprioception. The focus is on re-training the nervous system to control the musculoskeletal system.

WHEN TO USE
- Patient has impaired neuromuscular function: balance deficits, postural dysfunction, proprioceptive loss, coordination problems.
- Examples: balance board training for ankle instability, postural re-training for forward head posture, proprioceptive exercises post-whiplash, gait re-training.
- Direct one-on-one skilled service required.

WHEN NOT TO USE
- Do NOT use interchangeably with 97110. Therapeutic exercises build strength/ROM; neuromuscular re-education retrains motor patterns.
- Do NOT bill for simple stretching.
- Do NOT bill if the patient is performing exercises independently.

DOCUMENTATION REQUIREMENTS
- Identify the specific neuromuscular deficit being addressed.
- Describe the re-education activity performed (balance training, postural correction drills, proprioceptive exercises, etc.).
- Document total one-on-one time.
- Tie activities to measurable functional goals (e.g., "improve single-leg balance from 5 seconds to 30 seconds").
- Record patient performance and progress.

AVERAGE REIMBURSEMENT
- Medicare: $30-$40 per unit
- Commercial: $35-$55 per unit
- PI/Auto: $50-$75 per unit

BUNDLING RULES
- Can be billed same-day with 97110 if targeting different deficits with different activities.
- 8-minute rule applies.
- Some payers bundle 97112 with 97110 -- may need modifier -59 or XE.

COMMON DENIAL REASONS
- Documentation describes exercises, not neuromuscular re-education (sounds like 97110).
- No documented neuromuscular deficit.
- Time does not support units billed.
- Billed on same day as 97110 without distinct documentation for each.`,
      },
      {
        id: 'cpt-97010',
        title: 'Hot/Cold Packs',
        type: 'code',
        code: '97010',
        content: `CPT 97010 -- Application of Hot or Cold Packs

PLAIN ENGLISH
Application of superficial heat or cold packs as a passive modality. This is an untimed code -- one unit per session regardless of duration.

WHEN TO USE
- Patient requires heat or cold application for pain relief, muscle relaxation, or inflammation control.
- Used as adjunct to other treatments.
- Example: moist heat to lumbar paraspinals for 15 minutes before CMT to reduce muscle guarding.

WHEN NOT TO USE
- Some payers consider this "inclusive" to the office visit and do not reimburse separately.
- Medicare does NOT separately reimburse 97010 -- consider it bundled.
- Do NOT bill if you just told the patient to use ice at home.

DOCUMENTATION REQUIREMENTS
- Note the modality used (hot pack, cold pack, or contrast).
- Document the body area treated.
- Record the duration of application.
- Note the clinical reason for the modality.

AVERAGE REIMBURSEMENT
- Medicare: NOT SEPARATELY REIMBURSED
- Commercial: $8-$18
- PI/Auto: $15-$30

BUNDLING RULES
- Generally bundled into the office visit by Medicare and many commercial payers.
- When reimbursed, it is billed once per session regardless of time.
- Not a timed code -- the 8-minute rule does not apply.

COMMON DENIAL REASONS
- Payer considers it bundled (most common).
- Missing documentation of medical necessity.
- Some payers deny if it is the only service rendered (must accompany treatment).`,
      },
      {
        id: 'cpt-97014',
        title: 'Electrical Stimulation (Unattended)',
        type: 'code',
        code: '97014',
        content: `CPT 97014 -- Electrical Stimulation (Unattended)

PLAIN ENGLISH
Application of electrical stimulation to muscles or nerves without the provider in constant attendance. The provider places the electrodes, sets the parameters, and leaves the patient. This is an untimed code (one unit per session).

WHEN TO USE
- Patient needs electrical stimulation for pain control, muscle spasm reduction, or edema management.
- The provider sets up the e-stim and does not need to remain with the patient during the session.
- Example: interferential current applied to lumbar paraspinals for 15 minutes while patient rests.

WHEN NOT TO USE
- Do NOT use if you are providing constant attendance (manual e-stim techniques) -- use 97032 instead.
- Do NOT bill 97014 AND 97032 for the same session.
- Medicare does NOT cover 97014 for chiropractors.

DOCUMENTATION REQUIREMENTS
- Type of electrical stimulation (IFC, TENS, Russian stim, etc.).
- Body area and electrode placement.
- Parameters (frequency, intensity, waveform, duration).
- Clinical indication for the modality.

AVERAGE REIMBURSEMENT
- Medicare: NOT COVERED for chiropractors
- Commercial: $15-$30
- PI/Auto: $25-$45

BUNDLING RULES
- Cannot bill with 97032 (attended e-stim) same session.
- Untimed -- one unit per session regardless of duration.
- Some payers bundle with 97010 (hot/cold packs).

COMMON DENIAL REASONS
- Medicare non-coverage for chiropractors.
- Documentation lacks parameters or clinical indication.
- Billed alongside 97032 on the same date.`,
      },
      {
        id: 'cpt-97032',
        title: 'Electrical Stimulation (Attended)',
        type: 'code',
        code: '97032',
        content: `CPT 97032 -- Electrical Stimulation (Constant Attendance), 15-minute unit

PLAIN ENGLISH
Application of electrical stimulation requiring constant, skilled attendance by the provider. The provider must be present and making ongoing adjustments to the stimulation parameters or electrode placement. This IS a timed code (15-minute units).

WHEN TO USE
- Patient needs e-stim with real-time provider adjustment (e.g., adjusting intensity for muscle re-education, monitoring for adverse reactions, using point stimulation).
- The provider must be at bedside/tableside during the entire treatment.
- Example: manual application of electrical muscle stimulation with ongoing parameter adjustments for muscle re-education following a lumbar strain.

WHEN NOT TO USE
- Do NOT use if you set up the e-stim and walk away -- that is 97014.
- Do NOT bill both 97014 and 97032 same session.
- Must document constant attendance and why it was medically necessary.

DOCUMENTATION REQUIREMENTS
- Type of e-stim, parameters, and adjustments made during the session.
- Body area treated and electrode placement.
- Document that constant attendance was provided and why.
- Record total time of attendance.

AVERAGE REIMBURSEMENT
- Medicare: NOT COVERED for chiropractors
- Commercial: $30-$50 per unit
- PI/Auto: $40-$65 per unit

BUNDLING RULES
- Timed code -- 8-minute rule applies.
- Cannot bill with 97014 same session.
- Can bill with other timed codes if total minutes support total units.

COMMON DENIAL REASONS
- Documentation does not support constant attendance (looks like 97014 charting).
- Medicare non-coverage for chiropractors.
- Time documentation missing or inconsistent.`,
      },

      // -----------------------------------------------------------------------
      // EXAM/TESTING CODES
      // -----------------------------------------------------------------------
      {
        id: 'cpt-95851',
        title: 'Range of Motion Testing',
        type: 'code',
        code: '95851',
        content: `CPT 95851 -- Range of Motion Measurements and Report (Each Extremity or Trunk)

PLAIN ENGLISH
Formal measurement and reporting of range of motion for an extremity or the trunk. This involves using a goniometer, inclinometer, or other measuring device and producing a documented report of findings.

WHEN TO USE
- When performing formal, measured ROM testing as part of a re-exam or impairment evaluation.
- When you need objective, measurable data for documentation, disability rating, or legal case.
- Example: inclinometer measurements of lumbar flexion/extension/lateral flexion for a PI case.
- Typically used on initial exam or periodic re-exams, not every visit.

WHEN NOT TO USE
- Do NOT use for informal ROM observation ("patient has decreased cervical ROM").
- Do NOT bill on every visit.
- Do NOT bill if you did not use a measuring device and produce a report.
- Some payers bundle this into the E/M code.

DOCUMENTATION REQUIREMENTS
- Specify the body region tested.
- Document the measuring device used.
- Record numerical measurements for each motion tested.
- Compare to established norms and/or prior measurements.
- Include the formal report.

AVERAGE REIMBURSEMENT
- Medicare: $18-$25 per region
- Commercial: $20-$40 per region
- PI/Auto: $35-$55 per region

BUNDLING RULES
- Some payers bundle into E/M codes.
- Billed per extremity or trunk section.
- Can be billed with E/M and CMT on the same date if separately documented.

COMMON DENIAL REASONS
- No measuring instrument documented.
- Billed too frequently (every visit).
- Considered bundled into E/M.
- No formal report produced.`,
      },
      {
        id: 'cpt-95831',
        title: 'Muscle Testing, Manual',
        type: 'code',
        code: '95831',
        content: `CPT 95831 -- Muscle Testing, Manual (with Report), Extremity or Trunk

PLAIN ENGLISH
Formal manual muscle testing with a documented report. Testing the strength of individual muscles or muscle groups and grading them on a standardized scale (0-5).

WHEN TO USE
- When performing formal, graded muscle strength testing as part of an examination.
- Used in impairment evaluations, disability determinations, or when documenting neurological deficits.
- Example: grading strength of C5-T1 myotomes in a cervical radiculopathy patient.

WHEN NOT TO USE
- Do NOT bill for informal strength testing done as part of a routine exam.
- Do NOT bill on every visit -- typically initial and re-exam only.
- Do NOT use without a standardized grading scale and formal report.

DOCUMENTATION REQUIREMENTS
- List each muscle or muscle group tested.
- Record the grade for each (0-5 scale).
- Compare to contralateral side and/or prior testing.
- Produce a formal report.
- Tie findings to the diagnosis and treatment plan.

AVERAGE REIMBURSEMENT
- Medicare: $16-$22 per region
- Commercial: $18-$35 per region
- PI/Auto: $30-$50 per region

BUNDLING RULES
- Some payers bundle into E/M.
- Billed per extremity or trunk section.
- Can be billed alongside ROM testing (95851) and E/M if separately documented.

COMMON DENIAL REASONS
- No standardized grading documented.
- Billed too frequently.
- Considered part of the E/M exam.
- No formal report.`,
      },

      // -----------------------------------------------------------------------
      // X-RAY CODES
      // -----------------------------------------------------------------------
      {
        id: 'cpt-72040',
        title: 'X-Ray Cervical Spine 2-3 Views',
        type: 'code',
        code: '72040',
        content: `CPT 72040 -- Radiologic Examination, Cervical Spine, 2-3 Views

PLAIN ENGLISH
X-ray imaging of the cervical spine with 2 or 3 views (typically AP and lateral, or AP, lateral, and odontoid/open-mouth).

WHEN TO USE
- Patient presents with cervical spine complaints requiring radiographic evaluation.
- Indications: trauma, suspected fracture, ruling out pathology, documenting subluxation (especially for Medicare), red flags on exam.
- Example: new patient with neck pain post-MVA; cervical X-ray series to rule out fracture and document subluxation.

WHEN NOT TO USE
- Do NOT order X-rays on every new patient without clinical indication.
- Do NOT use 72040 if you took 4+ views -- use 72050.
- Follow ACR Appropriateness Criteria and state radiation safety guidelines.

DOCUMENTATION REQUIREMENTS
- Document the clinical indication for the imaging study.
- Record the views taken.
- Provide a formal written interpretation including findings, impressions, and recommendations.
- If another provider is interpreting, use modifier -TC (technical component only).
- If you are only interpreting (not owning the equipment), use modifier -26.

AVERAGE REIMBURSEMENT (Global -- TC + 26)
- Medicare: $35-$50
- Commercial: $50-$90
- PI/Auto: $75-$140

BUNDLING RULES
- If you took 4+ views, use 72050 instead (do not bill 72040 x 2).
- Can bill same-day with E/M and CMT.
- Bill only the global fee if you own the equipment AND interpret.

COMMON DENIAL REASONS
- No documented clinical indication.
- Wrong view count code (2-3 views billed as 72050 or vice versa).
- Missing formal interpretation/report.
- Some payers require prior authorization for imaging.`,
      },
      {
        id: 'cpt-72050',
        title: 'X-Ray Cervical Spine 4-5 Views',
        type: 'code',
        code: '72050',
        content: `CPT 72050 -- Radiologic Examination, Cervical Spine, 4-5 Views

PLAIN ENGLISH
X-ray imaging of the cervical spine with 4 or 5 views (e.g., AP, lateral, both obliques, and/or flexion-extension).

WHEN TO USE
- Patient needs a more comprehensive cervical spine radiographic study.
- Indications: suspected foraminal stenosis (obliques), ligamentous instability (flexion-extension), post-MVA workup.
- Example: cervical series with obliques to evaluate foraminal encroachment in a radiculopathy patient.

WHEN NOT TO USE
- Do NOT use if you took 2-3 views -- use 72040.
- Do NOT take 6+ views without strong clinical justification.

DOCUMENTATION REQUIREMENTS
- Clinical indication for the additional views beyond a standard 2-3 view series.
- List of views taken.
- Formal written interpretation.
- If flexion-extension views: document suspected instability and why standard views are insufficient.

AVERAGE REIMBURSEMENT (Global)
- Medicare: $48-$70
- Commercial: $70-$125
- PI/Auto: $100-$180

BUNDLING RULES
- Do not bill with 72040 (choose the code that matches your view count).
- Can bill same-day with E/M and CMT.

COMMON DENIAL REASONS
- View count does not match the code billed.
- No clinical reason documented for additional views.
- Missing formal interpretation.`,
      },
      {
        id: 'cpt-72070',
        title: 'X-Ray Thoracic Spine 2 Views',
        type: 'code',
        code: '72070',
        content: `CPT 72070 -- Radiologic Examination, Thoracic Spine, 2 Views

PLAIN ENGLISH
X-ray imaging of the thoracic spine with 2 views (typically AP and lateral).

WHEN TO USE
- Patient presents with mid-back complaints warranting radiographic evaluation.
- Indications: thoracic pain after trauma, suspected compression fracture (especially elderly/osteoporotic), scoliosis evaluation, ruling out pathology.
- Example: elderly patient with acute mid-back pain after a fall -- thoracic X-rays to rule out compression fracture.

WHEN NOT TO USE
- Do NOT order for routine thoracic complaints without clinical indication.
- Do NOT use if you took 3+ views -- use 72072.

DOCUMENTATION REQUIREMENTS
- Clinical indication for thoracic imaging.
- Views taken.
- Formal written interpretation.

AVERAGE REIMBURSEMENT (Global)
- Medicare: $32-$45
- Commercial: $45-$80
- PI/Auto: $65-$120

BUNDLING RULES
- Can bill same-day with cervical or lumbar X-ray codes (different spinal region).
- Can bill same-day with E/M and CMT.

COMMON DENIAL REASONS
- No clinical indication documented.
- Missing formal interpretation.
- Payer requires prior authorization.`,
      },
      {
        id: 'cpt-72100',
        title: 'X-Ray Lumbar Spine 2-3 Views',
        type: 'code',
        code: '72100',
        content: `CPT 72100 -- Radiologic Examination, Lumbar Spine, 2-3 Views

PLAIN ENGLISH
X-ray imaging of the lumbar spine with 2 or 3 views (typically AP and lateral, or AP, lateral, and spot lateral of L5-S1).

WHEN TO USE
- Patient presents with low back complaints requiring radiographic evaluation.
- Indications: trauma, suspected fracture, ruling out pathology, red flags (age >50 with new LBP, history of cancer, unexplained weight loss, neurological deficits), documenting subluxation for Medicare.
- Example: new patient with low back pain, age 55, to rule out degenerative changes and document subluxation.

WHEN NOT TO USE
- Do NOT order on every low back pain patient. Follow evidence-based imaging guidelines.
- Do NOT use if you took 4+ views -- use 72110.

DOCUMENTATION REQUIREMENTS
- Clinical indication for imaging.
- Views taken.
- Formal written interpretation with findings related to diagnosis and treatment.
- Compare to prior imaging if available.

AVERAGE REIMBURSEMENT (Global)
- Medicare: $38-$55
- Commercial: $55-$95
- PI/Auto: $80-$150

BUNDLING RULES
- Do not bill with 72110 (choose based on view count).
- Can bill same-day with other spinal region X-rays, E/M, and CMT.

COMMON DENIAL REASONS
- No documented clinical indication.
- Wrong view count code.
- Missing formal interpretation.
- Payer considers imaging premature (wants 4-6 weeks of conservative care first).`,
      },
      {
        id: 'cpt-72110',
        title: 'X-Ray Lumbar Spine 4+ Views',
        type: 'code',
        code: '72110',
        content: `CPT 72110 -- Radiologic Examination, Lumbar Spine, Complete (4+ Views)

PLAIN ENGLISH
Complete X-ray series of the lumbar spine with 4 or more views (e.g., AP, lateral, both obliques, and/or flexion-extension, and/or spot lateral).

WHEN TO USE
- Patient needs comprehensive lumbar radiographic evaluation.
- Indications: suspected spondylolisthesis (obliques/flexion-extension), pars defect, complex trauma, pre-surgical evaluation.
- Example: patient with anterolisthesis on lateral view; obliques and flexion-extension ordered to assess pars integrity and instability.

WHEN NOT TO USE
- Do NOT use if you took 2-3 views -- use 72100.
- Do NOT order a complete series without clinical justification for the additional views.

DOCUMENTATION REQUIREMENTS
- Clinical indication, especially for views beyond AP/lateral.
- List all views taken.
- Formal written interpretation.
- Document why a complete series was necessary.

AVERAGE REIMBURSEMENT (Global)
- Medicare: $50-$72
- Commercial: $75-$130
- PI/Auto: $100-$200

BUNDLING RULES
- Do not bill with 72100.
- Can bill with other spinal region codes.

COMMON DENIAL REASONS
- Clinical indication does not support a complete series.
- View count mismatch.
- Missing formal interpretation.`,
      },
      {
        id: 'cpt-72170',
        title: 'X-Ray Pelvis 1-2 Views',
        type: 'code',
        code: '72170',
        content: `CPT 72170 -- Radiologic Examination, Pelvis, 1-2 Views

PLAIN ENGLISH
X-ray imaging of the pelvis with 1 or 2 views (AP pelvis, and/or frog-leg lateral).

WHEN TO USE
- Patient presents with pelvic, sacroiliac, or hip complaints.
- Indications: suspected SI joint dysfunction, pelvic obliquity, hip pathology, leg length discrepancy evaluation, fracture rule-out.
- Example: patient with chronic SI joint pain; AP pelvis to evaluate joint symmetry and rule out pathology.

WHEN NOT TO USE
- Do NOT use for lumbar spine views -- those are 72100/72110.
- Do NOT bill 72170 AND a hip X-ray code if only a pelvis view was taken.

DOCUMENTATION REQUIREMENTS
- Clinical indication for pelvic imaging.
- Views taken.
- Formal written interpretation including pelvic landmarks, SI joints, hip joints, and relevant findings.

AVERAGE REIMBURSEMENT (Global)
- Medicare: $30-$42
- Commercial: $40-$75
- PI/Auto: $60-$110

BUNDLING RULES
- Can bill same-day with lumbar X-rays if different anatomical region.
- Can bill with E/M and CMT.
- Some payers bundle pelvis views into lumbar spine series.

COMMON DENIAL REASONS
- No clinical indication for pelvic imaging.
- Missing formal interpretation.
- Bundled into lumbar X-ray series by payer.`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SECTION 2: MODIFIER CHEAT SHEET
  // ---------------------------------------------------------------------------
  {
    id: 'modifiers',
    title: 'Modifier Cheat Sheet',
    description:
      'Quick reference for every modifier a chiropractic office needs. Each entry includes a one-sentence meaning, a real chiropractic example, and common mistakes to avoid.',
    items: [
      {
        id: 'mod-25',
        title: 'Modifier -25',
        type: 'modifier',
        code: '-25',
        content: `MODIFIER -25: Significant, Separately Identifiable E/M Service by the Same Physician on the Same Day of a Procedure

MEANING: Appended to an E/M code when the E/M service is above and beyond the usual pre-/post-procedure work on the same date as a procedure (CMT).

CHIROPRACTIC EXAMPLE: A patient presents for their regular adjustment but also reports new numbness in the left arm. You perform a separate neurological evaluation, assess the new complaint, and order an MRI. Bill 99213-25 + 98941. The -25 indicates the E/M was a distinct service from the adjustment visit.

COMMON MISTAKES:
- Billing -25 on every CMT visit without a separately identifiable service (audit trigger #1 in chiropractic).
- Using -25 on the CMT code instead of the E/M code.
- Documentation does not support a distinct E/M beyond the normal adjustment visit.`,
      },
      {
        id: 'mod-59',
        title: 'Modifier -59',
        type: 'modifier',
        code: '-59',
        content: `MODIFIER -59: Distinct Procedural Service

MEANING: Used to indicate that a procedure or service was distinct or independent from other services performed on the same day, overriding a National Correct Coding Initiative (NCCI) edit that would otherwise bundle the services.

CHIROPRACTIC EXAMPLE: You perform CMT (98941) and manual therapy (97140) on the same visit. The payer's CCI edits bundle 97140 into the CMT. You append -59 to 97140 to indicate the manual therapy targeted a different body area or a distinctly different condition from the adjustment. For instance, CMT to the lumbar spine for subluxation, and myofascial release to the cervical region for muscle spasm.

COMMON MISTAKES:
- Using -59 as a blanket unbundling modifier without clinical distinction (fraud risk).
- Not documenting the distinct nature of the services (different body area, different condition, or different session).
- Using -59 when an X-modifier (XE, XS, XP, XU) would be more specific -- CMS prefers X-modifiers over -59.`,
      },
      {
        id: 'mod-AT',
        title: 'Modifier -AT',
        type: 'modifier',
        code: '-AT',
        content: `MODIFIER -AT: Acute Treatment

MEANING: Required by Medicare on CMT codes (98940-98942) to indicate the treatment is for an acute condition and is medically necessary (i.e., NOT maintenance care).

CHIROPRACTIC EXAMPLE: A Medicare patient presents with acute exacerbation of lumbar pain after lifting a heavy object. You adjust L4-L5 and L5-S1. Bill 98940-AT. The AT modifier tells Medicare this adjustment is treating an active condition expected to improve, not maintaining function.

COMMON MISTAKES:
- Forgetting the -AT modifier on Medicare CMT claims (automatic denial).
- Using -AT on non-Medicare claims (most commercial payers do not use it and may reject the modifier).
- Billing -AT when the patient is clearly in a maintenance phase and not expected to improve -- this is a false claim.`,
      },
      {
        id: 'mod-GA',
        title: 'Modifier -GA',
        type: 'modifier',
        code: '-GA',
        content: `MODIFIER -GA: Waiver of Liability on File (ABN Signed)

MEANING: Indicates that a signed Advance Beneficiary Notice (ABN) is on file because the provider expects Medicare may deny the service as not medically necessary.

CHIROPRACTIC EXAMPLE: A Medicare patient wants to continue chiropractic care beyond the acute phase (maintenance care). You have the patient sign an ABN stating Medicare may not cover continued treatment. You bill 98940-GA. If Medicare denies, you can bill the patient because the ABN is on file.

COMMON MISTAKES:
- Using -GA without actually having a signed ABN on file (compliance violation).
- Using -GA on services that are categorically non-covered (use -GY instead).
- Not giving the patient the ABN before providing the service.`,
      },
      {
        id: 'mod-GY',
        title: 'Modifier -GY',
        type: 'modifier',
        code: '-GY',
        content: `MODIFIER -GY: Item or Service Statutorily Non-Covered

MEANING: Indicates that the service is categorically excluded from Medicare coverage -- it is never covered, regardless of circumstances.

CHIROPRACTIC EXAMPLE: A Medicare patient receives an extremity adjustment (98943). Since Medicare does not cover extremity manipulation at all, bill 98943-GY. This creates a denial on file, allowing you to bill the patient directly or send to secondary insurance.

COMMON MISTAKES:
- Using -GY on services that might be covered (should use -GA with ABN instead).
- Using -GY when -GA is appropriate (the service could be covered but you expect a denial for this specific patient).
- Not informing the patient before providing a non-covered service.`,
      },
      {
        id: 'mod-GP',
        title: 'Modifier -GP',
        type: 'modifier',
        code: '-GP',
        content: `MODIFIER -GP: Services Delivered Under an Outpatient Physical Therapy Plan of Care

MEANING: Required by Medicare on therapy codes (97110, 97140, 97112, etc.) to indicate the service was provided under a physical therapy plan of care.

CHIROPRACTIC EXAMPLE: A Medicare patient receives therapeutic exercises (97110) as part of their chiropractic treatment plan. You bill 97110-GP. Note: Medicare coverage of therapy services by chiropractors varies by jurisdiction and is extremely limited in most areas.

COMMON MISTAKES:
- Billing therapy codes to Medicare without understanding scope-of-practice limitations in your state.
- Using -GP on non-Medicare claims (not required and may cause confusion).
- Billing therapy codes to Medicare when your state does not allow chiropractors to bill these codes to Medicare.`,
      },
      {
        id: 'mod-KX',
        title: 'Modifier -KX',
        type: 'modifier',
        code: '-KX',
        content: `MODIFIER -KX: Requirements Specified in the Medical Policy Have Been Met

MEANING: Certifies that the provider has met all requirements set forth in a specific payer medical policy for coverage of a service.

CHIROPRACTIC EXAMPLE: A patient has exceeded the therapy cap threshold. You append -KX to therapy codes (97110-KX) to attest that the services are medically necessary and meet the exceptions criteria for services above the cap. Your documentation must support ongoing medical necessity.

COMMON MISTAKES:
- Using -KX without actually meeting the medical policy requirements.
- Failing to have supporting documentation for the medical necessity exception.
- Not understanding the specific payer policy that -KX is attesting to.`,
      },
      {
        id: 'mod-76',
        title: 'Modifier -76',
        type: 'modifier',
        code: '-76',
        content: `MODIFIER -76: Repeat Procedure by Same Physician

MEANING: Indicates that a procedure or service was repeated by the same physician on the same day after the original procedure.

CHIROPRACTIC EXAMPLE: A patient comes in for a morning appointment, receives a CMT, and then returns in the afternoon after a new injury (e.g., slip and fall at lunch). The second CMT on the same day is billed as 98941-76 to indicate it is a medically necessary repeat of the same procedure.

COMMON MISTAKES:
- Using -76 for multiple units of a timed service (that is not what it is for).
- Not documenting the clinical reason for the repeat procedure.
- Billing repeat CMT same-day without a clear new incident or clinical change.`,
      },
      {
        id: 'mod-XE',
        title: 'Modifier -XE',
        type: 'modifier',
        code: '-XE',
        content: `MODIFIER -XE: Separate Encounter

MEANING: A subset of the -59 modifier family. Indicates that the service is distinct because it occurred during a separate encounter on the same day.

CHIROPRACTIC EXAMPLE: A patient is seen in the morning for a CMT (98941) and returns in the afternoon for manual therapy (97140) due to a new flare-up. Bill 97140-XE to indicate the manual therapy was a separate encounter from the morning CMT, not a bundled same-visit service.

COMMON MISTAKES:
- Using -XE for services performed during the same encounter (use -XS or -59 instead).
- Not documenting separate encounter notes (separate check-in, separate SOAP note, separate time).
- Using -XE interchangeably with -59 without understanding the distinction.`,
      },
      {
        id: 'mod-XS',
        title: 'Modifier -XS',
        type: 'modifier',
        code: '-XS',
        content: `MODIFIER -XS: Separate Structure

MEANING: A subset of the -59 modifier family. Indicates that the service is distinct because it was performed on a separate anatomical structure.

CHIROPRACTIC EXAMPLE: You perform CMT to the lumbar spine (98941) and manual therapy (97140) to the cervical spine on the same visit. The CCI edits bundle 97140 into CMT. You append -XS to 97140 to indicate it was performed on a separate structure (cervical vs. lumbar).

COMMON MISTAKES:
- Using -XS when both services are on the same body region.
- Not documenting the separate structures in the clinical note.
- CMS prefers -XS over -59 when the distinction is anatomical -- using -59 when -XS is appropriate may be flagged.`,
      },
      {
        id: 'mod-XP',
        title: 'Modifier -XP',
        type: 'modifier',
        code: '-XP',
        content: `MODIFIER -XP: Separate Practitioner

MEANING: A subset of the -59 modifier family. Indicates that the service is distinct because it was performed by a different practitioner.

CHIROPRACTIC EXAMPLE: In a multi-doctor office, Dr. Smith performs the CMT (98941) and Dr. Jones performs the manual therapy (97140) on the same patient on the same day. Bill 97140-XP under Dr. Jones's NPI to indicate a separate practitioner provided the service.

COMMON MISTAKES:
- Using -XP when the same provider performed both services.
- Not ensuring each provider has separate documentation and separate NPI billing.
- Using -XP to circumvent bundling edits for services actually performed by one provider.`,
      },
      {
        id: 'mod-XU',
        title: 'Modifier -XU',
        type: 'modifier',
        code: '-XU',
        content: `MODIFIER -XU: Unusual Non-Overlapping Service

MEANING: A subset of the -59 modifier family. Indicates that the service does not overlap with the usual components of the main service and is unusual or distinctive.

CHIROPRACTIC EXAMPLE: You perform CMT (98941) and, separately, provide neuromuscular re-education (97112) on the same visit. While CCI edits may bundle 97112 into CMT, the neuromuscular re-education addresses a distinct functional deficit (e.g., proprioceptive training for balance) that does not overlap with the spinal adjustment. Bill 97112-XU.

COMMON MISTAKES:
- Using -XU when -XS or -XE would be more appropriate and specific.
- Not documenting why the service is unusual or non-overlapping.
- Overusing -XU as a catch-all unbundling modifier.`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SECTION 3: INSURANCE VERIFICATION SCRIPTS
  // ---------------------------------------------------------------------------
  {
    id: 'verification',
    title: 'Insurance Verification Scripts',
    description:
      'Word-for-word scripts your front desk can read when calling payers for verification, pre-authorization, and re-verification. Plus a verification form template to capture all critical data points.',
    items: [
      {
        id: 'script-new-patient',
        title: 'New Patient Verification Call Script',
        type: 'script',
        content: `NEW PATIENT INSURANCE VERIFICATION CALL SCRIPT

[Before calling, have ready: patient's insurance card (front and back), date of birth, and the provider's NPI and Tax ID.]

OPENING:
"Hello, my name is [YOUR NAME] calling from [PRACTICE NAME]. I'm calling to verify chiropractic benefits for a new patient. May I have your name and reference number for this call, please?"

[Record representative name and reference number.]

ELIGIBILITY:
"The subscriber's name is [SUBSCRIBER NAME], date of birth [DOB], member ID [MEMBER ID], group number [GROUP NUMBER]. Can you confirm this policy is currently active?"

[If active, continue. If not, stop and contact the patient.]

CHIROPRACTIC BENEFITS:
"Does this plan include chiropractic benefits?"
"Is there a separate chiropractic rider, or is it included in the base plan?"
"Is there a visit limit per calendar year or benefit period? If so, how many visits have been used?"
"Is prior authorization required for chiropractic services?"
"What is the effective date of chiropractic benefits?"

FINANCIAL DETAILS:
"What is the annual deductible, and how much has been met?"
"What is the copay or coinsurance for chiropractic office visits?"
"What is the copay or coinsurance for chiropractic therapies (CPT 97110, 97140, 97112)?"
"Is there a separate deductible for out-of-network providers?"
"What is the out-of-pocket maximum, and how much has been met?"

COVERED SERVICES:
"Are the following CPT codes covered under this plan?"
  - 98940, 98941 (CMT)
  - 99203, 99213 (E/M)
  - 97140 (manual therapy)
  - 97110 (therapeutic exercise)
  - 72100 (lumbar X-ray)
"Are X-rays covered when performed in a chiropractic office, or do they require referral to a radiology center?"
"Are exams and re-exams covered separately from the adjustment?"

CLAIMS INFORMATION:
"What is the correct claims mailing address or electronic payer ID?"
"What is the timely filing deadline?"
"Is this plan subject to any state mandates for chiropractic coverage?"

CLOSING:
"Thank you, [REP NAME]. Just to confirm, the reference number for this call is [REF NUMBER]. Is there anything else I should know about this member's chiropractic benefits?"

[Document everything in the patient's file immediately after the call.]`,
      },
      {
        id: 'script-preauth',
        title: 'Pre-Authorization Request Script',
        type: 'script',
        content: `PRE-AUTHORIZATION REQUEST CALL SCRIPT

[Before calling, have ready: patient demographics, insurance info, diagnosis codes, requested CPT codes, clinical notes supporting medical necessity, and the provider's NPI.]

OPENING:
"Hello, my name is [YOUR NAME] calling from [PRACTICE NAME], Dr. [PROVIDER NAME], NPI [NPI NUMBER]. I need to request prior authorization for chiropractic services. May I have your name and reference number?"

[Record representative name and reference number.]

PATIENT INFORMATION:
"The patient is [PATIENT NAME], date of birth [DOB], member ID [MEMBER ID]. The diagnosis is [PRIMARY DIAGNOSIS AND ICD-10 CODE], with secondary diagnoses of [SECONDARY DIAGNOSES IF APPLICABLE]."

REQUEST DETAILS:
"I am requesting authorization for the following services:"
  - "[NUMBER] visits of chiropractic manipulative treatment (98940/98941)"
  - "[NUMBER] units of manual therapy (97140)"
  - "[NUMBER] units of therapeutic exercise (97110)"
  - "Over a period of [NUMBER] weeks"
  - "Frequency of [NUMBER] times per week"

CLINICAL JUSTIFICATION:
"The clinical justification for this request is as follows:"
  - "The patient presents with [CHIEF COMPLAINT]."
  - "Objective findings include [KEY EXAM FINDINGS: ROM deficits, orthopedic test results, neurological findings]."
  - "The patient's functional limitations include [SPECIFIC FUNCTIONAL DEFICITS: difficulty sitting >20 min, unable to lift >10 lbs, etc.]."
  - "The treatment goals are [MEASURABLE GOALS: increase cervical ROM by 20%, reduce pain from 8/10 to 4/10, return to work within 6 weeks]."
  - "The expected duration of treatment is [NUMBER] weeks."

IF THEY REQUIRE WRITTEN SUBMISSION:
"Can you provide the fax number or portal URL for submitting clinical documentation?"
"What specific documentation do you need included?"
"What is the turnaround time for authorization decisions?"
"Is there a peer-to-peer review option if the initial request is denied?"

CLOSING:
"Thank you, [REP NAME]. The reference number is [REF NUMBER]. When can I expect a decision? Is there a number to call to check on the status?"

[Submit any required documentation within 24 hours. Follow up if no response within the stated timeframe.]`,
      },
      {
        id: 'script-reverification',
        title: 'Re-Verification Script',
        type: 'script',
        content: `RE-VERIFICATION CALL SCRIPT (Every 30 Days or Upon Benefit Change)

OPENING:
"Hello, my name is [YOUR NAME] calling from [PRACTICE NAME]. I'm calling to re-verify chiropractic benefits for an active patient. May I have your name and reference number?"

PATIENT INFO:
"The patient is [PATIENT NAME], DOB [DOB], member ID [MEMBER ID]."

KEY QUESTIONS:
"Is this policy still active as of today's date?"
"Has there been any change to the chiropractic benefit since [DATE OF LAST VERIFICATION]?"
"How many chiropractic visits have been used this benefit period?"
"How many visits remain?"
"Has the deductible been met? If not, how much remains?"
"Is there an active authorization on file? If so, what is the auth number and how many visits remain on the auth?"
"Has the plan renewed or changed? What is the current benefit period?"
"Are there any pending claims or denials on file for this patient?"

CLOSING:
"Thank you, [REP NAME]. Reference number [REF NUMBER]. I appreciate your help."

[Update the patient's file. Flag any changes that affect coverage or patient financial responsibility. Notify the patient of any changes before their next visit.]`,
      },
      {
        id: 'template-verification-form',
        title: 'Verification Form Template',
        type: 'script',
        content: `INSURANCE VERIFICATION FORM

Date of Verification: _______________
Verified By: ________________________
Insurance Company: __________________
Phone Number Called: _________________
Representative Name: ________________
Reference/Call Number: _______________

--- PATIENT INFORMATION ---
Patient Name: _______________________
Date of Birth: ______________________
Subscriber Name: ____________________
Member ID: __________________________
Group Number: _______________________
Policy Effective Date: _______________

--- ELIGIBILITY ---
[ ] Policy Active  [ ] Policy Inactive
Plan Type: [ ] HMO  [ ] PPO  [ ] POS  [ ] EPO  [ ] Medicare  [ ] Medicaid  [ ] Other
Is Provider In-Network? [ ] Yes  [ ] No

--- CHIROPRACTIC BENEFITS ---
Chiropractic Covered? [ ] Yes  [ ] No  [ ] Rider Required
Visit Limit Per Year: _______ visits
Visits Used YTD: _______ visits
Visits Remaining: _______ visits
Prior Auth Required? [ ] Yes  [ ] No
Auth Number (if applicable): _______________
Auth Visits Approved: _______
Auth Expiration Date: _______________

--- FINANCIAL ---
Annual Deductible: $________
Deductible Met: $________
Remaining Deductible: $________
Copay (CMT): $________
Copay (Therapies): $________
Coinsurance: ________%
Out-of-Pocket Max: $________
OOP Met: $________

--- COVERED SERVICES ---
CMT (98940-98942): [ ] Covered  [ ] Not Covered
E/M (99202-99215): [ ] Covered  [ ] Not Covered
Manual Therapy (97140): [ ] Covered  [ ] Not Covered
Therapeutic Exercise (97110): [ ] Covered  [ ] Not Covered
Neuromuscular Re-ed (97112): [ ] Covered  [ ] Not Covered
X-Rays: [ ] Covered In-Office  [ ] Referral Required  [ ] Not Covered
E-Stim (97014): [ ] Covered  [ ] Not Covered
Extremity CMT (98943): [ ] Covered  [ ] Not Covered

--- CLAIMS ---
Claims Address: _____________________
Electronic Payer ID: ________________
Timely Filing Limit: _______ days
Secondary Insurance? [ ] Yes  [ ] No
  If Yes, Carrier: __________________

--- NOTES ---
_____________________________________
_____________________________________
_____________________________________`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SECTION 4: DENIAL APPEAL LETTERS
  // ---------------------------------------------------------------------------
  {
    id: 'appeals',
    title: 'Denial Appeal Letters',
    description:
      'Professionally crafted appeal letter templates for the five most common denial scenarios in chiropractic billing. Each letter includes bracketed placeholders for patient-specific information.',
    items: [
      {
        id: 'appeal-medical-necessity',
        title: 'Medical Necessity Denial Appeal',
        type: 'letter',
        content: `[PRACTICE LETTERHEAD]

[DATE]

[INSURANCE COMPANY NAME]
[APPEALS DEPARTMENT]
[STREET ADDRESS]
[CITY, STATE ZIP]

RE: Appeal of Medical Necessity Denial
Patient: [PATIENT FULL NAME]
Date of Birth: [PATIENT DOB]
Member ID: [MEMBER ID]
Group Number: [GROUP NUMBER]
Claim Number: [CLAIM NUMBER]
Date(s) of Service: [DOS]
Denied CPT Code(s): [CPT CODES]

Dear Appeals Review Committee:

I am writing to formally appeal the denial of chiropractic services for the above-referenced patient on the basis of medical necessity. The denial letter dated [DENIAL DATE] states that the services were "not medically necessary." After careful review of the clinical record, I respectfully disagree with this determination and provide the following documentation in support of medical necessity.

CLINICAL PRESENTATION:
[PATIENT NAME] presented to our office on [INITIAL VISIT DATE] with [CHIEF COMPLAINT]. The patient reported [SYMPTOM DESCRIPTION, DURATION, AND SEVERITY]. Functional limitations at the time of presentation included [SPECIFIC FUNCTIONAL LIMITATIONS: e.g., inability to sit for more than 15 minutes, difficulty performing activities of daily living, inability to work]. The patient rated their pain at [PAIN LEVEL]/10 on the Visual Analog Scale.

OBJECTIVE FINDINGS:
Physical examination revealed [RELEVANT EXAM FINDINGS: decreased range of motion with specific measurements, positive orthopedic tests with test names, palpatory findings, neurological findings]. [IF APPLICABLE: Diagnostic imaging revealed [X-RAY/MRI FINDINGS]]. These findings are consistent with the diagnoses of [ICD-10 CODES AND DESCRIPTIONS].

TREATMENT PROVIDED AND RESPONSE:
The patient has received [NUMBER] visits of chiropractic care consisting of [SERVICES PROVIDED]. Treatment has resulted in [DOCUMENTED IMPROVEMENTS: e.g., increased cervical ROM from 30 degrees flexion to 50 degrees flexion, decreased pain from 8/10 to 5/10, improved ability to sit for 30 minutes vs. 15 minutes at baseline]. These objective improvements demonstrate that the patient is responding to care and has not yet reached maximum therapeutic benefit.

EVIDENCE BASIS:
The treatment provided is consistent with evidence-based guidelines including [CITE RELEVANT GUIDELINES: e.g., the American College of Physicians guidelines for non-pharmacologic treatment of low back pain, Optum/BCBS chiropractic clinical guidelines, peer-reviewed literature]. Chiropractic manipulative treatment is recognized as a first-line conservative therapy for [CONDITION].

CONCLUSION:
The clinical record clearly demonstrates that [PATIENT NAME]'s condition is active, the patient is making measurable progress, and continued chiropractic treatment is medically necessary to achieve functional improvement. I respectfully request that this denial be overturned and the submitted claims be processed for payment.

Enclosed documentation:
- Complete clinical notes for dates of service in question
- Initial examination and re-examination reports
- [DIAGNOSTIC IMAGING REPORTS IF APPLICABLE]
- Treatment plan with measurable goals

Please do not hesitate to contact our office at [PHONE NUMBER] should you require additional information or wish to arrange a peer-to-peer review.

Sincerely,

[PROVIDER NAME], [CREDENTIALS]
[NPI NUMBER]
[PRACTICE NAME]
[PHONE NUMBER]
[FAX NUMBER]`,
      },
      {
        id: 'appeal-visit-limit',
        title: 'Visit Limit Exceeded Appeal',
        type: 'letter',
        content: `[PRACTICE LETTERHEAD]

[DATE]

[INSURANCE COMPANY NAME]
[APPEALS DEPARTMENT]
[STREET ADDRESS]
[CITY, STATE ZIP]

RE: Appeal of Denial -- Visit Limit Exceeded
Patient: [PATIENT FULL NAME]
Date of Birth: [PATIENT DOB]
Member ID: [MEMBER ID]
Group Number: [GROUP NUMBER]
Claim Number: [CLAIM NUMBER]
Date(s) of Service: [DOS]

Dear Appeals Review Committee:

I am writing to formally appeal the denial of chiropractic services for [PATIENT NAME] based on the stated reason that the plan's visit limit of [VISIT LIMIT NUMBER] visits per [BENEFIT PERIOD] has been exhausted. While I understand the plan imposes visit limitations, I am requesting an exception based on the documented medical necessity and clinical complexity of this case.

CLINICAL COMPLEXITY:
This patient's condition is more complex than a typical musculoskeletal complaint. [PATIENT NAME] presents with [DIAGNOSES AND ICD-10 CODES], complicated by [COMPLICATING FACTORS: e.g., comorbid conditions, prior surgical history, severity of injury, multi-regional involvement, age-related factors, occupational demands]. These factors necessitate a longer course of treatment than the plan's standard visit allowance.

TREATMENT PROGRESS AND CURRENT STATUS:
Over the course of [NUMBER] visits to date, the patient has demonstrated the following measurable improvements:
- Pain: Decreased from [BASELINE] to [CURRENT LEVEL] on the VAS
- Range of Motion: [SPECIFIC IMPROVEMENTS WITH MEASUREMENTS]
- Functional Status: [SPECIFIC FUNCTIONAL IMPROVEMENTS]
- [OUTCOME ASSESSMENT TOOL]: Score improved from [BASELINE SCORE] to [CURRENT SCORE]

Despite these improvements, the patient has not yet reached maximum therapeutic benefit. Current objective findings include [REMAINING DEFICITS], indicating that continued treatment is necessary to achieve the documented treatment goals.

REMAINING TREATMENT PLAN:
I am requesting an additional [NUMBER] visits over [NUMBER] weeks to achieve the following goals:
- [GOAL 1: e.g., Restore cervical flexion to within normal limits (>50 degrees)]
- [GOAL 2: e.g., Reduce pain to 2/10 or less on VAS]
- [GOAL 3: e.g., Return to full work duties without restriction]

Without continued treatment, the patient is at risk of [CONSEQUENCES: regression of gains, chronic pain development, need for more invasive/costly intervention, surgical referral, increased medication dependence].

COST-EFFECTIVENESS:
Continued chiropractic care at approximately $[COST PER VISIT] per visit is significantly more cost-effective than the alternatives, which may include [ALTERNATIVES: surgical consultation ($[COST]), MRI ($[COST]), prescription pain management ($[MONTHLY COST]/month), emergency department visits ($[COST])]. Allowing additional visits represents a sound investment in the patient's recovery and long-term cost savings.

I respectfully request that [NUMBER] additional visits be authorized to allow this patient to reach their treatment goals. Enclosed please find complete clinical documentation supporting this request.

Sincerely,

[PROVIDER NAME], [CREDENTIALS]
[NPI NUMBER]
[PRACTICE NAME]
[PHONE NUMBER]`,
      },
      {
        id: 'appeal-bundling',
        title: 'Bundling/CCI Edit Denial Appeal',
        type: 'letter',
        content: `[PRACTICE LETTERHEAD]

[DATE]

[INSURANCE COMPANY NAME]
[APPEALS DEPARTMENT]
[STREET ADDRESS]
[CITY, STATE ZIP]

RE: Appeal of Denial -- Incorrect Bundling of Services
Patient: [PATIENT FULL NAME]
Date of Birth: [PATIENT DOB]
Member ID: [MEMBER ID]
Claim Number: [CLAIM NUMBER]
Date(s) of Service: [DOS]
Denied CPT Code(s): [DENIED CODES]

Dear Appeals Review Committee:

I am writing to appeal the denial of [DENIED CPT CODE(S)] on date of service [DOS] for patient [PATIENT NAME]. The denial states that [DENIED CODE] is bundled into [PRIMARY CODE] per Correct Coding Initiative (CCI) edits. I respectfully submit that the services were distinct and separately identifiable, warranting independent reimbursement.

DISTINCT SERVICE DOCUMENTATION:
The services billed on [DOS] were as follows:
1. [PRIMARY CODE AND DESCRIPTION] -- provided to [BODY REGION/PURPOSE]
2. [DENIED CODE AND DESCRIPTION] -- provided to [DIFFERENT BODY REGION/PURPOSE]

These services are distinct for the following reason(s):

[ ] SEPARATE ANATOMICAL STRUCTURE (Modifier -XS):
[PRIMARY CODE] was performed on the [BODY REGION 1], while [DENIED CODE] was performed on the [BODY REGION 2]. The clinical note clearly documents separate findings, treatment rationale, and interventions for each anatomical region.

[ ] SEPARATE ENCOUNTER (Modifier -XE):
The services were provided during separate encounters on the same day. [PRIMARY CODE] was performed at [TIME 1], and [DENIED CODE] was performed at [TIME 2] due to [CLINICAL REASON FOR SEPARATE ENCOUNTER].

[ ] UNUSUAL NON-OVERLAPPING SERVICE (Modifier -XU):
The [DENIED CODE] addressed a functionally distinct clinical need that does not overlap with the components of [PRIMARY CODE]. Specifically, [EXPLAIN HOW THE SERVICES ARE NON-OVERLAPPING].

CLINICAL RATIONALE:
[DETAILED EXPLANATION of why both services were medically necessary and clinically distinct. Include specific exam findings, treatment techniques used, body areas treated, and clinical goals for each service.]

CCI EDIT CONSIDERATION:
CCI edits allow for separate billing of these services when appropriate modifiers are applied and clinical documentation supports the distinct nature of the services. The National Correct Coding Initiative Policy Manual, Chapter 1, Section D, states that modifier indicators of "1" permit the use of modifiers to bypass edits when services are truly distinct. The CCI modifier indicator for [CODE PAIR] is [0 or 1], which [does/does not] permit modifier use. [IF INDICATOR IS 1: This confirms that separate billing is appropriate when clinical documentation supports distinct services.]

I respectfully request that the denied claim be reprocessed with the enclosed clinical documentation demonstrating that the services were separately identifiable. The appropriate modifier [MODIFIER] has been appended to the corrected claim.

Enclosed: Clinical notes, corrected claim form.

Sincerely,

[PROVIDER NAME], [CREDENTIALS]
[NPI NUMBER]
[PRACTICE NAME]
[PHONE NUMBER]`,
      },
      {
        id: 'appeal-prior-auth',
        title: 'Prior Authorization Denial Appeal',
        type: 'letter',
        content: `[PRACTICE LETTERHEAD]

[DATE]

[INSURANCE COMPANY NAME]
[APPEALS DEPARTMENT]
[STREET ADDRESS]
[CITY, STATE ZIP]

RE: Appeal of Denial -- Retroactive Authorization Request
Patient: [PATIENT FULL NAME]
Date of Birth: [PATIENT DOB]
Member ID: [MEMBER ID]
Claim Number: [CLAIM NUMBER]
Date(s) of Service: [DOS]
Authorization Number (if applicable): [AUTH NUMBER OR "N/A"]

Dear Appeals Review Committee:

I am writing to appeal the denial of chiropractic services for [PATIENT NAME] on the basis that prior authorization was not obtained before services were rendered. I am requesting retroactive authorization and reprocessing of the denied claim(s) based on the circumstances outlined below.

CIRCUMSTANCES:
[SELECT AND CUSTOMIZE THE APPLICABLE SCENARIO:]

SCENARIO A -- EMERGENCY/URGENT CARE:
The patient presented to our office on [DOS] with [ACUTE CONDITION: e.g., severe acute low back pain with radicular symptoms following a workplace injury]. The severity and urgency of the patient's condition required immediate intervention. The patient was in [DESCRIBE SEVERITY: e.g., significant distress, unable to stand upright, pain rated 9/10]. Delaying treatment to obtain prior authorization would have [CONSEQUENCE: e.g., resulted in worsening of the condition, prolonged disability, unnecessary emergency room visit]. Treatment was provided on an urgent basis, and authorization is being requested retroactively.

SCENARIO B -- AUTHORIZATION MISCOMMUNICATION:
Our office contacted [INSURANCE COMPANY] on [DATE OF VERIFICATION CALL] and spoke with [REPRESENTATIVE NAME], reference number [REFERENCE NUMBER]. During this call, we were informed that [WHAT WAS COMMUNICATED: e.g., prior authorization was not required for chiropractic services / authorization was approved verbally]. Based on this information provided by your representative, services were rendered in good faith. The subsequent denial for lack of prior authorization contradicts the information provided by your own representative. We request that the claim be honored based on the information provided during the verified call.

SCENARIO C -- RETROACTIVE AUTHORIZATION POLICY:
Your plan's policy allows for retroactive authorization requests within [NUMBER] days of the date of service. This appeal is being submitted within that timeframe. The enclosed clinical documentation demonstrates that the services provided were medically necessary and would have met the criteria for prospective authorization had it been requested.

MEDICAL NECESSITY DOCUMENTATION:
Regardless of the authorization circumstances, the services provided were medically necessary. The patient presented with [DIAGNOSIS/ICD-10], and examination revealed [KEY FINDINGS]. Treatment consisting of [SERVICES PROVIDED] was appropriate and consistent with evidence-based clinical guidelines. Complete clinical documentation is enclosed.

I respectfully request that retroactive authorization be granted and the denied claims be reprocessed for payment. I am available for a peer-to-peer review at [PHONE NUMBER] if needed.

Sincerely,

[PROVIDER NAME], [CREDENTIALS]
[NPI NUMBER]
[PRACTICE NAME]
[PHONE NUMBER]`,
      },
      {
        id: 'appeal-out-of-network',
        title: 'Out-of-Network Denial Appeal',
        type: 'letter',
        content: `[PRACTICE LETTERHEAD]

[DATE]

[INSURANCE COMPANY NAME]
[APPEALS DEPARTMENT]
[STREET ADDRESS]
[CITY, STATE ZIP]

RE: Appeal for Out-of-Network Benefit Consideration
Patient: [PATIENT FULL NAME]
Date of Birth: [PATIENT DOB]
Member ID: [MEMBER ID]
Claim Number: [CLAIM NUMBER]
Date(s) of Service: [DOS]

Dear Appeals Review Committee:

I am writing to appeal the denial or reduced reimbursement of chiropractic services for [PATIENT NAME] based on out-of-network provider status. I am requesting that these services be reprocessed at the in-network benefit level based on the following circumstances.

NETWORK ADEQUACY:
[PATIENT NAME] resides in [CITY, STATE, ZIP CODE]. A review of your provider directory reveals that [SELECT AND CUSTOMIZE]:

[ ] There are no in-network chiropractic providers within [NUMBER] miles of the patient's residence. The nearest in-network chiropractor is located [DISTANCE] miles away in [CITY], which represents an unreasonable travel burden for a patient requiring [FREQUENCY] visits per week.

[ ] The in-network chiropractic providers within a reasonable distance are [NOT ACCEPTING NEW PATIENTS / HAVE WAIT TIMES EXCEEDING [NUMBER] WEEKS / DO NOT OFFER THE SPECIALIZED SERVICES REQUIRED BY THIS PATIENT]. We contacted the following in-network providers and documented the following:
  - [PROVIDER 1 NAME]: [REASON UNAVAILABLE]
  - [PROVIDER 2 NAME]: [REASON UNAVAILABLE]
  - [PROVIDER 3 NAME]: [REASON UNAVAILABLE]

Under [STATE] network adequacy laws and/or your plan's out-of-network exception policy, when a plan cannot provide reasonable access to in-network providers, the plan is required to cover out-of-network services at the in-network benefit level.

CONTINUITY OF CARE:
[IF APPLICABLE:] [PATIENT NAME] has been under my care since [DATE] for [CONDITION]. Requiring the patient to transfer to a new provider at this stage of treatment would [DISRUPT CONTINUITY OF CARE / DELAY RECOVERY / REQUIRE DUPLICATIVE EXAMINATION AND TESTING]. The patient has established a treatment relationship, and transferring care would not be in the patient's best clinical interest.

SPECIALIZED SERVICES:
[IF APPLICABLE:] The patient requires [SPECIALIZED TECHNIQUE OR SERVICE: e.g., Cox Flexion-Distraction for disc herniation, certified spinal trauma care for MVA injuries, pediatric chiropractic]. This specialized service is not available from in-network providers in the patient's area. Our office has [RELEVANT CREDENTIALS OR CERTIFICATIONS].

SERVICES PROVIDED:
The services rendered on [DOS] consisted of [CPT CODES AND DESCRIPTIONS] for the diagnoses of [ICD-10 CODES AND DESCRIPTIONS]. The total charges billed were $[AMOUNT]. These charges are consistent with the [UCR / FAIR HEALTH / MEDICARE] fee schedule for this geographic area.

I respectfully request that the claims for [DOS] be reprocessed at the in-network benefit level, or that a single-case agreement be established for this patient's ongoing care. I am willing to accept [YOUR PROPOSED RATE: e.g., the in-network fee schedule rate, Medicare rate + 20%] as full payment for covered services.

Enclosed: Clinical notes, provider directory search results, and documentation of in-network provider unavailability.

Sincerely,

[PROVIDER NAME], [CREDENTIALS]
[NPI NUMBER]
[PRACTICE NAME]
[PHONE NUMBER]`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SECTION 5: SUPERBILL TEMPLATE
  // ---------------------------------------------------------------------------
  {
    id: 'superbill',
    title: 'Superbill Template',
    description:
      'A complete chiropractic superbill template with all commonly used CPT codes and 30+ ICD-10 diagnosis codes. Ready to be formatted for print or used as a digital charge capture tool.',
    items: [
      {
        id: 'superbill-main',
        title: 'Complete Chiropractic Superbill',
        type: 'template',
        content: `CHIROPRACTIC SUPERBILL / ENCOUNTER FORM

====================================================================
PRACTICE INFORMATION
====================================================================
Practice Name: ________________________________
Address: ______________________________________
City/State/ZIP: _______________________________
Phone: ________________  Fax: _________________
Tax ID: _______________  NPI: _________________

====================================================================
PATIENT INFORMATION
====================================================================
Patient Name: _________________________________
Date of Birth: ____________  Sex: [ ] M  [ ] F
Address: ______________________________________
Phone: ________________
Insurance: ____________________________________
Member ID: _______________  Group #: ___________
Referring Provider: ___________________________
Authorization #: ______________  Visits Auth: ___

====================================================================
VISIT INFORMATION
====================================================================
Date of Service: ______________
Provider: _____________________________________
Provider NPI: _________________________________

Visit Type:
[ ] New Patient    [ ] Established Patient
[ ] Re-Examination [ ] Discharge

Accident Related?
[ ] No  [ ] Auto (Date: ______)  [ ] Work (Date: ______)  [ ] Other

====================================================================
E/M CODES                                    FEE    UNITS
====================================================================
NEW PATIENT:
[ ] 99202  Office Visit - Level 2           $___    ___
[ ] 99203  Office Visit - Level 3           $___    ___
[ ] 99204  Office Visit - Level 4           $___    ___
[ ] 99205  Office Visit - Level 5           $___    ___

ESTABLISHED PATIENT:
[ ] 99212  Office Visit - Level 2           $___    ___
[ ] 99213  Office Visit - Level 3           $___    ___
[ ] 99214  Office Visit - Level 4           $___    ___
[ ] 99215  Office Visit - Level 5           $___    ___

====================================================================
CMT CODES                                    FEE    UNITS
====================================================================
[ ] 98940  CMT, 1-2 Spinal Regions          $___    ___
[ ] 98941  CMT, 3-4 Spinal Regions          $___    ___
[ ] 98942  CMT, 5 Spinal Regions            $___    ___
[ ] 98943  CMT, Extraspinal                 $___    ___

Regions Treated:
[ ] Cervical  [ ] Thoracic  [ ] Lumbar  [ ] Sacral  [ ] Pelvic
Extraspinal: ________________________________

====================================================================
THERAPEUTIC PROCEDURES (Timed - 15 min units)  FEE   UNITS  MINUTES
====================================================================
[ ] 97110  Therapeutic Exercises             $___    ___    ___
[ ] 97112  Neuromuscular Re-education        $___    ___    ___
[ ] 97140  Manual Therapy Techniques         $___    ___    ___
[ ] 97530  Therapeutic Activities            $___    ___    ___
[ ] 97542  Wheelchair Management             $___    ___    ___

====================================================================
MODALITIES - ATTENDED (Timed - 15 min units)   FEE   UNITS  MINUTES
====================================================================
[ ] 97032  Electrical Stimulation (attended)  $___    ___    ___
[ ] 97033  Iontophoresis                      $___    ___    ___
[ ] 97035  Ultrasound                         $___    ___    ___

====================================================================
MODALITIES - UNATTENDED (Untimed)              FEE   UNITS
====================================================================
[ ] 97010  Hot/Cold Packs                     $___    ___
[ ] 97014  Electrical Stimulation (unattended)$___    ___
[ ] 97012  Mechanical Traction                $___    ___

====================================================================
TESTING / EVALUATION                           FEE   UNITS
====================================================================
[ ] 95851  Range of Motion Testing            $___    ___
[ ] 95831  Manual Muscle Testing              $___    ___
[ ] 97750  Physical Performance Test          $___    ___
[ ] 97755  Assistive Technology Assessment    $___    ___

====================================================================
X-RAY CODES                                   FEE   UNITS
====================================================================
CERVICAL:
[ ] 72040  Cervical Spine, 2-3 views         $___    ___
[ ] 72050  Cervical Spine, 4-5 views         $___    ___
[ ] 72052  Cervical Spine, 6+ views          $___    ___

THORACIC:
[ ] 72070  Thoracic Spine, 2 views           $___    ___
[ ] 72072  Thoracic Spine, 3 views           $___    ___
[ ] 72074  Thoracic Spine, 4+ views          $___    ___

LUMBAR:
[ ] 72100  Lumbar Spine, 2-3 views           $___    ___
[ ] 72110  Lumbar Spine, 4+ views            $___    ___

PELVIS / OTHER:
[ ] 72170  Pelvis, 1-2 views                 $___    ___
[ ] 72200  SI Joints, <3 views               $___    ___
[ ] 77080  DEXA Scan                         $___    ___

====================================================================
ICD-10 DIAGNOSIS CODES
====================================================================

CERVICAL:
[ ] M54.2   Cervicalgia (neck pain)
[ ] M54.12  Radiculopathy, cervical region
[ ] M50.120 Cervical disc disorder w/ radiculopathy, mid-cervical
[ ] M50.20  Other cervical disc displacement, mid-cervical
[ ] M47.812 Spondylosis w/o myelopathy, cervical
[ ] M43.12  Spondylolisthesis, cervical
[ ] S13.4XXA Sprain of cervical spine, initial encounter
[ ] M53.0   Cervicocranial syndrome

THORACIC:
[ ] M54.6   Pain in thoracic spine
[ ] M54.14  Radiculopathy, thoracic region
[ ] M51.14  Intervertebral disc disorder w/ radiculopathy, thoracic
[ ] M47.814 Spondylosis w/o myelopathy, thoracic
[ ] M41.20  Other idiopathic scoliosis, site unspecified

LUMBAR:
[ ] M54.5   Low back pain
[ ] M54.16  Radiculopathy, lumbar region
[ ] M54.17  Radiculopathy, lumbosacral region
[ ] M51.16  Intervertebral disc disorder w/ radiculopathy, lumbar
[ ] M51.17  Intervertebral disc disorder w/ radiculopathy, lumbosacral
[ ] M51.26  Other intervertebral disc displacement, lumbar
[ ] M51.27  Other intervertebral disc displacement, lumbosacral
[ ] M47.816 Spondylosis w/o myelopathy, lumbar
[ ] M47.817 Spondylosis w/o myelopathy, lumbosacral
[ ] M43.16  Spondylolisthesis, lumbar
[ ] M53.3   Sacrococcygeal disorders, NEC

SACROILIAC / PELVIS:
[ ] M53.2X6 Spinal instabilities, lumbar region
[ ] M46.1   Sacroiliitis, not elsewhere classified
[ ] M53.3   Sacrococcygeal disorders, NEC

MUSCLE / SOFT TISSUE:
[ ] M62.830 Muscle spasm of back
[ ] M79.1   Myalgia
[ ] M79.3   Panniculitis, unspecified

HEADACHE:
[ ] R51.9   Headache, unspecified
[ ] M53.0   Cervicocranial syndrome
[ ] G44.1   Vascular headache, NEC
[ ] G43.909 Migraine, unspecified, not intractable

EXTREMITY:
[ ] M25.511 Pain in right shoulder
[ ] M25.512 Pain in left shoulder
[ ] M25.561 Pain in right knee
[ ] M25.562 Pain in left knee
[ ] M77.10  Lateral epicondylitis, unspecified elbow
[ ] M76.60  Achilles tendinitis, unspecified

OTHER:
[ ] G89.29  Other chronic pain
[ ] G89.11  Acute pain due to trauma
[ ] S39.012A Strain of muscle of lower back, initial encounter
[ ] Z96.1   Presence of intraocular lens (post-surgical spine hardware -- USE Z96.698)
[ ] Z87.39  Personal history of other musculoskeletal disorders

====================================================================
MODIFIERS USED
====================================================================
[ ] -25 Significant, separately identifiable E/M
[ ] -59 Distinct procedural service
[ ] -AT Acute treatment (Medicare CMT)
[ ] -GA ABN on file
[ ] -GY Statutorily non-covered
[ ] -GP Physical therapy plan of care
[ ] -KX Medical policy requirements met
[ ] -XS Separate structure
[ ] -XE Separate encounter

====================================================================
TOTAL CHARGES
====================================================================
Total Charges: $____________
Copay Collected: $__________
Coinsurance Collected: $____
Balance Due: $______________

Provider Signature: ________________________  Date: ______________
Patient Signature: _________________________  Date: ______________

====================================================================
TIMED CODE DOCUMENTATION (8-Minute Rule)
====================================================================
Total Timed Service Minutes: ______

1 unit  = 8-22 minutes
2 units = 23-37 minutes
3 units = 38-52 minutes
4 units = 53-67 minutes

Service 1: _______ Code: _______ Start: _____ End: _____ Min: ___
Service 2: _______ Code: _______ Start: _____ End: _____ Min: ___
Service 3: _______ Code: _______ Start: _____ End: _____ Min: ___
Service 4: _______ Code: _______ Start: _____ End: _____ Min: ___

Total Timed Minutes: _____ = _____ billable units`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SECTION 6: DAILY BILLING WORKFLOW
  // ---------------------------------------------------------------------------
  {
    id: 'workflow',
    title: 'Daily Billing Workflow',
    description:
      'Step-by-step billing workflow checklists organized by timing: before the visit, during the visit, after the visit, weekly tasks, and monthly tasks. Following this workflow minimizes denials and maximizes collections.',
    items: [
      {
        id: 'workflow-before-visit',
        title: 'Before the Visit',
        type: 'checklist',
        content: `BEFORE THE VISIT CHECKLIST

Complete these tasks before the patient enters the treatment room.

[ ] 1. VERIFY ELIGIBILITY
   - Check insurance eligibility via payer portal or clearinghouse.
   - Confirm the policy is active as of today's date.
   - Note remaining visits if a visit limit applies.
   - Check if authorization is required and current.
   - Flag any patients whose benefits have changed since last verified.

[ ] 2. CHECK AUTHORIZATION STATUS
   - If auth is required, confirm the auth number is on file and has remaining visits.
   - If auth is expiring within 5 visits, initiate a new auth request today.
   - If auth has expired, do NOT render services until new auth is obtained (unless urgent).

[ ] 3. REVIEW PATIENT BALANCE
   - Check for outstanding copays, coinsurance, or past-due balances.
   - Collect any outstanding balance at check-in.
   - Confirm today's copay amount and collect before the visit.

[ ] 4. REVIEW TREATMENT PLAN
   - Confirm where the patient is in their treatment plan.
   - Is a re-exam due? (Typically every 12-24 visits or 30 days.)
   - Are there any payer-required documentation milestones coming up?

[ ] 5. PREPARE SUPERBILL/ENCOUNTER FORM
   - Pre-populate patient demographics, insurance info, and diagnosis codes.
   - Have the superbill ready for the provider in the treatment room.
   - Ensure the correct fee schedule is loaded for this patient's payer.`,
      },
      {
        id: 'workflow-during-visit',
        title: 'During the Visit',
        type: 'checklist',
        content: `DURING THE VISIT CHECKLIST

Tasks for the provider and staff during the patient encounter.

[ ] 1. PROVIDER: DOCUMENT IN REAL TIME
   - Complete the SOAP note during or immediately after the encounter.
   - Document subjective complaints including pain level, functional status changes, and new symptoms.
   - Record all objective findings: ROM, palpation, orthopedic/neurological tests.
   - Include specific spinal segments treated (e.g., "adjusted C5, T4, L4").
   - Document time for all timed services (start/stop or total minutes).

[ ] 2. PROVIDER: MARK THE SUPERBILL
   - Check off all CPT codes for services rendered.
   - Record units for timed codes.
   - Record total timed minutes.
   - Note any modifiers needed (-25, -59, -AT, etc.).
   - Confirm diagnosis codes match today's services.

[ ] 3. PROVIDER: RE-EXAM DOCUMENTATION
   - If this is a re-exam visit, perform and document:
     - Comparative ROM measurements
     - Repeat outcome assessments (VAS, ODI, NDI)
     - Updated functional status
     - Revised treatment plan with new goals
     - Medical necessity statement for continued care

[ ] 4. STAFF: COLLECT PAYMENT
   - Collect copay/coinsurance at time of service.
   - Issue receipt.
   - If patient cannot pay, document the conversation and set up a payment plan.

[ ] 5. STAFF: SCHEDULE NEXT APPOINTMENT
   - Schedule per the treatment plan frequency.
   - Remind the patient of their next appointment.
   - Flag if the next visit will exceed auth limits or visit caps.`,
      },
      {
        id: 'workflow-after-visit',
        title: 'After the Visit',
        type: 'checklist',
        content: `AFTER THE VISIT CHECKLIST

Complete these tasks within 24 hours of the patient encounter.

[ ] 1. FINALIZE DOCUMENTATION
   - Provider reviews and signs the SOAP note.
   - Ensure all required elements are present: subjective, objective, assessment, plan.
   - Verify that CPT codes on the superbill match the documented services.
   - Verify that diagnosis codes support the services billed.
   - Check that timed code minutes support the units billed (8-minute rule).

[ ] 2. ENTER CHARGES
   - Enter all charges from the superbill into the billing system.
   - Apply correct modifiers.
   - Link each CPT code to the appropriate diagnosis code.
   - Verify the correct fee schedule is applied.
   - Double-check patient demographics and insurance info.

[ ] 3. SCRUB THE CLAIM
   - Run the claim through the clearinghouse scrubber before submission.
   - Check for CCI edit conflicts.
   - Verify modifiers are correctly applied.
   - Confirm place of service code (11 = office).
   - Verify rendering provider NPI.

[ ] 4. SUBMIT THE CLAIM
   - Submit electronically within 24-48 hours of the date of service.
   - Confirm the claim was accepted by the clearinghouse.
   - If rejected, correct and resubmit within 24 hours.
   - Log the submission date for timely filing tracking.

[ ] 5. POST PAYMENTS RECEIVED
   - Post any EOBs/ERAs received today.
   - Review each EOB for accuracy: was the correct amount paid?
   - Identify any underpayments, denials, or adjustments.
   - If denied: route to the denial management queue for follow-up.
   - If underpaid: compare to contracted rate and appeal if necessary.`,
      },
      {
        id: 'workflow-weekly',
        title: 'Weekly Tasks',
        type: 'checklist',
        content: `WEEKLY BILLING TASKS

Complete every week, ideally on the same day each week.

[ ] 1. AGING REPORT REVIEW
   - Pull the accounts receivable (A/R) aging report.
   - Review all claims in the 30+ day bucket.
   - Follow up on any claim older than 30 days without payment or response.
   - Document all follow-up actions taken.

[ ] 2. DENIAL MANAGEMENT
   - Review all denied claims from the past week.
   - Categorize denials by reason (eligibility, medical necessity, bundling, auth, etc.).
   - Initiate appeals for all appealable denials within 5 business days.
   - Track denial rates by payer and reason -- look for patterns.

[ ] 3. PAYMENT POSTING RECONCILIATION
   - Reconcile all payments received with claims submitted.
   - Verify that contracted rates were honored.
   - Identify any underpayments and flag for appeal.
   - Post patient responsibility balances and generate statements.

[ ] 4. AUTHORIZATION TRACKING
   - Review all active authorizations.
   - Identify any authorizations expiring within 2 weeks.
   - Submit re-authorization requests with updated clinical documentation.
   - Document all auth numbers, dates, and visit counts.

[ ] 5. PATIENT BALANCE FOLLOW-UP
   - Review patient balances over 30 days.
   - Send statements for outstanding balances.
   - Make collection calls for balances over 60 days.
   - Document all patient communications regarding balances.

[ ] 6. CLAIM REJECTION REVIEW
   - Review all clearinghouse rejections from the past week.
   - Correct and resubmit rejected claims within 48 hours.
   - Track common rejection reasons and address root causes.`,
      },
      {
        id: 'workflow-monthly',
        title: 'Monthly Tasks',
        type: 'checklist',
        content: `MONTHLY BILLING TASKS

Complete by the 5th business day of each month.

[ ] 1. KEY PERFORMANCE INDICATORS (KPIs)
   - Calculate and track the following metrics:
     - Collection rate (payments / charges): Target >95%
     - Days in A/R: Target <35 days
     - Denial rate: Target <5%
     - Clean claim rate: Target >95%
     - First-pass resolution rate: Target >90%
     - Patient collection rate: Target >80%

[ ] 2. PAYER MIX ANALYSIS
   - Review revenue by payer.
   - Identify top-paying and lowest-paying payers.
   - Assess whether any payer contracts need renegotiation.
   - Compare reimbursement rates to Medicare and fair market rates.

[ ] 3. CODING AUDIT
   - Pull a random sample of 10-20 charts.
   - Compare documentation to codes billed.
   - Check for upcoding, downcoding, unbundling, and missed charges.
   - Identify documentation deficiencies and provide provider feedback.
   - Document audit results and corrective actions.

[ ] 4. FEE SCHEDULE REVIEW
   - Compare your fees to the current Medicare fee schedule and regional averages.
   - Ensure your fees are at least 150-200% of Medicare rates.
   - Update fees annually or when payer contracts change.
   - Verify that UCR data supports your fee schedule.

[ ] 5. COMPLIANCE CHECK
   - Review ABN forms -- are they being used appropriately?
   - Check that all providers are credentialed with all billed payers.
   - Verify that HIPAA-compliant billing practices are being followed.
   - Review modifier usage patterns for appropriateness.
   - Ensure timely filing deadlines are being met for all payers.

[ ] 6. WRITE-OFF REVIEW
   - Review all write-offs and adjustments from the past month.
   - Categorize: contractual adjustment, timely filing, denial, patient hardship, bad debt.
   - Verify that contractual adjustments match contracted rates.
   - Identify any write-offs that should have been appealed.
   - Total write-offs should not exceed 15-20% of gross charges.

[ ] 7. CREDENTIALING STATUS
   - Verify all provider credentialing is current with all payers.
   - Track recredentialing deadlines (typically every 2-3 years).
   - Submit any pending credentialing applications.
   - Update CAQH profile with any practice changes.`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // SECTION 7: PAYER QUICK REFERENCE
  // ---------------------------------------------------------------------------
  {
    id: 'payers',
    title: 'Payer Quick Reference',
    description:
      'Quick reference profiles for the seven most common payer types in chiropractic. Includes coverage notes, quirks, modifier requirements, visit limits, and claims submission details.',
    items: [
      {
        id: 'payer-medicare',
        title: 'Medicare',
        type: 'payer',
        content: `MEDICARE -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
Medicare Part B covers chiropractic manipulative treatment (CMT) ONLY. Specifically:
- COVERED: 98940, 98941, 98942 (spinal CMT only, with AT modifier)
- NOT COVERED: 98943 (extremity), all E/M codes, all therapy codes (97110, 97140, 97112), all modalities (97010, 97014, 97032), all X-rays, all exam/testing codes
- Medicare pays ONLY for the adjustment. Everything else is a non-covered service.

KEY REQUIREMENTS:
- Modifier -AT is MANDATORY on every CMT claim. Without it, automatic denial.
- Subluxation must be documented by X-ray OR physical exam (PART criteria) on the initial visit.
- PART criteria: Pain/tenderness, Asymmetry, Range of motion abnormality, Tissue/tone changes. Must have at least 2 of 4 on initial exam.
- Active/corrective treatment only. Maintenance care is NOT covered.
- CMS defines maintenance care as treatment where no further improvement is expected. Once the patient plateaus, Medicare coverage ends.

ABN REQUIREMENTS:
- An Advance Beneficiary Notice (ABN) must be signed when:
  - Treatment transitions from active to maintenance care (use modifier -GA)
  - Non-covered services are provided (use modifier -GY)
- Without a signed ABN, you cannot bill the patient for denied services.

VISIT LIMITS:
- No statutory visit limit, but medical necessity must be documented for every visit.
- Many Medicare Advantage plans DO have visit limits -- verify with the specific MA plan.

CLAIMS SUBMISSION:
- Electronic Payer ID varies by Medicare Administrative Contractor (MAC).
- Timely filing: 12 months from date of service.
- Must bill with the correct place of service code (11 for office).
- Rendering provider NPI required.
- Referring/ordering provider NPI NOT required for CMT.

REIMBURSEMENT:
- Based on the Medicare Physician Fee Schedule (MPFS).
- Participating providers accept assignment (Medicare pays 80%, patient pays 20% after deductible).
- Non-participating providers: Medicare pays 80% of the non-par limiting charge.
- 2025-2026 rates for CMT: approximately $28-$68 depending on code and region.

COMMON PITFALLS:
- Billing E/M, therapy, or X-rays to Medicare (instant denial and potential fraud flag).
- Missing AT modifier (denial).
- Missing subluxation documentation on initial visit (denial of all claims).
- Continuing to bill AT modifier after patient has plateaued (false claims liability).
- Not having the patient sign an ABN before providing maintenance care.
- Medicare Advantage plans have different rules than Original Medicare -- always verify.`,
      },
      {
        id: 'payer-bcbs',
        title: 'Blue Cross Blue Shield',
        type: 'payer',
        content: `BLUE CROSS BLUE SHIELD (BCBS) -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
Coverage varies significantly by state plan (BCBS is a federation of independent companies). General patterns:
- CMT (98940-98943): Usually covered, but visit limits apply.
- E/M codes: Usually covered when billed with modifier -25 alongside CMT.
- Therapy codes (97110, 97140, 97112): Coverage varies by plan. Some cover, some exclude, some require prior auth.
- X-rays: Generally covered with clinical indication.
- Modalities: Often covered but may be limited.

KEY REQUIREMENTS:
- Modifier -25 required on E/M when billed same-day with CMT.
- Many BCBS plans require pre-authorization after a certain number of visits (commonly 12-24).
- Some BCBS plans use a "chiropractic carve-out" managed by a third party (e.g., American Specialty Health, Optum Physical Health).
- Always check if the chiropractic benefit is carved out to a separate vendor.

VISIT LIMITS:
- Varies widely: 12-60 visits per calendar year depending on the plan.
- Some plans have combined PT/chiro visit limits (e.g., 30 combined visits).
- Federal Employee Program (FEP) BCBS: typically 24-30 visits per year.
- Always verify at the plan level -- do not assume.

CLAIMS SUBMISSION:
- Electronic Payer ID varies by state BCBS plan.
- Timely filing: typically 90-180 days (varies by state plan).
- Some states require referral from PCP for chiropractic (HMO plans).
- BlueCard Program: out-of-state BCBS members can be billed through the local BCBS plan.

REIMBURSEMENT:
- In-network rates are contracted -- typically 60-80% of billed charges.
- Out-of-network: varies, often reimbursed at a percentage of UCR or Medicare rates.
- Payment speed: generally 14-30 days for clean electronic claims.

COMMON PITFALLS:
- Not checking for chiropractic carve-out (claim goes to wrong entity).
- Exceeding visit limits without pre-authorization.
- Combined PT/chiro limits -- patient may have used visits at PT before coming to you.
- Different BCBS state plans have different rules -- do not assume uniformity.
- FEP plans have their own separate policies.`,
      },
      {
        id: 'payer-aetna',
        title: 'Aetna',
        type: 'payer',
        content: `AETNA -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
- CMT (98940-98943): Covered on most plans with visit limits.
- E/M codes: Covered with modifier -25 when separately identifiable.
- Therapy codes: Covered on many plans, but may require prior authorization.
- X-rays: Covered with clinical indication.
- Aetna often requires pre-certification for chiropractic services.

KEY REQUIREMENTS:
- Many Aetna plans require prior authorization/pre-certification before chiropractic treatment begins or after a certain number of visits.
- Aetna uses clinical guidelines that typically allow an initial trial of 4-6 weeks (12-18 visits) before requiring re-authorization.
- Aetna may require a treatment plan submission for authorization.
- Some Aetna plans carve out chiropractic to a third-party manager.

VISIT LIMITS:
- Commonly 20-30 visits per year, but varies by plan.
- Some plans have no stated limit but require ongoing authorization.
- Aetna Student Health plans often have lower limits (12-20 visits).

CLAIMS SUBMISSION:
- Electronic Payer ID: 60054
- Timely filing: 90 days from date of service (in-network), 180 days (out-of-network). Check your contract.
- Claims address for paper: varies by region.
- Aetna strongly prefers electronic submission.

REIMBURSEMENT:
- In-network: contracted rates, typically paid within 15-30 days.
- Out-of-network: reimbursed at Aetna's allowed amount, which may be significantly lower than billed charges.
- Aetna is generally a fair payer when claims are clean and authorized.

COMMON PITFALLS:
- Missing pre-certification (denial for lack of prior auth).
- Not submitting treatment plans when requested (auth denial).
- Aetna's clinical guidelines may limit visit frequency to 2-3x/week initially, tapering to 1x/week.
- Some Aetna plans exclude maintenance/wellness chiropractic care.
- Check if the plan is an Aetna-administered plan or a self-funded employer plan using Aetna's network (different rules may apply).`,
      },
      {
        id: 'payer-uhc',
        title: 'UnitedHealthcare / Optum',
        type: 'payer',
        content: `UNITEDHEALTHCARE (UHC) / OPTUM -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
- UHC is the largest commercial payer in the U.S.
- Most UHC plans carve out chiropractic benefits to Optum Physical Health (formerly ASH - American Specialty Health).
- CMT: Covered with visit limits and often requires registration/notification.
- E/M: Covered with modifier -25.
- Therapy codes: Coverage varies; Optum may limit or require authorization.
- X-rays: Generally covered.

KEY REQUIREMENTS:
- CHECK IF CARVED OUT TO OPTUM FIRST. If so, you must be credentialed with Optum and follow their protocols.
- Optum often requires online treatment plan submission via their provider portal.
- Treatment plans typically require measurable goals, outcome assessments, and functional status documentation.
- Optum uses their own clinical guidelines for medical necessity determinations.
- UHC direct plans (not carved out): standard commercial billing applies.

VISIT LIMITS:
- Varies by plan: commonly 20-30 visits/year.
- Optum-managed plans may authorize in blocks (e.g., 12 visits initially, then re-authorize).
- Some UHC plans combine chiropractic and physical therapy visit limits.

CLAIMS SUBMISSION:
- UHC Electronic Payer ID: 87726
- Optum Physical Health Payer ID: varies (check Optum portal)
- Timely filing: 90 days (in-network), varies for out-of-network.
- Optum requires claims submission through their portal or specific clearinghouse.

REIMBURSEMENT:
- Optum-managed plans: reimbursement is often lower than direct UHC plans.
- Optum uses their own fee schedule, which may be 50-70% of Medicare rates for some codes.
- Direct UHC plans: contracted rates are generally competitive.
- Payment speed: 15-30 days for electronic claims.

COMMON PITFALLS:
- Not knowing the plan is carved out to Optum (claims sent to UHC are rejected).
- Not being credentialed with Optum (even if credentialed with UHC).
- Failing to submit treatment plans via the Optum portal (authorization denial).
- Optum's low reimbursement rates -- review your contract carefully before joining.
- UHC Oxford plans (Northeast US) have different rules than standard UHC.`,
      },
      {
        id: 'payer-cigna',
        title: 'Cigna',
        type: 'payer',
        content: `CIGNA -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
- CMT (98940-98943): Covered on most plans.
- E/M codes: Covered with modifier -25.
- Therapy codes: Covered on many plans, some require authorization.
- X-rays: Covered with clinical indication.
- Cigna generally has favorable chiropractic benefits compared to some other national payers.

KEY REQUIREMENTS:
- Some Cigna plans use a chiropractic management program that requires notification or pre-authorization.
- Cigna's medical necessity criteria are generally reasonable and evidence-based.
- Re-exams should be documented every 30 days or 12 visits for continued coverage.
- Cigna may request clinical records for review if treatment extends beyond 24-36 visits.

VISIT LIMITS:
- Commonly 20-60 visits per year depending on the plan.
- Some Cigna plans have generous or unlimited visit allowances (verify!).
- Typically no combined PT/chiro limit (separate benefit pools).

CLAIMS SUBMISSION:
- Electronic Payer ID: 62308
- Timely filing: 90 days (in-network), 180 days (out-of-network). Check your contract.
- Cigna accepts electronic claims through all major clearinghouses.
- Paper claims: Cigna, P.O. Box 188061, Chattanooga, TN 37422 (verify current address).

REIMBURSEMENT:
- In-network: contracted rates, competitive with market.
- Out-of-network: reimbursed at Cigna's allowed amount.
- Payment speed: typically 14-21 days for clean electronic claims.
- Cigna is generally considered a fair and timely payer.

COMMON PITFALLS:
- Cigna "Open Access Plus" plans do not require referrals for chiropractic; Cigna HMO plans may.
- Check if the plan is Cigna-administered vs. employer self-funded -- different rules.
- Some Cigna plans acquired from other carriers may have legacy benefit structures.
- Always verify benefits even if the card says Cigna -- plan designs vary significantly.`,
      },
      {
        id: 'payer-pi-auto',
        title: 'Personal Injury / Auto Insurance',
        type: 'payer',
        content: `PERSONAL INJURY / AUTO INSURANCE -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
- Auto insurance (PIP/Med Pay/BI) is NOT health insurance. Different rules apply.
- Generally covers all reasonable and necessary treatment related to the auto accident.
- No CPT code restrictions -- CMT, E/M, therapy, modalities, X-rays, and exams are all typically covered.
- Coverage is tied to the accident, not an annual benefit period.
- Reimbursement rates are generally higher than health insurance.

KEY REQUIREMENTS:
- Link ALL billing to the date of accident and auto-related diagnosis codes.
- Use accident-related ICD-10 codes with the appropriate 7th character (A for initial, D for subsequent, S for sequela).
- External cause codes (V-codes) should be included: V43.52XA (car occupant injured in collision), etc.
- Document the mechanism of injury and link all treatment to the accident.
- Some states are "no-fault" (PIP pays regardless of fault); others are "tort" states (at-fault driver's insurance pays).

PIP / MED PAY RULES (Vary by State):
- PIP (Personal Injury Protection): Available in no-fault states. Covers medical expenses regardless of fault. Limits vary by state ($2,500-$250,000+).
- Med Pay (Medical Payments): Optional coverage in tort states. Covers medical expenses regardless of fault. Typical limits: $1,000-$25,000.
- Both pay on a first-party basis (patient's own insurance).

VISIT LIMITS:
- Generally no visit limits, but total dollar limits apply (PIP/Med Pay limits).
- Treatment must be "reasonable and necessary" for the accident-related injuries.
- Some states require an Independent Medical Examination (IME) if treatment extends beyond a certain period.
- Florida: PIP requires treatment within 14 days of accident; $2,500 limit if no "emergency medical condition" diagnosed by MD/DO.

CLAIMS SUBMISSION:
- Paper claims are common (CMS-1500 form).
- Include the claim number, adjuster name, and date of accident on every claim.
- Bill the auto insurance directly (not the patient's health insurance).
- Timely filing: varies by state, but generally 1-2 years.
- Attach clinical notes with initial claims submission.

REIMBURSEMENT:
- Rates are generally 150-300% of Medicare rates.
- No contracted rates -- bill your full fee schedule.
- Payment speed: 30-60 days is typical, but can be much longer.
- May need to follow up aggressively on unpaid claims.
- If PIP/Med Pay is exhausted, balance may be covered by health insurance or attorney lien.

COMMON PITFALLS:
- Failing to document the accident mechanism and causal relationship at every visit.
- Not using accident-related ICD-10 codes (7th character matters!).
- Billing health insurance instead of auto insurance.
- Not knowing your state's PIP/Med Pay rules (especially FL, NY, NJ, MI).
- Treating beyond the point of maximum medical improvement without documentation.
- Not coordinating with the patient's attorney (if they have one).
- Failing to get a signed lien/assignment of benefits.
- Over-treating: auto insurers will hire IME doctors to argue treatment was excessive.`,
      },
      {
        id: 'payer-workers-comp',
        title: 'Workers Compensation',
        type: 'payer',
        content: `WORKERS COMPENSATION -- PAYER QUICK REFERENCE

COVERAGE OVERVIEW:
- Workers comp covers all reasonable and necessary treatment related to a workplace injury.
- No deductibles or copays for the injured worker.
- Coverage includes CMT, E/M, therapy, modalities, X-rays, DME, and other services.
- Every state has its own workers comp system with different rules, fee schedules, and treatment guidelines.

KEY REQUIREMENTS:
- Treatment must be causally related to the workplace injury.
- A First Report of Injury must be filed (typically by the employer, but verify).
- The employer's workers comp insurance carrier must authorize treatment (requirements vary by state).
- Use the work injury date of injury on all claims.
- Some states require use of the state-specific workers comp fee schedule.
- Many states have treatment guidelines that specify visit frequency and duration limits.

AUTHORIZATION:
- Most states require the workers comp carrier to authorize chiropractic treatment.
- Some states allow initial treatment without authorization (e.g., first 30 days or first 12 visits).
- Always verify authorization requirements with the specific carrier and state.
- Treatment beyond initial authorization typically requires a treatment plan and/or progress report.
- Utilization review is common -- be prepared to justify treatment to a UR nurse or physician.

VISIT LIMITS / TREATMENT GUIDELINES:
- Varies by state. Examples:
  - California: follows MTUS (Medical Treatment Utilization Schedule) guidelines.
  - Texas: follows ODG (Official Disability Guidelines).
  - New York: follows Medical Treatment Guidelines.
  - Many states cap initial chiropractic visits at 12-24, then require re-authorization.
- Treatment should show objective improvement. If the patient plateaus, the carrier may terminate authorization.

CLAIMS SUBMISSION:
- Many states require specific forms (not CMS-1500).
- Include the claim number, employer name, date of injury, and adjuster contact info.
- Some states require electronic billing; others accept paper.
- Timely filing: varies by state (30 days to 1 year).
- Always keep copies of everything submitted.

REIMBURSEMENT:
- Many states have a workers comp fee schedule (often 100-150% of Medicare rates).
- Some states allow billing at usual and customary rates.
- Payment speed: 30-45 days is standard, but delays are common.
- Interest/penalties may apply for late payments (varies by state).
- You generally cannot balance-bill the injured worker.

COMMON PITFALLS:
- Not verifying the claim is accepted by the carrier before treating.
- Treating without proper authorization (carrier denies payment, you cannot bill the patient).
- Not following state-specific treatment guidelines (provides grounds for denial).
- Insufficient documentation of work-relatedness and functional improvement.
- Not knowing your state's workers comp fee schedule (billing over the fee schedule = automatic reduction).
- Failing to respond to utilization review requests within the deadline.
- Not providing work status reports (work restrictions, return to work dates).
- IME disagreements: if the carrier's IME says treatment is no longer needed, you must appeal or stop billing.
- Patient changes employers or carriers mid-treatment -- verify coverage continuity.
- Lien disputes if the claim is denied by the carrier -- know your state's lien rights.`,
      },
    ],
  },
];
