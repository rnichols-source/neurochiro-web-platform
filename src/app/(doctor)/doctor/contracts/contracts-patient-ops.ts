// Patient & Operations contract templates for chiropractic practices
// Uses ContractTemplate interface defined in contracts-employment.ts

import type { ContractTemplate } from './contracts-employment';

// ---------------------------------------------------------------------------
// PATIENT TEMPLATES
// ---------------------------------------------------------------------------

export const PATIENT_TEMPLATES: ContractTemplate[] = [
  // -----------------------------------------------------------------------
  // 1. Patient Financial Agreement
  // -----------------------------------------------------------------------
  {
    id: 'patient-financial',
    title: 'Patient Financial Agreement',
    category: 'patient',
    tags: [
      'financial',
      'payment',
      'insurance',
      'billing',
      'collections',
      'refund',
      'care plan',
      'TILA',
    ],
    description:
      'Comprehensive financial agreement executed before care begins. Covers fee schedule acknowledgment, insurance billing authorization, assignment of benefits, missed appointment fees, care plan financial commitment, TILA-compliant payment plans, collections, and refund policy. Drafted to protect the practice when patients abandon care mid-plan.',
    price: 29,
    wordCount: 1500,
    pageEstimate: 6,
    content: `PATIENT FINANCIAL AGREEMENT

Effective Date: [DATE]
Practice: [PRACTICE NAME] ("Practice")
Patient: _______________________________ ("Patient")
Date of Birth: ___/___/______

[ANNOTATION: This agreement should be signed at or before the first visit, ideally during the new-patient intake process. Having the patient execute this BEFORE receiving any services dramatically strengthens enforceability — consideration is established by the promise to provide care, not by care already rendered.]

1. FEE SCHEDULE ACKNOWLEDGMENT

Patient acknowledges receipt of the Practice's current Fee Schedule, attached hereto as Exhibit A and incorporated by reference. Patient understands that fees are subject to periodic adjustment upon thirty (30) days' written notice. Patient agrees that the fees listed on the Fee Schedule represent the Practice's usual and customary charges for chiropractic services, including but not limited to: initial consultation and examination, neurological scanning and assessment, spinal adjustments, therapeutic modalities, re-examinations, and radiographic imaging.

[ANNOTATION: Attaching the actual fee schedule as an exhibit (rather than embedding dollar amounts) allows you to update fees without redrafting the entire agreement. The 30-day notice provision is a best practice — courts view unilateral fee increases without notice unfavorably.]

2. INSURANCE BILLING AUTHORIZATION

Patient authorizes the Practice to submit claims to Patient's health insurance carrier(s) on Patient's behalf. Patient understands that (a) the Practice will make reasonable efforts to verify coverage but does NOT guarantee that any service will be covered; (b) insurance verification is not a guarantee of payment; (c) Patient remains financially responsible for all charges regardless of insurance determination; and (d) any estimate of benefits is exactly that — an estimate, not a promise.

2.1 ASSIGNMENT OF BENEFITS. Patient hereby assigns to the Practice all rights to receive payment directly from Patient's insurance carrier(s) for services rendered. This assignment is irrevocable for services already rendered. Patient directs insurance carrier(s) to remit payment directly to the Practice.

[ANNOTATION: The assignment of benefits clause is critical — without it, the insurer may send the check to the patient, and you have zero leverage to collect. The irrevocability language for services already rendered prevents patients from rescinding the assignment after care to redirect insurance payments to themselves.]

3. PAYMENT TERMS

3.1 PAYMENT AT TIME OF SERVICE. Unless a written payment plan is in effect under Section 5, all co-payments, deductibles, co-insurance amounts, and fees for non-covered services are due and payable at the time of service.

3.2 ACCEPTED METHODS. The Practice accepts cash, personal check, debit card, and major credit cards. A fee of $35.00 will be assessed for any returned check, in addition to any bank charges incurred by the Practice.

3.3 PAST-DUE BALANCES. Any balance unpaid thirty (30) days after the date of service (or after insurance adjudication, whichever is later) shall be deemed past due. Past-due balances may accrue interest at the rate of 1.5% per month (18% per annum) or the maximum rate permitted by applicable state law, whichever is less.

[ANNOTATION: Check your state's usury laws. Many states cap interest rates on consumer debt. The "whichever is less" language is a safety valve — it automatically defers to the statutory cap if 18% exceeds it.]

4. MISSED APPOINTMENT POLICY

Patient agrees that a minimum of twenty-four (24) hours' notice is required to cancel or reschedule an appointment. Failure to provide adequate notice or failure to appear for a scheduled appointment ("no-show") will result in a missed appointment fee as follows:

- First occurrence within a rolling 12-month period: $25.00
- Second and subsequent occurrences: $50.00

Missed appointment fees are NOT billable to insurance and are the sole responsibility of the Patient. The Practice reserves the right to dismiss from care any Patient who accumulates three (3) or more no-shows within a twelve-month period.

[ANNOTATION: Tiered no-show fees are more enforceable than flat fees — they demonstrate reasonableness to a court. The dismissal provision gives you an exit ramp for chronic no-shows who destroy your schedule. Document every no-show in the patient chart.]

5. CARE PLAN FINANCIAL COMMITMENT

Patient acknowledges that chiropractic care is most effective when delivered according to a recommended care plan. Patient understands that the care plan recommended by the treating doctor represents the clinically appropriate frequency and duration of care based on objective findings. Patient agrees that:

(a) Discontinuing care prior to completion of the recommended care plan is against clinical advice;
(b) The financial obligation for a care plan, once accepted and signed, represents a commitment to the full course of care;
(c) Early termination does NOT extinguish the financial obligation for the agreed-upon care plan unless a written modification is executed by both parties.

[ANNOTATION: This is the most litigated section. The language must be carefully balanced — you want to protect revenue when patients ghost mid-plan, but overly aggressive "no cancellation" language can be struck down as unconscionable. The key is framing the obligation as a financial commitment that the patient voluntarily undertook, not a penalty for leaving. Always offer a written modification path — it shows good faith and courts love it.]

5.1 TILA-COMPLIANT PAYMENT PLAN TERMS. For care plans requiring more than four (4) installments, the following Truth in Lending Act disclosures apply:

- Total Cash Price of Care Plan: $__________
- Down Payment: $__________
- Amount Financed: $__________
- Finance Charge: $__________ (if applicable; $0.00 for interest-free plans)
- Annual Percentage Rate (APR): __________% (0% for interest-free plans)
- Total of Payments: $__________
- Number of Payments: __________
- Amount of Each Payment: $__________
- Payment Due Dates: __________ of each month
- Late Payment Fee: $15.00 if payment is received more than ten (10) days after due date

[ANNOTATION: TILA compliance is mandatory for any payment plan exceeding four installments. Failure to provide these disclosures can expose the practice to federal liability, including statutory damages, actual damages, and attorney's fees. Even for 0% interest plans, the disclosure is REQUIRED. Most chiropractic practices get this wrong. Fill in every blank — leaving any field empty negates the disclosure.]

6. COLLECTIONS POLICY

In the event that Patient's account becomes more than ninety (90) days past due and the Practice has made at least two (2) documented attempts to collect, the Practice reserves the right to refer the account to a third-party collection agency or pursue legal remedies. Patient agrees that in the event of collection action, Patient shall be responsible for all reasonable collection costs, including but not limited to collection agency fees, court costs, and attorney's fees to the extent permitted by applicable law.

[ANNOTATION: The "two documented attempts" language is a best practice — it demonstrates that you attempted good-faith resolution before escalating. Some states limit or prohibit recovery of collection agency fees, so the "to the extent permitted" qualifier is essential.]

7. REFUND POLICY

7.1 SERVICES RENDERED. Fees for chiropractic services that have been rendered are NON-REFUNDABLE. Patient acknowledges that once a service has been provided, the value of that service has been fully conferred regardless of Patient's subjective satisfaction with the outcome.

7.2 PREPAID VISIT PACKAGES. If Patient has prepaid for a package of visits and elects to discontinue care, the Practice will calculate a refund as follows: (a) visits already used will be re-priced at the Practice's standard individual visit rate (not the discounted package rate); (b) the total for visits used at standard rate will be subtracted from the amount paid; (c) the remainder, if any, constitutes the refund. An administrative processing fee of $50.00 will be deducted from any refund.

[ANNOTATION: The re-pricing mechanism is the most important part of this section. Without it, a patient who bought 24 visits at $35/visit ($840) and used 20 would get a $140 refund. With re-pricing at the standard $75/visit rate, those 20 visits cost $1,500 — meaning no refund is owed and the patient actually received a benefit. This is standard practice in the industry and has been upheld in every jurisdiction we are aware of.]

8. GENERAL PROVISIONS

8.1 MODIFICATION. This Agreement may be modified only by a written instrument signed by both parties.

8.2 SEVERABILITY. If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.

8.3 GOVERNING LAW. This Agreement shall be governed by the laws of the State of [STATE].

8.4 ENTIRE AGREEMENT. This Agreement, together with any attached exhibits, constitutes the entire financial agreement between Patient and Practice and supersedes all prior oral or written agreements regarding financial terms.

PATIENT ACKNOWLEDGMENT

I have read this Patient Financial Agreement in its entirety. I understand my financial obligations. I have had the opportunity to ask questions, and all questions have been answered to my satisfaction.

Patient Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

Parent/Guardian Signature (if Patient is a minor): _______________________________ Date: ___/___/______
Print Name: _______________________________
Relationship to Patient: _______________________________

Practice Representative: _______________________________ Date: ___/___/______`,
  },

  // -----------------------------------------------------------------------
  // 2. Informed Consent for Chiropractic Care
  // -----------------------------------------------------------------------
  {
    id: 'informed-consent',
    title: 'Informed Consent for Chiropractic Care',
    category: 'patient',
    tags: [
      'informed consent',
      'malpractice',
      'risk disclosure',
      'HIPAA',
      'pediatric',
      'imaging',
      'neurological',
      'pregnancy',
    ],
    description:
      'Thorough informed consent document tailored to neurologically-focused chiropractic care. Covers nature of care (including scans and neurological assessment), risk disclosures with actual incidence data (including vertebrobasilar events), benefits, alternatives, right to refuse/withdraw, HIPAA acknowledgment, imaging consent, minor consent provisions, and pregnancy disclosure. Drafted for maximum malpractice defensibility.',
    price: 29,
    wordCount: 1800,
    pageEstimate: 7,
    content: `INFORMED CONSENT FOR CHIROPRACTIC CARE

Practice: [PRACTICE NAME] ("Practice")
Treating Doctor(s): [DOCTOR NAME(S)], D.C.
Patient: _______________________________ ("Patient")
Date of Birth: ___/___/______

PLEASE READ THIS ENTIRE DOCUMENT CAREFULLY BEFORE SIGNING.

[ANNOTATION: Informed consent is both an ethical obligation and your single most important malpractice defense document. In virtually every chiropractic malpractice case, the first thing the plaintiff's attorney examines is the informed consent. A well-drafted consent does not prevent lawsuits, but it dramatically reduces the probability of an adverse verdict. The document must demonstrate that the patient was informed of material risks and voluntarily chose to proceed.]

1. NATURE OF CHIROPRACTIC CARE

Chiropractic care focuses on the relationship between the body's structure — primarily the spine — and its function as coordinated by the nervous system. The treating doctor will use one or more of the following to evaluate and manage your condition:

(a) NEUROLOGICAL ASSESSMENT AND SCANNING. The Practice utilizes computerized neurological scanning technology (which may include surface electromyography [sEMG], thermal scanning, and/or heart rate variability [HRV] analysis) to objectively measure nervous system function. These scans are non-invasive, painless, and involve no radiation. Scan data will be used to establish baseline measurements, guide care plan recommendations, monitor progress, and determine the appropriate timing for adjustments to your care.

(b) CHIROPRACTIC ADJUSTMENT. The doctor will use controlled force applied to specific joints of the spine or extremities (an "adjustment") to restore proper joint motion and improve nervous system function. Adjustments may be performed by hand or with the assistance of a mechanical instrument. You may hear a popping or cracking sound during an adjustment, which is the release of gas from the joint and is normal.

(c) EXAMINATION AND DIAGNOSTIC PROCEDURES. The doctor may perform orthopedic tests, neurological tests, postural analysis, range of motion assessment, palpation, and other standard examination procedures.

(d) THERAPEUTIC MODALITIES. The doctor may recommend adjunctive therapies including but not limited to: electrical muscle stimulation, ultrasound therapy, mechanical traction, therapeutic exercise, soft tissue therapy, and rehabilitative protocols.

2. MATERIAL RISKS AND COMPLICATIONS

As with any healthcare intervention, chiropractic care carries inherent risks. The most commonly reported risks include:

(a) COMMON RISKS (occurring in approximately 30-50% of patients): Temporary soreness, stiffness, or aching at the site of adjustment, typically resolving within 24-48 hours. Temporary fatigue. Temporary headache.

(b) UNCOMMON RISKS (occurring in less than 1% of patients): Aggravation of pre-existing disc herniation. Strain or sprain to ligaments or muscles. Rib fracture or vertebral fracture (primarily in patients with osteoporosis or other bone-weakening conditions).

(c) RARE BUT SERIOUS RISKS: Vertebrobasilar artery stroke (VBA stroke) or vertebral artery dissection. The relationship between chiropractic cervical manipulation and VBA stroke has been the subject of extensive research. Current peer-reviewed literature indicates that the incidence of serious adverse events following cervical manipulation is estimated at 1 per 1,000,000 to 1 per 5,850,000 cervical manipulations (Cassidy et al., 2008; Hurwitz et al., 2016). This risk is comparable to the risk associated with a routine visit to a primary care physician for the same complaint. Symptoms of a vascular event may include sudden severe headache, dizziness, double vision, slurred speech, difficulty swallowing, or loss of coordination. If you experience any of these symptoms during or after treatment, notify the Practice immediately and seek emergency medical care.

(d) ADDITIONAL RARE RISKS: Cauda equina syndrome (loss of bowel/bladder control — seek emergency care immediately). Worsening of symptoms.

[ANNOTATION: The risk disclosure for VBA stroke is the single most consequential paragraph in this document from a malpractice defense standpoint. Three critical elements: (1) naming the risk specifically — courts have consistently held that vague references to "stroke" or "serious injury" are insufficient; (2) providing actual incidence data from peer-reviewed sources — this reframes the risk as statistically remote while demonstrating full transparency; (3) the comparison to PCP visit risk (established in Cassidy et al.) is powerful in front of a jury because it contextualizes the risk against something universally considered safe. Do NOT omit the emergency symptoms list — it demonstrates that you equipped the patient to recognize and respond to the very complication disclosed.]

3. POTENTIAL BENEFITS

Potential benefits of chiropractic care include but are not limited to: reduction or elimination of pain, improved range of motion, improved posture, improved nervous system function as measured by objective neurological scans, improved sleep quality, enhanced immune function, improved quality of life, and reduced reliance on medication for symptom management.

Patient understands that no guarantee of specific results has been made or implied. Individual responses to care vary, and the Practice cannot predict with certainty any particular outcome.

4. ALTERNATIVES TO CHIROPRACTIC CARE

Alternatives to chiropractic care may include: self-administered over-the-counter pain medication, prescription medication (including opioids, muscle relaxants, and anti-inflammatory drugs — each carrying their own risk profiles), physical therapy, acupuncture, massage therapy, surgical intervention, injection-based pain management, or electing no treatment at all. Patient is encouraged to explore all options and make an informed decision.

5. RIGHT TO REFUSE OR WITHDRAW CONSENT

Patient has the right to refuse any examination, test, or treatment at any time. Patient has the right to withdraw this consent at any time by providing written notice to the Practice. Withdrawal of consent shall not affect the validity of care provided prior to withdrawal, nor shall it affect the Patient's financial obligations for services already rendered.

6. HIPAA ACKNOWLEDGMENT

Patient acknowledges receipt of the Practice's Notice of Privacy Practices, which describes how the Practice may use and disclose Patient's protected health information (PHI) for treatment, payment, and healthcare operations purposes. Patient understands that PHI includes all clinical records, neurological scan data, imaging, and any other information generated during the course of care. Patient's signature below confirms receipt of the Notice of Privacy Practices and understanding of the rights described therein.

[ANNOTATION: While HIPAA does not technically require a signed acknowledgment (only a "good faith effort" to obtain one), having a signed acknowledgment integrated into the informed consent creates a single, comprehensive document that demonstrates compliance during any OCR audit. This is significantly more defensible than a separate HIPAA form that may be misplaced.]

7. CONSENT FOR DIAGNOSTIC IMAGING (X-RAY)

Patient understands that the treating doctor may recommend radiographic imaging (x-rays) as part of the diagnostic process. X-rays involve exposure to ionizing radiation. While diagnostic x-rays involve relatively low doses of radiation, all radiation exposure carries some degree of risk. The doctor will only recommend imaging when the clinical benefit of obtaining the images is expected to outweigh the minimal risk of radiation exposure. Patient consents to radiographic imaging as recommended by the treating doctor.

Patient may decline imaging at any time. However, Patient understands that declining recommended imaging may limit the doctor's ability to formulate an accurate diagnosis and safe treatment plan, and that the Practice may decline to provide certain treatments without adequate diagnostic imaging.

8. CONSENT FOR TREATMENT OF MINOR PATIENTS (Under Age 18)

If the Patient is a minor (under 18 years of age), the undersigned parent or legal guardian hereby consents to chiropractic evaluation and treatment of the minor patient. The parent/guardian affirms that:

(a) They have legal authority to consent to healthcare for the minor;
(b) They have read and understood all sections of this informed consent;
(c) They have had the opportunity to ask questions about the care to be provided to the minor;
(d) They understand the risks, benefits, and alternatives as described above;
(e) They will be present during examinations and treatments or have designated an authorized adult to be present.

[ANNOTATION: For pediatric chiropractic, the consent of a parent or legal guardian is non-negotiable. In custody situations, confirm which parent has medical decision-making authority — a consent signed by the wrong parent is void. If you see divorced or separated parents, request a copy of the custody order and file it in the chart. This is an area where malpractice claims are increasingly common, and proper documentation is your shield.]

9. PREGNANCY DISCLOSURE

Female patients of childbearing age: If you are pregnant or suspect you may be pregnant, you MUST inform the treating doctor before any examination or treatment. Certain examination procedures, imaging studies, and treatment techniques may be modified or contraindicated during pregnancy. The Practice utilizes pregnancy-safe adjustment techniques, but the treating doctor must be aware of pregnancy status to select the appropriate approach.

Patient represents that the information provided regarding pregnancy status is accurate and agrees to notify the Practice immediately upon learning of a pregnancy that occurs during the course of care.

10. ACKNOWLEDGMENT AND CONSENT

By signing below, I acknowledge that:

- I have read and understand this Informed Consent document in its entirety;
- I have had the opportunity to ask questions about my proposed care, and all questions have been answered to my satisfaction;
- I understand the nature of chiropractic care, including neurological scanning and spinal adjustment;
- I understand the material risks, including the rare risk of vertebrobasilar stroke;
- I understand the potential benefits and alternatives to chiropractic care;
- I understand my right to refuse or withdraw consent at any time;
- I voluntarily consent to chiropractic evaluation and treatment.

Patient Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

FOR MINOR PATIENTS:
Parent/Legal Guardian Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________
Relationship to Patient: _______________________________

Witness Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________`,
  },

  // -----------------------------------------------------------------------
  // 3. Patient Arbitration Agreement
  // -----------------------------------------------------------------------
  {
    id: 'patient-arbitration',
    title: 'Patient Arbitration Agreement',
    category: 'patient',
    tags: [
      'arbitration',
      'dispute resolution',
      'malpractice',
      'liability',
      'rescission',
      'AAA',
      'JAMS',
    ],
    description:
      'Mutual agreement to arbitrate all disputes arising from chiropractic care. Covers scope of claims, arbitration provider selection (AAA or JAMS), cost-sharing provisions, exclusions for small claims and emergency relief, 30-day right to rescind, and severability. Includes strategic annotations on enforceability by state and the critical importance of the rescission window.',
    price: 29,
    wordCount: 1000,
    pageEstimate: 4,
    content: `PATIENT ARBITRATION AGREEMENT

Effective Date: [DATE]
Practice: [PRACTICE NAME] ("Practice")
Patient: _______________________________ ("Patient")

[ANNOTATION: Arbitration agreements in healthcare are enforceable in the majority of U.S. states, but the landscape is nuanced. California, New York, and several other states have specific statutory requirements that must be met. A few states (e.g., Montana under the Montana Unfair Trade Practices Act) are hostile to pre-dispute arbitration clauses in healthcare. STRATEGIC VALUE: Arbitration eliminates jury trials, which are statistically more likely to result in large emotional-damage awards in malpractice cases. Arbitrators also tend to apply the standard of care more objectively. STRATEGIC RISK: You lose the ability to file a dispositive motion (summary judgment), which you might otherwise win on the pleadings. Net assessment: For most chiropractic practices, the benefits significantly outweigh the risks.]

1. MUTUAL AGREEMENT TO ARBITRATE

Patient and Practice mutually agree that any and all disputes, claims, or controversies arising out of or relating to chiropractic care or services provided by the Practice, including but not limited to claims of malpractice, negligence, breach of contract, fraud, statutory violations, or any other legal or equitable claim, shall be resolved exclusively through binding arbitration rather than through a court trial before a judge or jury.

This agreement is mutual — it applies equally to claims brought by the Patient against the Practice and claims brought by the Practice against the Patient. Both parties are waiving their constitutional right to a jury trial.

2. SCOPE OF ARBITRATION

This arbitration agreement covers ALL claims related to care provided by the Practice, including claims against the Practice, its doctors, employees, agents, and independent contractors. The scope includes but is not limited to:

(a) Claims for bodily injury, emotional distress, or wrongful death;
(b) Claims for breach of any duty arising from the patient-provider relationship;
(c) Claims related to billing, financial agreements, or collections;
(d) Claims related to privacy, confidentiality, or HIPAA violations;
(e) Claims related to any product recommended or sold by the Practice.

3. ARBITRATION PROVIDER AND RULES

Arbitration shall be administered by the American Arbitration Association (AAA) under its Healthcare Arbitration Rules, or alternatively by JAMS under its Comprehensive Arbitration Rules, at the election of the party initiating the arbitration. If neither AAA nor JAMS is available, the parties shall mutually agree upon a qualified arbitration provider. The arbitrator shall be a licensed attorney or retired judge with experience in healthcare disputes.

4. COST-SHARING

(a) The Practice shall pay the initial filing fee for any arbitration initiated by the Patient, up to $500.00.
(b) Arbitrator fees and administrative costs shall be shared equally between the parties, provided that the Patient's share shall not exceed the cost the Patient would have incurred in filing fees in a court of general jurisdiction.
(c) Each party shall bear its own attorney's fees unless the arbitrator determines that an award of fees is warranted under applicable law.

[ANNOTATION: The cost-sharing provision is CRITICAL to enforceability. Courts routinely strike down arbitration agreements that impose prohibitive costs on the patient. The filing-fee-cap mechanism (patient's share cannot exceed court filing costs) is modeled on the standard endorsed by the U.S. Supreme Court in Green Tree Financial Corp. v. Randolph and subsequent circuit court decisions. If you make the patient pay more than they would in court, you've handed the plaintiff's attorney a winning argument to void the entire agreement.]

5. EXCLUSIONS

The following are excluded from this arbitration agreement:

(a) SMALL CLAIMS. Either party may bring an individual action in small claims court for disputes involving $10,000.00 or less, provided the claim falls within the small claims court's jurisdiction.

(b) EMERGENCY INJUNCTIVE RELIEF. Either party may seek temporary or emergency injunctive relief from a court of competent jurisdiction to prevent irreparable harm, pending the outcome of arbitration.

6. RIGHT TO RESCIND

PATIENT HAS THE RIGHT TO RESCIND (CANCEL) THIS ARBITRATION AGREEMENT WITHIN THIRTY (30) CALENDAR DAYS of signing by delivering written notice to the Practice at the address listed below. Rescission must be in writing (email is acceptable) and received within the 30-day period. Rescission of this arbitration agreement will NOT affect the Patient's right to receive care from the Practice — care will not be conditioned on this agreement, and no adverse action will be taken against a Patient who rescinds.

Practice Address for Rescission Notices: [PRACTICE ADDRESS]
Practice Email for Rescission Notices: [EMAIL]

[ANNOTATION: The 30-day rescission right is the single most important enforceability feature of this agreement. Without it, courts in multiple jurisdictions have found healthcare arbitration agreements to be contracts of adhesion — "take it or leave it" agreements signed under duress of needing medical care. The rescission window transforms the agreement from adhesive to voluntary. The explicit statement that care will not be conditioned on this agreement eliminates the "coercion" argument. In practice, fewer than 1% of patients actually rescind. This is a low-cost, high-value provision.]

7. SEVERABILITY

If any provision of this Agreement is held invalid, illegal, or unenforceable by a court of competent jurisdiction or the arbitrator, the remaining provisions shall remain in full force and effect. If the agreement to arbitrate is found unenforceable as a whole, the parties agree to submit to the jurisdiction of the courts of the State of [STATE].

8. GOVERNING LAW

This Agreement shall be governed by the Federal Arbitration Act (9 U.S.C. \u00A7\u00A7 1-16) and, to the extent not preempted, by the laws of the State of [STATE].

9. ACKNOWLEDGMENT

BY SIGNING BELOW, BOTH PARTIES ACKNOWLEDGE THAT THEY HAVE READ THIS AGREEMENT, UNDERSTAND ITS TERMS, AND VOLUNTARILY AGREE TO BINDING ARBITRATION. BOTH PARTIES UNDERSTAND THAT BY SIGNING THIS AGREEMENT, THEY ARE WAIVING THEIR RIGHT TO A JURY TRIAL.

Patient Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

Practice Representative Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________
Title: _______________________________`,
  },

  // -----------------------------------------------------------------------
  // 4. Lien Agreement (Personal Injury)
  // -----------------------------------------------------------------------
  {
    id: 'pi-lien',
    title: 'Lien Agreement (Personal Injury)',
    category: 'patient',
    tags: [
      'personal injury',
      'PI',
      'lien',
      'attorney',
      'settlement',
      'auto accident',
      'med-pay',
      'third-party',
    ],
    description:
      "Doctor's lien on patient's personal injury settlement or judgment. Includes attorney acknowledgment section, PI-specific fee schedule, patient authorization for record release, settlement notification obligations, payment timeline, provisions for lost cases, and lien termination terms. Essential for protecting chiropractic PI revenue.",
    price: 39,
    wordCount: 1200,
    pageEstimate: 5,
    content: `DOCTOR'S LIEN AGREEMENT — PERSONAL INJURY

Date: [DATE]
Practice: [PRACTICE NAME] ("Doctor")
Doctor Address: [PRACTICE ADDRESS]
Patient: _______________________________ ("Patient")
Patient Date of Birth: ___/___/______
Date of Injury: ___/___/______
Type of Injury/Incident: _______________________________
Attorney: _______________________________ ("Attorney")
Attorney Firm: _______________________________
Attorney Address: _______________________________

[ANNOTATION: This document is the single most important financial instrument in a personal injury chiropractic practice. Without a properly executed lien, you are an unsecured creditor — meaning you get paid last (if at all) when the case settles. With a valid lien, you have a legally enforceable claim against the settlement proceeds. Most chiropractors lose thousands of dollars annually because they either (a) don't use a lien agreement at all, relying on a handshake with the attorney, (b) use a lien that's missing critical provisions, or (c) fail to get the attorney's signature. All three parties MUST sign this document for maximum enforceability.]

1. CREATION OF LIEN

Patient hereby grants Doctor a lien against any and all proceeds from settlement, judgment, verdict, or other recovery ("Proceeds") arising from the personal injury claim described above. This lien secures payment of all charges for chiropractic examination, diagnostic imaging, neurological scanning, treatment, and related services provided to the Patient in connection with the injuries sustained in the above-described incident.

The amount of this lien shall equal the total charges incurred for treatment rendered, as calculated under the Personal Injury Fee Schedule set forth in Section 5.

2. PATIENT AUTHORIZATIONS

Patient authorizes the Doctor to:

(a) Provide copies of all medical records, diagnostic images, scan reports, narrative reports, billing statements, and any other documentation related to Patient's care to the Attorney for use in prosecuting Patient's personal injury claim;

(b) Communicate directly with the Attorney regarding Patient's condition, treatment, prognosis, and charges;

(c) Provide testimony, including deposition and trial testimony, regarding Patient's condition and treatment, subject to applicable professional fees for expert testimony as outlined in the Fee Schedule.

Patient further authorizes and directs the Attorney to:

(a) Honor this lien from any Proceeds received;
(b) Withhold from Proceeds an amount sufficient to satisfy this lien in full;
(c) Issue payment directly to the Doctor from settlement or judgment Proceeds before distributing any remaining funds to the Patient.

3. PATIENT OBLIGATIONS

Patient agrees to:

(a) Notify the Doctor within five (5) business days of any settlement offer, mediation, or trial date;
(b) Notify the Doctor within five (5) business days of the resolution of the case, whether by settlement, judgment, dismissal, or withdrawal;
(c) Not settle, compromise, or dismiss the personal injury claim without first providing written notice to the Doctor and ensuring that the lien will be satisfied from Proceeds;
(d) Continue treatment as recommended by the Doctor and attend all scheduled appointments. Patient understands that gaps in care materially weaken the personal injury claim and may reduce the value of settlement.

[ANNOTATION: Clause (d) serves dual purposes: it protects the clinical relationship AND protects the case value. Gaps in care are the #1 reason PI cases settle for less than they should. Defense adjusters and attorneys exploit treatment gaps to argue the patient wasn't really injured. Making this an explicit obligation in the lien agreement gives you documentation to present to the attorney when the patient starts skipping visits.]

4. ATTORNEY ACKNOWLEDGMENT AND OBLIGATIONS

By signing this Agreement, Attorney acknowledges the Doctor's lien and agrees to:

(a) Honor the lien from any Proceeds received in connection with Patient's claim;
(b) Not disburse Proceeds to Patient or any other party without first satisfying this lien or obtaining the Doctor's written consent to an alternative arrangement;
(c) Notify the Doctor of any settlement, judgment, or other resolution within ten (10) business days;
(d) Include the Doctor's lien amount in any settlement demand or documentation;
(e) Hold in trust an amount sufficient to satisfy this lien until payment is remitted to the Doctor.

Attorney understands that failure to honor this lien may constitute a violation of the Attorney's fiduciary duties and may subject the Attorney to professional discipline and civil liability.

[ANNOTATION: The attorney acknowledgment section is what transforms this from a patient promise into a three-party enforceable agreement. Without the attorney's signature, you are relying solely on the patient to ensure payment — and patients routinely fail to do so. Once the attorney signs, they have an independent legal obligation to honor the lien, and disbursing funds without doing so creates malpractice exposure for the attorney. ALWAYS get the attorney's signature. Fax or email the lien to the attorney's office immediately after the patient signs and follow up until you receive the countersigned copy.]

5. PERSONAL INJURY FEE SCHEDULE

Treatment provided under this lien agreement shall be billed at the following rates, which represent the Doctor's usual and customary charges for medico-legal personal injury cases:

- Initial Consultation and Examination: $[AMOUNT] (typical range: $250 - $500)
- Re-Examination / Progress Evaluation: $[AMOUNT] (typical range: $150 - $350)
- Chiropractic Adjustment (spinal): $[AMOUNT] (typical range: $75 - $150 per visit)
- Neurological Scanning (sEMG/Thermal/HRV): $[AMOUNT] (typical range: $150 - $350)
- Radiographic Imaging (per region): $[AMOUNT] (typical range: $150 - $400)
- Narrative Medical Report: $[AMOUNT] (typical range: $350 - $750)
- Records Review and Deposition Preparation: $[AMOUNT]/hour (typical range: $250 - $500/hour)
- Deposition Testimony: $[AMOUNT]/hour (typical range: $500 - $1,000/hour, 2-hour minimum)
- Trial Testimony: $[AMOUNT]/half-day (typical range: $1,500 - $3,500/half-day)

[ANNOTATION: PI fee schedules are legitimately higher than standard insurance-based fees for several reasons: (1) extended documentation requirements; (2) deferred payment (you may wait 12-24 months for settlement); (3) risk of non-payment if the case is lost; (4) medico-legal expertise required for reports and testimony. Most jurisdictions permit higher fees for PI work provided they are reasonable and disclosed in advance. This fee schedule establishes transparency and prevents disputes at settlement time.]

6. PAYMENT TIMELINE

Attorney shall remit payment to the Doctor within fifteen (15) business days of receipt of settlement funds or judgment Proceeds. Payment shall be by check or wire transfer payable to [PRACTICE NAME].

7. CASE OUTCOME — NO RECOVERY

In the event that the Patient's personal injury claim results in no recovery (dismissal, defense verdict, or withdrawal), the Patient remains personally responsible for all charges incurred under this Agreement. The Doctor and Patient will negotiate a reasonable payment plan, and the Doctor agrees to consider a reduction in charges (not to exceed 25% of the total balance) in recognition of the adverse case outcome. Any such reduction shall be at the Doctor's sole discretion.

[ANNOTATION: The "no recovery" provision is essential. Without it, you may have provided months of care with no clear payment obligation if the case is lost. The discretionary reduction of up to 25% is a goodwill gesture that makes the provision more palatable to patients and their attorneys — and it's entirely within your control.]

8. TERMINATION OF LIEN

This lien shall terminate upon the earliest of: (a) full payment of all charges secured by this lien; (b) written release executed by the Doctor; or (c) written mutual agreement of all parties. The lien shall survive the termination of the patient-provider relationship — meaning that even if the Patient discontinues care, the lien remains enforceable against any Proceeds.

9. SIGNATURES

ALL THREE SIGNATURES ARE REQUIRED FOR THIS AGREEMENT TO BE FULLY EFFECTIVE.

PATIENT:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

DOCTOR:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________
License No.: _______________________________

ATTORNEY:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________
Bar No.: _______________________________
Firm: _______________________________`,
  },
];

// ---------------------------------------------------------------------------
// OPERATIONS TEMPLATES
// ---------------------------------------------------------------------------

export const OPERATIONS_TEMPLATES: ContractTemplate[] = [
  // -----------------------------------------------------------------------
  // 1. Office Policy Manual Template
  // -----------------------------------------------------------------------
  {
    id: 'office-policy',
    title: 'Office Policy Manual Template',
    category: 'operations',
    tags: [
      'policy manual',
      'employee handbook',
      'HIPAA',
      'HR',
      'at-will',
      'social media',
      'discipline',
      'dress code',
      'harassment',
    ],
    description:
      'Comprehensive office policy manual for chiropractic practices. Covers at-will employment, attendance, dress code, HIPAA compliance, social media policy, patient interaction standards, cash handling, emergency protocols, harassment/discrimination, progressive discipline, and chiropractic-specific sections including adjusting room etiquette, patient gowning/draping, scan data handling, and supplement sales guidelines.',
    price: 39,
    wordCount: 2000,
    pageEstimate: 8,
    content: `[PRACTICE NAME]
OFFICE POLICY MANUAL

Version: [VERSION]
Effective Date: [DATE]
Approved By: [NAME], D.C. — Practice Owner

CONFIDENTIAL — FOR INTERNAL USE ONLY
This manual is the property of [PRACTICE NAME]. Distribution outside the practice is prohibited.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1: EMPLOYMENT STATUS

1.1 AT-WILL EMPLOYMENT. All employment with the Practice is "at-will," meaning that either the employee or the Practice may terminate the employment relationship at any time, with or without cause, and with or without notice. No supervisor, manager, or representative of the Practice has the authority to modify this at-will status except in a written agreement signed by the Practice Owner.

1.2 This Policy Manual does not constitute an employment contract and does not create any contractual obligations, express or implied. The Practice reserves the right to modify, amend, or revoke any policy in this manual at any time, with or without notice.

SECTION 2: ATTENDANCE AND PUNCTUALITY

2.1 Employees are expected to arrive at least fifteen (15) minutes before the first scheduled patient of their shift to prepare workstations, review the day's schedule, and participate in the morning huddle.

2.2 Unscheduled absences must be reported to the Office Manager or designated supervisor at least two (2) hours before the start of the employee's shift, except in cases of genuine emergency.

2.3 Three (3) unexcused absences or instances of tardiness within a rolling 90-day period will result in disciplinary action under the Progressive Discipline Policy (Section 10).

2.4 Pattern absences (e.g., consistently calling out on Mondays or Fridays, or on days following payday) will be addressed regardless of the total count.

SECTION 3: DRESS CODE

3.1 GENERAL STANDARD. The Practice is a professional healthcare environment. All employees are expected to present a clean, neat, professional appearance at all times.

3.2 CLINICAL STAFF (CAs, X-ray Technicians, Therapy Aides):
- Practice-issued scrubs or approved uniform in designated color(s);
- Closed-toe, non-slip shoes;
- Minimal jewelry (no dangling earrings, bracelets, or rings that could interfere with patient contact);
- Name badge worn and visible at all times;
- Hair pulled back if shoulder-length or longer;
- No strong fragrances or perfumes (patients with chemical sensitivities are common).

3.3 FRONT DESK AND ADMINISTRATIVE STAFF: Business casual attire. No jeans, athletic wear, flip-flops, or graphic t-shirts. Name badge required.

3.4 DOCTORS: Professional attire or scrubs consistent with clinical role. Lab coat optional at doctor's discretion.

SECTION 4: HIPAA COMPLIANCE AND PROTECTED HEALTH INFORMATION

4.1 ALL employees, regardless of role, must complete HIPAA training within thirty (30) days of hire and annually thereafter. Training completion records will be maintained in each employee's personnel file.

4.2 PROTECTED HEALTH INFORMATION (PHI). PHI includes any information that identifies a patient and relates to their health condition, treatment, or payment for treatment. This includes but is not limited to: names, dates of birth, addresses, phone numbers, email addresses, Social Security numbers, insurance information, clinical notes, diagnostic images, neurological scan data, financial records, and appointment schedules.

4.3 VERBAL DISCUSSIONS. Patient information shall not be discussed in public areas (reception, hallways, parking lots). Clinical discussions must occur in private areas with doors closed. Phone calls involving PHI must be conducted at a volume that cannot be overheard by unauthorized individuals.

4.4 ELECTRONIC PHI. All computers must be locked (Ctrl+L or Cmd+L) when unattended. Patient records must never be displayed on screens visible to other patients. USB drives containing PHI are prohibited. Patient information must NEVER be transmitted via personal email, text message, or social media messaging.

4.5 SCAN DATA. Neurological scan data (sEMG, thermal, HRV) constitutes PHI and must be handled with the same level of protection as any medical record. Scan reports displayed for patient education must not be visible to other patients. Scan data used for marketing purposes must be fully de-identified in compliance with the HIPAA Safe Harbor method (removal of all 18 identifiers).

4.6 BREACHES. Any suspected or actual breach of PHI must be reported to the Privacy Officer ([NAME]) immediately. Failure to report a known breach is a terminable offense.

SECTION 5: SOCIAL MEDIA POLICY

5.1 PERMITTED. Employees may: share the Practice's official social media posts; post general content about the chiropractic profession (without referencing specific patients); and share their own positive experiences as an employee (without disclosing confidential business information).

5.2 PROHIBITED. Employees shall NOT: post photographs of patients without a signed HIPAA-compliant photo/video release on file; discuss specific patient cases, conditions, or outcomes on any platform; post proprietary business information (revenue, patient counts, internal strategies); make disparaging remarks about the Practice, its doctors, staff, patients, or competitors; respond to negative online reviews by disclosing patient information (even if the patient initiated the review — this is a HIPAA violation regardless); or use Practice computer systems for personal social media activity during working hours.

5.3 Violations of the social media policy will be treated as HIPAA violations and may result in immediate termination and reporting to HHS Office for Civil Rights.

SECTION 6: PATIENT INTERACTION STANDARDS

6.1 Every patient interaction — in person, by phone, by email, or by text — must reflect the Practice's core values of professionalism, empathy, and clinical excellence.

6.2 PHONE ETIQUETTE. Answer within three (3) rings. Use the standard greeting: "Thank you for calling [Practice Name], this is [Name], how may I help you?" Never place a caller on hold for more than sixty (60) seconds without returning to update them.

6.3 SCRIPTING. Employees are expected to follow approved scripting for common scenarios including: new patient calls, scheduling, insurance inquiries, care plan presentations, financial discussions, and recall/reactivation outreach. Deviations from approved scripts require prior approval from the Office Manager or treating doctor.

6.4 PATIENT COMPLAINTS. All complaints shall be acknowledged with empathy, documented in writing, and escalated to the Office Manager within one (1) business day. No employee is authorized to offer refunds, adjustments, or concessions without prior approval.

SECTION 7: CASH HANDLING PROCEDURES

7.1 All payments must be receipted through the Practice's point-of-sale or practice management system at the time of collection. No "off-system" collections are permitted under any circumstance.

7.2 Cash drawers must be balanced at the beginning and end of each business day by two employees. Any discrepancy exceeding $5.00 must be reported to the Office Manager immediately and documented in the Cash Discrepancy Log.

7.3 Deposits must be prepared and taken to the bank daily. No more than $500.00 in cash shall remain on premises overnight.

7.4 Misappropriation of Practice funds, regardless of amount, will result in immediate termination and referral to law enforcement.

SECTION 8: EMERGENCY PROTOCOLS

8.1 In the event of a medical emergency involving a patient or visitor: Call 911 immediately. Do NOT attempt to diagnose or treat conditions outside the scope of chiropractic practice. Administer first aid/CPR only if certified and if appropriate. Document the incident thoroughly using the Incident Report Form. Notify the Practice Owner within one (1) hour.

8.2 AED and first aid supplies are located at [LOCATION]. All clinical staff must maintain current CPR/AED certification.

8.3 In the event of fire, active threat, or natural disaster, follow the posted evacuation routes. Patient safety takes absolute priority.

SECTION 9: HARASSMENT AND DISCRIMINATION POLICY

9.1 The Practice is committed to providing a workplace free from discrimination and harassment based on race, color, religion, sex (including pregnancy, sexual orientation, and gender identity), national origin, age, disability, genetic information, veteran status, or any other characteristic protected by federal, state, or local law, in full compliance with Title VII of the Civil Rights Act of 1964 and all applicable state and local anti-discrimination statutes.

9.2 Harassment includes any unwelcome conduct — verbal, physical, or visual — that creates an intimidating, hostile, or offensive work environment. Sexual harassment includes unwelcome sexual advances, requests for sexual favors, and any other conduct of a sexual nature that affects employment decisions or creates a hostile environment.

9.3 Reporting: Any employee who experiences or witnesses harassment must report it immediately to the Office Manager, Practice Owner, or designated HR representative. Reports may be made verbally or in writing. All reports will be investigated promptly, thoroughly, and confidentially to the extent possible. Retaliation against any employee who makes a good-faith report is strictly prohibited and will result in termination.

SECTION 10: PROGRESSIVE DISCIPLINE

10.1 The Practice follows a progressive discipline framework:

Step 1: VERBAL WARNING — Documented in writing, signed by employee, placed in personnel file.
Step 2: WRITTEN WARNING — Formal written notice outlining the deficiency, expected improvement, and timeline for improvement (typically 30 days).
Step 3: FINAL WRITTEN WARNING — Notice that any further violation will result in termination.
Step 4: TERMINATION — Effective immediately upon issuance.

10.2 The Practice reserves the right to skip steps in the progressive discipline process for serious misconduct, including but not limited to: theft, violence, HIPAA violations, patient abuse or neglect, substance abuse on premises, or insubordination that endangers patients or staff.

SECTION 11: CHIROPRACTIC-SPECIFIC POLICIES

11.1 ADJUSTING ROOM ETIQUETTE. Adjusting rooms must be cleaned and sanitized between each patient. Face paper must be replaced. Tables must be positioned and set to neutral before each patient enters. Doors must remain open when a doctor is alone with a patient of the opposite sex, unless the patient requests privacy AND a chaperone is not available. Chaperone availability must be offered for all examination and treatment encounters.

11.2 PATIENT GOWNING AND DRAPING. When a patient is asked to remove clothing for examination or treatment, a patient gown must be provided. Appropriate draping must be maintained at all times to protect patient modesty. Only the area being examined or treated should be exposed. Staff must knock and receive verbal permission before entering a room where a patient may be gowning or disrobing.

11.3 NEUROLOGICAL SCAN DATA HANDLING. All scan data must be saved to the Practice's designated secure system immediately following acquisition. Scans must be associated with the correct patient record. Scan data must never be stored on personal devices, portable drives, or unsecured cloud accounts. De-identification protocols must be followed before any scan data is used for education, marketing, or research purposes.

11.4 SUPPLEMENT AND PRODUCT SALES. Employees may recommend supplements and products carried by the Practice only in accordance with protocols established by the treating doctor. No employee shall diagnose conditions, prescribe supplements, or make therapeutic claims. All product recommendations must be documented in the patient's chart. Employees shall not receive individual commissions on supplement sales unless such a commission structure has been approved in writing by the Practice Owner and complies with applicable state regulations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMPLOYEE ACKNOWLEDGMENT

I, _______________________________, acknowledge that I have received, read, and understand the [PRACTICE NAME] Office Policy Manual. I agree to abide by all policies contained herein. I understand that violation of these policies may result in disciplinary action, up to and including termination of employment. I understand that this manual does not constitute an employment contract.

Employee Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

Witness/Manager Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________`,
  },

  // -----------------------------------------------------------------------
  // 2. Vendor/Supplier Agreement
  // -----------------------------------------------------------------------
  {
    id: 'vendor-agreement',
    title: 'Vendor/Supplier Agreement',
    category: 'operations',
    tags: [
      'vendor',
      'supplier',
      'HIPAA BAA',
      'business associate',
      'indemnification',
      'confidentiality',
      'EHR',
      'billing',
    ],
    description:
      'Standard vendor/supplier agreement for chiropractic practices. Covers scope of services, payment terms (net 30 with early payment discount), term and renewal, termination provisions, liability cap, indemnification, confidentiality, HIPAA Business Associate provisions for vendors with PHI access, insurance requirements, and dispute resolution.',
    price: 29,
    wordCount: 1200,
    pageEstimate: 5,
    content: `VENDOR/SUPPLIER AGREEMENT

Effective Date: [DATE]
Practice: [PRACTICE NAME] ("Practice")
Practice Address: [PRACTICE ADDRESS]
Vendor: [VENDOR NAME] ("Vendor")
Vendor Address: [VENDOR ADDRESS]

This Vendor/Supplier Agreement ("Agreement") is entered into by and between the Practice and the Vendor as of the Effective Date.

1. SCOPE OF SERVICES

Vendor shall provide the following products and/or services to the Practice:

[DESCRIPTION OF PRODUCTS/SERVICES]

Vendor shall perform all services in a professional, timely, and workmanlike manner consistent with industry standards. Any material change in the scope of services requires written amendment to this Agreement signed by both parties.

2. PAYMENT TERMS

2.1 FEES. The Practice shall pay the Vendor in accordance with the pricing schedule attached as Exhibit A.

2.2 INVOICING. Vendor shall submit invoices on or before the 1st and 15th of each month, itemizing all products delivered or services rendered during the prior period.

2.3 PAYMENT. Payment is due within thirty (30) days of receipt of a proper invoice ("Net 30"). A discount of 2% of the invoice total ("2/10 Net 30") shall apply to invoices paid within ten (10) days of receipt.

2.4 DISPUTED INVOICES. If the Practice disputes any portion of an invoice, the Practice shall pay the undisputed portion within the standard payment term and notify the Vendor in writing of the disputed amount and the basis for the dispute within fifteen (15) days. The parties shall work in good faith to resolve disputed amounts within thirty (30) days.

2.5 LATE PAYMENT. Invoices unpaid after sixty (60) days shall accrue interest at 1.0% per month on the outstanding balance.

3. TERM AND RENEWAL

3.1 INITIAL TERM. This Agreement shall commence on the Effective Date and continue for an initial term of twelve (12) months.

3.2 RENEWAL. Following the initial term, this Agreement shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.

4. TERMINATION

4.1 TERMINATION FOR CONVENIENCE. Either party may terminate this Agreement for any reason upon thirty (30) days' written notice to the other party.

4.2 TERMINATION FOR BREACH. Either party may terminate this Agreement immediately upon written notice if the other party materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) days of receiving written notice of the breach.

4.3 IMMEDIATE TERMINATION. The Practice may terminate this Agreement immediately, without cure period, upon: (a) Vendor's breach of the HIPAA Business Associate provisions in Section 8; (b) Vendor's bankruptcy, insolvency, or assignment for the benefit of creditors; or (c) any action by Vendor that, in the Practice's reasonable judgment, poses a risk to patient safety or patient data security.

4.4 EFFECT OF TERMINATION. Upon termination, Vendor shall (a) cease all services; (b) return all Practice property, including all PHI in any format, within ten (10) business days; (c) certify destruction of all copies of PHI in Vendor's possession; and (d) submit a final invoice for services rendered through the termination date.

5. LIABILITY CAP

EXCEPT FOR BREACHES OF SECTION 7 (CONFIDENTIALITY) OR SECTION 8 (HIPAA BUSINESS ASSOCIATE), VENDOR'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES PAID BY THE PRACTICE TO THE VENDOR DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) $50,000.00. THIS LIMITATION APPLIES REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE.

6. INDEMNIFICATION

6.1 Vendor shall indemnify, defend, and hold harmless the Practice, its owners, doctors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney's fees) arising out of or relating to: (a) Vendor's negligent or willful acts or omissions; (b) Vendor's breach of this Agreement; (c) any claim that the products or services provided by Vendor infringe upon the intellectual property rights of any third party; or (d) any breach of PHI caused by Vendor or its subcontractors.

6.2 Practice shall indemnify, defend, and hold harmless the Vendor from and against any claims arising out of Practice's negligent or willful acts or omissions, excluding any claim related to Vendor's products or services.

7. CONFIDENTIALITY

7.1 Each party acknowledges that it may receive confidential and proprietary information of the other party ("Confidential Information"). Confidential Information includes, without limitation: business plans, financial data, patient data, pricing strategies, proprietary software, trade secrets, and any information designated as confidential.

7.2 Each party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party without prior written consent; (c) use Confidential Information only for the purposes contemplated by this Agreement; and (d) protect Confidential Information with the same degree of care used to protect its own confidential information, but in no event less than reasonable care.

7.3 Confidentiality obligations survive termination of this Agreement for a period of three (3) years.

8. HIPAA BUSINESS ASSOCIATE PROVISIONS

[ANNOTATION: IF the Vendor will create, receive, maintain, or transmit any protected health information (PHI) on behalf of the Practice, this section is REQUIRED by HIPAA. This includes EHR vendors, billing companies, IT support providers, cloud storage services, answering services, shredding companies, and any other vendor that may encounter patient data. Failure to execute a Business Associate Agreement (BAA) before sharing PHI is a HIPAA violation carrying penalties up to $1.5 million per violation category per year.]

8.1 APPLICABILITY. This Section 8 applies if Vendor will access, create, receive, maintain, or transmit PHI in connection with the services provided under this Agreement. If Vendor will not access PHI, this section is inapplicable and may be stricken by mutual written agreement.

8.2 OBLIGATIONS OF VENDOR AS BUSINESS ASSOCIATE. Vendor agrees to:

(a) Use and disclose PHI only as permitted by this Agreement and as required by law;
(b) Implement administrative, physical, and technical safeguards reasonably designed to protect the confidentiality, integrity, and availability of electronic PHI;
(c) Report to the Practice any use or disclosure of PHI not authorized by this Agreement, including any security incident or breach, within twenty-four (24) hours of discovery;
(d) Make PHI available to the Practice or to patients as necessary to satisfy the Practice's obligations under the HIPAA Privacy Rule;
(e) Make its internal practices and records related to PHI available to the Secretary of HHS for purposes of determining compliance;
(f) Ensure that any subcontractors that access PHI agree in writing to the same restrictions and conditions that apply to Vendor;
(g) Return or destroy all PHI upon termination of this Agreement.

8.3 BREACH NOTIFICATION. In the event of a breach of unsecured PHI, Vendor shall provide the Practice with sufficient information to enable the Practice to comply with breach notification requirements under 45 C.F.R. \u00A7\u00A7 164.404-164.410, including identification of affected individuals, within the timelines required by law.

9. INSURANCE REQUIREMENTS

Vendor shall maintain, at its own expense, the following insurance coverage throughout the term of this Agreement:

(a) Commercial General Liability: $1,000,000 per occurrence / $2,000,000 aggregate;
(b) Professional Liability / Errors & Omissions (if applicable to services): $1,000,000 per occurrence;
(c) Cyber Liability Insurance (if Vendor handles electronic PHI): $1,000,000 per occurrence;
(d) Workers' Compensation: As required by applicable state law.

Vendor shall provide certificates of insurance upon request and shall name the Practice as an additional insured on the Commercial General Liability policy.

10. DISPUTE RESOLUTION

10.1 NEGOTIATION. The parties shall attempt to resolve any dispute arising under this Agreement through good-faith negotiation for a period of thirty (30) days.

10.2 MEDIATION. If negotiation fails, the parties shall submit the dispute to mediation administered by a mutually agreed-upon mediator. Mediation costs shall be shared equally.

10.3 LITIGATION. If mediation fails, either party may pursue remedies in a court of competent jurisdiction in [COUNTY], [STATE].

11. GENERAL PROVISIONS

11.1 INDEPENDENT CONTRACTOR. Vendor is an independent contractor and not an employee, partner, or agent of the Practice.

11.2 ASSIGNMENT. Neither party may assign this Agreement without the prior written consent of the other party.

11.3 ENTIRE AGREEMENT. This Agreement, including all exhibits, constitutes the entire agreement between the parties and supersedes all prior agreements and understandings.

11.4 GOVERNING LAW. This Agreement shall be governed by the laws of the State of [STATE].

11.5 SEVERABILITY. If any provision is held unenforceable, the remaining provisions shall remain in full force and effect.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

PRACTICE:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________
Title: _______________________________

VENDOR:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________
Title: _______________________________`,
  },

  // -----------------------------------------------------------------------
  // 3. Commercial Lease Review Checklist
  // -----------------------------------------------------------------------
  {
    id: 'lease-checklist',
    title: 'Commercial Lease Review Checklist',
    category: 'operations',
    tags: [
      'lease',
      'commercial real estate',
      'rent',
      'CAM',
      'tenant improvement',
      'personal guarantee',
      'exclusivity',
      'NNN',
      'signage',
    ],
    description:
      'Detailed checklist for reviewing a commercial lease before signing. NOT a lease template. Organized by section with checkbox items, explanatory notes, and real-world cautionary examples. Covers personal guarantees, rent escalation, CAM charges, tenant improvement allowance, exclusivity clauses, signage rights, parking, renewal options, subletting, ADA compliance, early termination, and holdover provisions.',
    price: 29,
    wordCount: 1500,
    pageEstimate: 6,
    content: `COMMERCIAL LEASE REVIEW CHECKLIST
For Chiropractic Practices

Use this checklist to review every commercial lease BEFORE signing. Check each item, make notes, and consult with a commercial real estate attorney for any concerns. This document is an educational tool — it is not legal advice and does not substitute for attorney review of your specific lease.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION A: PERSONAL GUARANTEE (HIGHEST RISK ITEM — REVIEW FIRST)

[ ] Does the lease require a personal guarantee?
[ ] If yes, is the guarantee limited in duration (e.g., first 2 years only)?
[ ] Is the guarantee limited in amount (e.g., capped at 12 months' rent)?
[ ] Does the guarantee include a "burn-off" provision (reduces over time with on-time payments)?
[ ] Have you negotiated to substitute a larger security deposit in lieu of a personal guarantee?

NOTES: _________________________________________________________________

!! REAL-WORLD HORROR STORY: A chiropractor in Atlanta signed a 7-year lease with an unlimited personal guarantee. After three years, the practice failed. The landlord sued personally — the doctor owed $380,000 in remaining rent, CAM charges, and landlord's attorney fees. The judgment followed the doctor for years, preventing them from buying a home and destroying their credit. ALWAYS negotiate limits on personal guarantees. If the landlord insists on unlimited personal guarantee for the full term, that is a red flag about the property.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION B: BASE RENT AND ESCALATION

[ ] What is the base rent per square foot? Per month? Per year?
    Base rent: $________/SF/year = $________/month
[ ] Is rent quoted as NNN (triple net), modified gross, or full-service gross?
    (NNN means YOU pay property taxes, insurance, and CAM on top of base rent)
[ ] What is the annual rent escalation?
    - Fixed percentage? _____%
    - CPI-based? (If so, is there a cap? Cap = _____%)
    - Fair market value adjustment? (DANGEROUS — no cap, no predictability)
[ ] Is there a rent abatement period (free rent at the start)? Duration: __________
[ ] Is the rent abatement applied to base rent only, or base rent + NNN?

NOTES: _________________________________________________________________

!! REAL-WORLD HORROR STORY: A doctor signed a lease at $22/SF NNN with "fair market value" escalation every 3 years. The area gentrified. At the first adjustment, rent jumped to $38/SF — a 73% increase. The lease was perfectly legal. ALWAYS insist on CPI-based escalation with a cap of 3-4% annually.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION C: CAM CHARGES (COMMON AREA MAINTENANCE)

[ ] What is the current estimated CAM charge? $________/SF/year
[ ] What categories are included in CAM? (Request a detailed breakdown)
[ ] Are capital expenditures included in CAM? (They should NOT be — or should be amortized)
[ ] Is there an annual cap on CAM increases? Cap: _____% per year
[ ] Do you have audit rights to review landlord's CAM calculations?
[ ] Is there a "gross-up" provision? (Landlord calculates CAM as if building is 95% occupied, even if it's half empty — meaning your share stays artificially high)
[ ] Are management fees included in CAM? (Common — typically 3-5% of gross rent. Push to cap or exclude.)

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION D: BUILD-OUT / TENANT IMPROVEMENT (TI) ALLOWANCE

[ ] Is a TI allowance offered? Amount: $________/SF (target: $20-$50/SF for chiropractic)
[ ] Is the TI allowance paid upfront, upon completion, or as a rent credit?
[ ] Who controls the build-out — you or the landlord?
    (You want control. Landlord-controlled build-outs are typically more expensive and less tailored.)
[ ] Can unused TI allowance be applied to rent?
[ ] Are there restrictions on what TI funds can be used for?
[ ] Does the lease require you to restore the space to "original condition" upon lease expiration?
    (CRITICAL — restoration can cost $30,000-$100,000+ for a chiropractic build-out with x-ray rooms, lead-lined walls, plumbing, etc.)

NOTES: _________________________________________________________________

!! REAL-WORLD HORROR STORY: A chiropractor spent $120,000 on a beautiful build-out including a lead-lined x-ray room. The lease had a restoration clause. At move-out, the landlord demanded full restoration — $85,000 to tear out everything and return the space to shell condition. NEGOTIATE the removal of restoration clauses, or at minimum, exclude specialty improvements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION E: EXCLUSIVITY CLAUSE

[ ] Does the lease include an exclusivity clause prohibiting the landlord from leasing to another chiropractor in the building or complex?
[ ] Is the exclusivity broadly defined? (Should cover "chiropractic services, spinal manipulation, physical therapy, and any substantially similar healthcare services")
[ ] What are the remedies if the landlord violates exclusivity? (Rent abatement is ideal — your rent drops to $0 or a fraction until the violation is cured)
[ ] Does the exclusivity survive assignment or sale of the property?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION F: SIGNAGE RIGHTS

[ ] Exterior building signage permitted? Size/location restrictions?
[ ] Monument sign (freestanding sign at road) — do you get a panel? Cost?
[ ] Directory sign (lobby or building directory) — included in rent?
[ ] Window signage permitted? Restrictions?
[ ] Illuminated signage permitted? Who pays for electricity?
[ ] Can you add signage for sub-specialties (e.g., "Pediatric Chiropractic," "Personal Injury")?
[ ] Do signage rights require landlord approval of design? (Normal — but get approval criteria in writing)

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION G: PARKING

[ ] How many parking spaces are allocated? __________ spaces
    (Rule of thumb: minimum 4 spaces per 1,000 SF for a chiropractic practice)
[ ] Are spaces reserved/designated or general/first-come?
[ ] Is patient parking clearly identifiable and conveniently located?
[ ] Is there a cost for parking? $________/space/month
[ ] Are there restrictions on hours of availability?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION H: RENEWAL AND OPTIONS

[ ] How many renewal options are included? __________ option(s)
[ ] Duration of each renewal period: __________ years
[ ] Notice required to exercise renewal: __________ days/months before expiration
[ ] Is renewal rent at a predetermined rate, CPI-adjusted, or fair market value?
    (Predetermined or CPI-adjusted is preferred — FMV is unpredictable)
[ ] Does the renewal option survive assignment of the lease?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION I: SUBLETTING AND ASSIGNMENT

[ ] Is subletting permitted? With or without landlord consent?
[ ] Is assignment permitted? (Critical if you sell the practice — the buyer needs the lease)
[ ] Can the landlord unreasonably withhold consent to assignment?
    (Insist on "consent shall not be unreasonably withheld, conditioned, or delayed")
[ ] Does assignment release you from the personal guarantee?
[ ] Is there an assignment fee?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION J: MAINTENANCE AND REPAIRS

[ ] Who is responsible for HVAC repair and replacement? (Negotiate: landlord replaces, tenant maintains)
[ ] Who is responsible for plumbing?
[ ] Who is responsible for electrical?
[ ] Who is responsible for roof and structural elements? (Should ALWAYS be landlord)
[ ] Who is responsible for pest control?
[ ] Is there a dollar threshold below which you handle repairs (e.g., under $500)?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION K: ADA COMPLIANCE

[ ] Is the space currently ADA compliant? (Accessible entrance, restroom, doorways ≥ 32")
[ ] Who bears the cost of ADA modifications — landlord or tenant?
[ ] Has an ADA survey been conducted? (Request a copy)
[ ] Is the path of travel from parking to suite accessible?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION L: INSURANCE REQUIREMENTS

[ ] What types of insurance does the lease require you to carry?
[ ] Are the required coverage limits reasonable? (Typical: $1M/$2M CGL)
[ ] Does the lease require you to name the landlord as additional insured?
[ ] Does the lease include a mutual waiver of subrogation? (Desirable)

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION M: EARLY TERMINATION

[ ] Is there an early termination clause? (Most standard leases do NOT include one — you must negotiate it)
[ ] What is the early termination fee? (Typical: 3-6 months' rent + unamortized TI)
[ ] How much notice is required for early termination?
[ ] Can you trigger early termination only after a minimum period (e.g., after year 3 of a 7-year lease)?

NOTES: _________________________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION N: HOLDOVER PROVISIONS

[ ] What happens if you remain in the space after lease expiration?
[ ] Is holdover rent 150% of the last month's rent? (Common — negotiate to cap at 125%)
[ ] Does holdover create a month-to-month tenancy or a lease renewal?
[ ] Is there a grace period before holdover penalties apply?

NOTES: _________________________________________________________________

!! REAL-WORLD HORROR STORY: A chiropractor's lease expired while they were in the middle of negotiating a new one. The holdover clause imposed 200% rent plus the landlord's attorney fees. Two months of negotiation cost the doctor an extra $14,000. ALWAYS start renewal negotiations 6-9 months before expiration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINAL REVIEW CHECKLIST

[ ] Have ALL blanks been filled in? (Never sign a lease with blanks)
[ ] Have all verbal promises been incorporated into the written lease?
[ ] Has the lease been reviewed by a commercial real estate attorney?
[ ] Have all exhibits (floor plan, rules and regulations, TI specifications) been attached?
[ ] Do you have a fully executed copy for your records?

ATTORNEY REVIEWER: _______________________________
DATE OF REVIEW: ___/___/______
RECOMMENDATION: [ ] Proceed as-is  [ ] Proceed with noted changes  [ ] Do NOT sign`,
  },

  // -----------------------------------------------------------------------
  // 4. Buy-Sell / Practice Transition Agreement
  // -----------------------------------------------------------------------
  {
    id: 'buy-sell',
    title: 'Buy-Sell / Practice Transition Agreement',
    category: 'operations',
    tags: [
      'buy-sell',
      'practice sale',
      'transition',
      'valuation',
      'goodwill',
      'non-compete',
      'earnout',
      'seller financing',
      'due diligence',
    ],
    description:
      'Comprehensive agreement for the sale and purchase of a chiropractic practice. Covers valuation methodology (percentage of trailing net collections), payment structure (lump sum, seller financing, and earnout options), asset inventory, patient transition plan, staff retention, seller non-compete, representations and warranties, indemnification, conditions to closing, and post-closing obligations.',
    price: 49,
    wordCount: 2000,
    pageEstimate: 8,
    content: `PRACTICE PURCHASE AND TRANSITION AGREEMENT

Effective Date: [DATE]
Seller: [SELLER NAME], D.C. ("Seller")
Seller Practice Entity: [ENTITY NAME] ("Practice")
Buyer: [BUYER NAME], D.C. ("Buyer")

RECITALS

WHEREAS, Seller is the owner of [PRACTICE NAME], a chiropractic practice located at [ADDRESS], licensed to provide chiropractic services in the State of [STATE] under License No. [LICENSE NO.];

WHEREAS, Seller desires to sell and Buyer desires to purchase substantially all of the assets of the Practice, including goodwill, patient relationships, and the ongoing business as a going concern;

WHEREAS, the parties desire to provide for an orderly transition of care to protect the interests of patients, staff, and both parties;

NOW, THEREFORE, in consideration of the mutual promises and covenants contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

1. PURCHASE PRICE AND VALUATION

1.1 PURCHASE PRICE. The total purchase price for the Practice assets described in Section 2 shall be $[AMOUNT] ("Purchase Price"), determined as follows:

1.2 VALUATION METHODOLOGY. The Purchase Price has been calculated based on [SELECT ONE]:

(a) _____% of the Practice's trailing twelve (12) month net collections (typical range: 50-75% of net collections), based on the period from [START DATE] to [END DATE], during which net collections totaled $[AMOUNT]; OR

(b) An independent practice valuation performed by [VALUATOR NAME], dated [DATE], a copy of which is attached as Exhibit A; OR

(c) A mutually agreed-upon amount not derived from a specific formula.

[ANNOTATION: The percentage-of-collections method is the most common valuation approach for chiropractic practice sales. The typical range of 50-75% depends on several factors: stability of patient base, payer mix (high insurance = more predictable revenue), condition of equipment, lease terms, staff retention likelihood, and the seller's willingness to facilitate transition. Solo practices with owner-dependent referral patterns tend to command the lower end; multi-doctor practices with established systems command the higher end. NEVER rely solely on gross collections — net collections (after adjustments, write-offs, and refunds) are the only meaningful metric.]

1.3 PAYMENT STRUCTURE.

(a) DEPOSIT. Buyer shall deliver a deposit of $[AMOUNT] ("Deposit") to [ESCROW AGENT] within five (5) business days of execution of this Agreement. The Deposit shall be applied to the Purchase Price at Closing or returned to Buyer if the transaction does not close due to a failure of conditions in Section 7.

(b) CASH AT CLOSING. Buyer shall pay $[AMOUNT] at Closing by certified check or wire transfer.

(c) SELLER FINANCING. Buyer shall execute a Promissory Note in favor of Seller in the principal amount of $[AMOUNT] ("Seller Note"), bearing interest at [RATE]% per annum, payable in [NUMBER] equal monthly installments of $[AMOUNT], commencing thirty (30) days after Closing. The Seller Note shall be secured by a UCC-1 security interest in the Practice assets. The form of Promissory Note is attached as Exhibit B.

(d) EARNOUT. In addition to the amounts above, Buyer shall pay Seller an earnout equal to [PERCENTAGE]% of net collections exceeding $[THRESHOLD] during the first [12/24] months following Closing, payable quarterly within thirty (30) days of the close of each quarter. The earnout shall not exceed $[CAP] in the aggregate.

[ANNOTATION: Earnout provisions serve two purposes: they bridge valuation gaps between buyer and seller, and they incentivize the seller to actively support the transition. The threshold should be set above a baseline collection level so the buyer only pays the earnout on truly incremental revenue attributable to the seller's transition support. ALWAYS cap the earnout — without a cap, the seller's incentive is misaligned (they may resist transferring patient loyalty to the buyer to keep their earnout flowing).]

2. ASSETS INCLUDED

The following assets are included in the sale (collectively, "Practice Assets"):

(a) EQUIPMENT AND FURNISHINGS. All chiropractic tables, neurological scanning equipment, x-ray equipment, therapeutic modality units, computers, office furniture, and other tangible personal property used in the Practice, as inventoried in Exhibit C.

(b) PATIENT RECORDS. All patient records, files, charts, diagnostic images, and scan data, subject to applicable privacy laws and patient rights. Seller shall transfer custody of patient records to Buyer in compliance with HIPAA and state record retention requirements.

(c) GOODWILL. The goodwill of the Practice, including the Practice's reputation, patient relationships, referral sources, and community standing.

(d) PRACTICE NAME AND BRANDING. The right to use the Practice name "[PRACTICE NAME]," together with all associated logos, trademarks (registered or unregistered), domain names, website content, and social media accounts (including but not limited to Facebook, Instagram, Google Business Profile, and YouTube accounts).

(e) PHONE NUMBERS AND FAX NUMBERS. All telephone numbers and fax numbers associated with the Practice.

(f) INTELLECTUAL PROPERTY. All proprietary treatment protocols, patient education materials, marketing materials, and other intellectual property developed for the Practice.

(g) CONTRACTS AND AGREEMENTS. Assignment of the office lease (subject to landlord consent), vendor agreements, and any insurance panel contracts that are assignable.

(h) SUPPLIES AND INVENTORY. All office supplies, chiropractic supplies, supplements, and retail inventory on hand as of the Closing Date, valued at cost.

2.2 EXCLUDED ASSETS. The following are NOT included: Seller's personal property, Seller's retirement accounts, accounts receivable for services rendered prior to Closing (which remain Seller's property), and cash on hand.

3. PATIENT TRANSITION PLAN

3.1 TRANSITION PERIOD. Seller shall remain available at the Practice for a transition period of [30/60/90] days following Closing ("Transition Period") for the purpose of introducing patients to the Buyer, facilitating continuity of care, and assisting with the operational handoff.

3.2 INTRODUCTION LETTERS. Within five (5) business days of Closing, the parties shall jointly send a letter to all active patients (patients seen within the preceding 12 months) introducing the Buyer, expressing Seller's confidence in the Buyer's qualifications, and encouraging continued care at the Practice. The letter shall be signed by both Seller and Buyer. A template letter is attached as Exhibit D.

3.3 SELLER'S ROLE DURING TRANSITION. During the Transition Period, Seller shall: (a) provide direct introductions to patients during scheduled visits; (b) introduce Buyer to key referral sources, including attorneys, medical doctors, and community partners; (c) provide training on the Practice's systems, protocols, and procedures; (d) assist with insurance panel credentialing and provider number transitions as needed.

3.4 COMPENSATION DURING TRANSITION. Seller shall receive $[AMOUNT] per day (or a percentage of collections generated by Seller during the Transition Period — typically 40-50% of Seller's personal production) as compensation for Transition Period services.

4. STAFF RETENTION

4.1 Buyer agrees to offer employment to all current Practice employees on terms substantially similar to their current terms (including base compensation, work schedule, and accrued PTO) for a period of at least ninety (90) days following Closing.

4.2 After the 90-day period, Buyer may modify employment terms at Buyer's discretion, subject to applicable employment law.

4.3 Seller shall not solicit, recruit, or hire any Practice employee for a period of two (2) years following Closing.

5. SELLER'S NON-COMPETE COVENANT

5.1 RESTRICTION. For a period of [3/4/5] years following the Closing Date, Seller shall not, directly or indirectly, own, manage, operate, consult for, or be employed by any chiropractic practice or healthcare practice offering services substantially similar to those offered by the Practice within a radius of [10/15/20/25] miles of the Practice's current location.

5.2 NON-SOLICITATION. For the same period, Seller shall not directly or indirectly solicit, contact, or treat any patient of the Practice, or solicit any referral source of the Practice.

5.3 REASONABLENESS. The parties acknowledge that the geographic and temporal scope of this covenant is reasonable and necessary to protect the value of the goodwill being purchased. Seller acknowledges that the Purchase Price includes significant consideration for goodwill, and that this non-compete is an essential element of the transaction without which Buyer would not proceed.

5.4 REMEDIES. In the event of a breach, Buyer shall be entitled to injunctive relief without the requirement of posting a bond, in addition to monetary damages. If a court determines the scope of this covenant to be overbroad, the parties agree that the court may reform the covenant to the maximum enforceable scope rather than voiding it entirely.

[ANNOTATION: Non-competes in practice sales are treated VERY differently from employment non-competes by courts. Even in states that are hostile to employment non-competes (like California), non-competes incident to the sale of a business are almost universally enforceable because the buyer is paying consideration specifically for the goodwill — and a non-compete is the mechanism that protects it. A 3-5 year term and 10-25 mile radius is standard for chiropractic practice sales. The judicial reformation clause is important: rather than having the entire covenant struck down, the court can simply narrow it to what it deems reasonable.]

6. REPRESENTATIONS AND WARRANTIES

6.1 SELLER REPRESENTS AND WARRANTS:

(a) Seller has full legal authority to sell the Practice Assets and enter into this Agreement;
(b) The Practice has been operated in compliance with all applicable federal, state, and local laws, including healthcare licensing requirements;
(c) The financial statements and tax returns provided to Buyer for the preceding three (3) fiscal years are accurate, complete, and fairly present the financial condition of the Practice;
(d) There are no undisclosed liabilities, debts, or obligations that will be assumed by or affect the Buyer;
(e) There is no pending or threatened litigation, arbitration, or regulatory action against the Practice or Seller in connection with the Practice;
(f) All equipment is in good working order, and Seller has disclosed all known defects;
(g) All tax obligations (income, payroll, sales) are current and fully paid;
(h) The Practice is not currently under investigation by any licensing board, insurance company, or government agency;
(i) All insurance panel contracts are in good standing and Seller has not been excluded from any federal or state healthcare program.

6.2 BUYER REPRESENTS AND WARRANTS:

(a) Buyer holds (or will hold prior to Closing) an active, unrestricted chiropractic license in the State of [STATE];
(b) Buyer has the financial capacity to complete the transaction and perform under this Agreement;
(c) Buyer has not been excluded from any federal or state healthcare program.

7. CONDITIONS TO CLOSING

Closing shall occur on [DATE] ("Closing Date"), subject to the satisfaction of the following conditions:

(a) Landlord's written consent to assignment of the office lease to Buyer on terms acceptable to Buyer;
(b) Buyer's successful completion of due diligence, including review of financial records, patient volume data, insurance panel contracts, equipment condition, and lease terms;
(c) Buyer's procurement of financing sufficient to fund the cash portion of the Purchase Price (if applicable);
(d) State chiropractic board approval of the transfer, if required by applicable state law;
(e) No material adverse change in the Practice's financial condition or patient volume between the Effective Date and the Closing Date;
(f) Execution of all ancillary documents, including the Promissory Note, security agreements, lease assignment, and transition plan.

8. INDEMNIFICATION

8.1 Seller shall indemnify and hold harmless Buyer from any losses, liabilities, claims, or expenses arising from: (a) any breach of Seller's representations and warranties; (b) any liabilities of the Practice arising prior to the Closing Date; (c) any malpractice claim arising from care provided by Seller prior to the Closing Date.

8.2 Buyer shall indemnify and hold harmless Seller from any losses, liabilities, claims, or expenses arising from: (a) any breach of Buyer's representations and warranties; (b) Buyer's operation of the Practice following the Closing Date; (c) any malpractice claim arising from care provided by Buyer following the Closing Date.

8.3 Indemnification claims must be asserted in writing within two (2) years of the Closing Date, except for claims related to tax obligations, which may be asserted within the applicable statute of limitations.

9. POST-CLOSING OBLIGATIONS

9.1 Seller shall cooperate with Buyer in transitioning insurance panel credentials and provider numbers.

9.2 Seller shall promptly forward to Buyer any correspondence, referrals, or communications received for the Practice following Closing.

9.3 Seller shall make himself/herself available for reasonable consultation (not to exceed five (5) hours per month) for a period of six (6) months following the Transition Period, at no additional charge.

9.4 Buyer shall maintain Seller's patient records in accordance with applicable state retention requirements (typically 7-10 years for adults, longer for minors).

10. GENERAL PROVISIONS

10.1 GOVERNING LAW. This Agreement shall be governed by the laws of the State of [STATE].
10.2 DISPUTE RESOLUTION. Disputes shall be resolved by mediation, followed by binding arbitration if mediation is unsuccessful.
10.3 ENTIRE AGREEMENT. This Agreement and all exhibits constitute the entire agreement between the parties.
10.4 SEVERABILITY. Invalid provisions shall be reformed or severed without affecting the remaining provisions.
10.5 COUNTERPARTS. This Agreement may be executed in counterparts, each of which shall be deemed an original.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

SELLER:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

BUYER:
Signature: _______________________________ Date: ___/___/______
Print Name: _______________________________

EXHIBITS:
[ ] Exhibit A — Practice Valuation Report
[ ] Exhibit B — Promissory Note
[ ] Exhibit C — Equipment and Asset Inventory
[ ] Exhibit D — Patient Introduction Letter Template`,
  },
];
