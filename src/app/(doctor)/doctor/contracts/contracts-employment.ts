export interface ContractTemplate {
  id: string;
  title: string;
  category: 'employment' | 'patient' | 'operations' | 'clause';
  tags: string[];
  description: string;
  content: string;
  price: number;
  wordCount: number;
  pageEstimate: number;
}

// ---------------------------------------------------------------------------
// Template 1 -- Associate Doctor Employment Agreement
// ---------------------------------------------------------------------------

const associateEmploymentContent = `ASSOCIATE DOCTOR EMPLOYMENT AGREEMENT

THIS ASSOCIATE DOCTOR EMPLOYMENT AGREEMENT (the "Agreement") is entered into as of [EFFECTIVE DATE] (the "Effective Date"), by and between:

EMPLOYER:
[PRACTICE NAME], a [STATE] [ENTITY TYPE, e.g., Professional Corporation, PLLC] with its principal place of business at [PRACTICE ADDRESS] (hereinafter "Practice" or "Employer");

AND

ASSOCIATE:
[ASSOCIATE NAME], D.C., an individual licensed to practice chiropractic in the State of [STATE], residing at [ASSOCIATE ADDRESS] (hereinafter "Associate" or "Doctor").

Collectively referred to as the "Parties" and individually as a "Party."

RECITALS

WHEREAS, Practice operates a chiropractic clinic providing spinal correction, neurological rehabilitation, and wellness care to patients in [CITY/REGION], [STATE];

WHEREAS, Associate holds a valid, unrestricted license to practice chiropractic medicine in the State of [STATE], License No. [LICENSE NUMBER], and desires to practice chiropractic under the terms and conditions set forth herein;

WHEREAS, Practice desires to engage Associate to provide chiropractic services to the patients of Practice, and Associate desires to accept such engagement;

NOW, THEREFORE, in consideration of the mutual promises, covenants, and conditions contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

[ANNOTATION: The recitals are not mere formalities. They establish the business context and demonstrate mutual consideration -- both essential if this agreement is ever challenged in court. Always specify the associate's license number and state. If the associate is licensed in multiple states, list each one. This prevents disputes about scope of practice authority.]

-----------------------------------------------------------------------
ARTICLE 1 -- POSITION, DUTIES, AND CLINICAL EXPECTATIONS
-----------------------------------------------------------------------

1.1 POSITION. Practice hereby employs Associate as an Associate Doctor of Chiropractic. Associate shall report directly to [SUPERVISING DOCTOR NAME], D.C. ("Clinical Director") or such other person as Practice may designate from time to time.

1.2 SCOPE OF CLINICAL DUTIES. Associate shall perform the following clinical duties in a manner consistent with Practice protocols, the chiropractic standard of care in [STATE], and all applicable laws and regulations:

   (a) Patient Examinations and Consultations. Conduct thorough initial examinations including orthopedic testing, neurological assessment, postural analysis, and spinal range-of-motion evaluation for new patients and re-examinations for existing patients on the schedule prescribed by Practice protocols.

   (b) Diagnostic Imaging and Scanning Protocols. Perform and interpret diagnostic studies including but not limited to: full-spine radiographs (when clinically indicated and in compliance with state radiation safety regulations), surface electromyography (sEMG), thermographic scanning (infrared or rolling thermal), heart rate variability (HRV) assessments, and computerized postural analysis. Associate shall follow Practice's established scanning protocols for frequency and documentation, including but not limited to: initial scans at Day 1, progress scans at [PROGRESS SCAN INTERVAL, e.g., 12 visits / 30 days], and re-examination scans at [RE-EXAM INTERVAL, e.g., 24 visits / 90 days].

   (c) Report of Findings (ROF). Deliver Report of Findings presentations to patients using Practice's established ROF format, including explanation of subluxation findings, recommended care plan duration and frequency, financial options, and expected outcomes. Associate shall achieve and maintain a ROF conversion rate of no less than [ROF TARGET PERCENTAGE, e.g., 80]% as measured on a rolling [ROF MEASUREMENT PERIOD, e.g., 30]-day basis.

   (d) Chiropractic Adjustments and Therapeutic Procedures. Deliver chiropractic adjustments using techniques approved by Practice, which may include but are not limited to: Diversified, Gonstead, Thompson Drop, Activator Methods, Flexion-Distraction, and Upper Cervical specific protocols ([SPECIFY TECHNIQUES]). Administer adjunctive therapies as directed, including spinal decompression, electrical muscle stimulation, ultrasound, cold laser therapy, and rehabilitative exercises.

   (e) Patient Volume Expectations. Associate shall work toward maintaining a patient volume of [MINIMUM PATIENT VISITS PER WEEK, e.g., 80-120] patient visits per week within [RAMP-UP PERIOD, e.g., 6] months of the Effective Date. Practice shall provide reasonable patient flow, marketing support, and new-patient allocation to support Associate in reaching this target. Failure to meet patient volume targets shall not alone constitute grounds for termination, but shall trigger a performance review under Section 1.5.

   (f) Documentation and Compliance. Complete all patient documentation, including SOAP notes, in Practice's electronic health records system ([EHR SYSTEM NAME]) within [DOCUMENTATION DEADLINE, e.g., 24] hours of the patient encounter. All documentation must comply with [STATE] Board of Chiropractic Examiners requirements and, where applicable, Medicare/Medicaid documentation standards.

   (g) Community Outreach and Events. Participate in Practice-sponsored community events, including but not limited to: health fairs, spinal screening events, dinner-with-the-doctor presentations, corporate wellness talks, and school backpack checks. Associate shall participate in a minimum of [COMMUNITY EVENTS PER MONTH, e.g., 2] community events per month unless excused in writing by Clinical Director.

1.3 STANDARD OF CARE. Associate shall at all times perform services in accordance with the generally accepted standards of chiropractic practice in [STATE], the rules and regulations of the [STATE] Board of Chiropractic Examiners, and all applicable federal, state, and local laws.

1.4 EXCLUSIVE SERVICE. During the term of this Agreement, Associate shall devote substantially all professional time, energy, and skill to the practice of chiropractic at Practice. Associate shall not engage in the practice of chiropractic outside of Practice without prior written consent of Practice, except for volunteer or charitable work that does not interfere with Associate's duties hereunder.

1.5 PERFORMANCE REVIEWS. Practice shall conduct performance reviews at [REVIEW INTERVAL, e.g., 90 days, 6 months, and annually] following the Effective Date and at regular intervals thereafter. Reviews shall evaluate clinical quality, patient satisfaction scores, ROF conversion rates, patient visit averages, documentation compliance, and participation in community events and continuing education.

[ANNOTATION: This article is the backbone of the employment relationship. The specificity here protects both parties. For the practice owner, detailed expectations make performance-based termination defensible. For the associate, clearly defined duties prevent scope creep and unreasonable demands. Note the patient volume section carefully: we intentionally state that missing volume targets alone is NOT cause for termination. This is critical because courts have found that terminating a doctor solely for low volume -- when the practice controls new patient flow -- can constitute a breach of the implied covenant of good faith. The scanning protocol section should match your actual office procedures exactly. A mismatch between the contract and reality weakens the entire agreement.]

-----------------------------------------------------------------------
ARTICLE 2 -- TERM
-----------------------------------------------------------------------

2.1 INITIAL TERM. This Agreement shall commence on the Effective Date and shall continue for an initial term of [INITIAL TERM LENGTH, e.g., 2 years] (the "Initial Term"), unless earlier terminated in accordance with Article 8.

2.2 RENEWAL. Upon expiration of the Initial Term, this Agreement shall automatically renew for successive [RENEWAL TERM, e.g., 1-year] periods (each a "Renewal Term") unless either Party provides written notice of non-renewal at least [NON-RENEWAL NOTICE PERIOD, e.g., 90] days prior to the expiration of the then-current term.

[ANNOTATION: Auto-renewal clauses benefit the practice by ensuring continuity. However, some states (e.g., Illinois, New York) have specific requirements for auto-renewal provisions in employment contracts. The non-renewal notice period should be long enough for the practice to recruit a replacement and for the associate to find a new position. We recommend 90 days minimum.]

-----------------------------------------------------------------------
ARTICLE 3 -- COMPENSATION
-----------------------------------------------------------------------

SELECT ONE OF THE FOLLOWING COMPENSATION STRUCTURES (A, B, OR C). DELETE THE ALTERNATIVES NOT SELECTED. THE SELECTED SECTION BECOMES ARTICLE 3 OF THIS AGREEMENT.

==== OPTION A: PERCENTAGE OF COLLECTIONS ====

3A.1 COMPENSATION. Associate shall be compensated at a rate of [PERCENTAGE, e.g., 30]% of Net Collections attributable to Associate's personal professional services ("Associate Collections").

3A.2 DEFINITION OF NET COLLECTIONS. "Net Collections" means the gross amounts actually received by Practice for chiropractic services personally rendered by Associate, less: (a) refunds, (b) contractual adjustments required by insurance contracts, (c) write-offs approved by Practice in accordance with its standard collection policies, and (d) amounts attributable to ancillary services not personally performed by Associate (e.g., massage therapy, X-rays taken by a technician, supplements). For avoidance of doubt, Net Collections shall NOT be reduced by Practice overhead, rent, staff salaries, marketing costs, or any other Practice operating expenses.

3A.3 CALCULATION METHODOLOGY. Collections shall be attributed to Associate based on the treating provider listed in [EHR SYSTEM NAME] for each date of service. Where multiple providers contribute to a single patient encounter, collections shall be allocated based on [ALLOCATION METHOD: e.g., the provider who performed the adjustment / pro rata based on CPT codes billed by each provider].

3A.4 GUARANTEED MINIMUM. During the first [GUARANTEE PERIOD, e.g., 6] months of employment (the "Ramp-Up Period"), Associate shall receive a guaranteed minimum monthly compensation of $[MONTHLY MINIMUM, e.g., 5,000] (the "Floor"), regardless of collections. If Associate's percentage-based compensation exceeds the Floor in any month during the Ramp-Up Period, Associate shall receive the higher amount. Upon expiration of the Ramp-Up Period, the Floor shall expire and compensation shall be based solely on percentage of collections.

3A.5 COLLECTION BENCHMARKS. As an incentive, the following tiered commission structure shall apply to monthly Net Collections:
   - First $[TIER 1 THRESHOLD, e.g., 20,000] in Net Collections: [BASE PERCENTAGE, e.g., 25]%
   - Net Collections from $[TIER 1 THRESHOLD] to $[TIER 2 THRESHOLD, e.g., 35,000]: [MID PERCENTAGE, e.g., 30]%
   - Net Collections exceeding $[TIER 2 THRESHOLD]: [TOP PERCENTAGE, e.g., 35]%

3A.6 PAYMENT SCHEDULE. Compensation shall be paid on the [PAYMENT FREQUENCY, e.g., 1st and 15th] of each month for the preceding pay period. Because collections are received on a rolling basis, each payment shall reflect collections actually received by Practice through the [COLLECTION CUTOFF, e.g., last business day] of the preceding pay period. Adjustments for late-arriving payments shall be reconciled monthly.

3A.7 TRANSPARENCY AND AUDIT. Practice shall provide Associate with a detailed collections report for each pay period, including: patient name, date of service, CPT codes billed, amount billed, amount collected, adjustments, and Associate's calculated compensation. Associate shall have the right to review supporting documentation upon [AUDIT NOTICE PERIOD, e.g., 10] business days' written notice, not more than once per calendar quarter.

[ANNOTATION: The percentage-of-collections model is the most common in chiropractic and aligns incentives -- the associate earns more when the practice earns more. CRITICAL: Define "Net Collections" with extreme precision. The number one source of associate disputes is disagreement over what counts as a "collection." Always exclude practice overhead from the deduction -- an associate should never have their percentage reduced by the practice's rent or staff costs. The tiered structure rewards high performers and is much more motivating than a flat percentage. The audit right is essential for trust; without it, associates inevitably suspect they are being underpaid. If you are in a state that requires specific wage statement disclosures (e.g., California, New York), ensure your reports comply.]

==== OPTION B: BASE SALARY PLUS PRODUCTION BONUS ====

3B.1 BASE SALARY. Associate shall receive a base salary of $[MONTHLY BASE SALARY, e.g., 6,500] per month ($[ANNUAL BASE SALARY, e.g., 78,000] annualized), payable in accordance with Practice's standard payroll schedule.

3B.2 PRODUCTION BONUS. In addition to the base salary, Associate shall be eligible for a monthly production bonus calculated as follows:
   - If Associate's Net Collections (as defined in Section 3A.2, incorporated by reference) for a calendar month exceed $[BONUS THRESHOLD, e.g., 25,000], Associate shall receive a bonus equal to [BONUS PERCENTAGE, e.g., 15]% of Net Collections in excess of the threshold.
   - Example: If Net Collections for a month total $32,000 and the threshold is $25,000, the bonus equals 15% x $7,000 = $1,050, in addition to the base salary.

3B.3 QUARTERLY PERFORMANCE BONUS. Associate shall be eligible for a quarterly bonus of $[QUARTERLY BONUS, e.g., 2,000] if all of the following targets are met during the quarter:
   (a) Average patient visits per week of [PVA TARGET, e.g., 100] or more;
   (b) ROF close rate of [ROF TARGET, e.g., 80]% or higher;
   (c) Documentation completion rate of 95% or higher;
   (d) Participation in [EVENTS TARGET, e.g., 6] or more community events during the quarter.

3B.4 SALARY REVIEW. Base salary shall be reviewed annually on the anniversary of the Effective Date. Any increase shall be at Practice's sole discretion, taking into account Associate's performance, Practice revenue, and market conditions.

3B.5 PAYMENT SCHEDULE. Base salary shall be paid [PAYROLL FREQUENCY, e.g., bi-weekly / semi-monthly] in accordance with Practice's standard payroll schedule. Production bonuses shall be paid within [BONUS PAYMENT TIMING, e.g., 30] days following the end of the applicable month. Quarterly bonuses shall be paid within [QUARTERLY PAYMENT TIMING, e.g., 45] days following the end of the applicable quarter.

[ANNOTATION: The base-plus-bonus model works well for associates who want income stability while still having upside. For practice owners, it controls fixed costs while incentivizing production. Set the bonus threshold at approximately 60-70% of expected collections so the associate has a realistic chance of earning bonuses early. The quarterly performance bonus tied to non-financial metrics (ROF rate, documentation, events) ensures the associate is a complete team player, not just a volume machine. WARNING: If the base salary is too low relative to market rates, you risk the associate treating this as a draw and becoming resentful. Typical base salaries for associate chiropractors range from $5,000-$8,000/month depending on market and experience level.]

==== OPTION C: FLAT SALARY ====

3C.1 SALARY. Associate shall receive a fixed salary of $[MONTHLY SALARY, e.g., 8,500] per month ($[ANNUAL SALARY, e.g., 102,000] annualized), payable in accordance with Practice's standard payroll schedule.

3C.2 SALARY ADJUSTMENTS. Salary shall be reviewed at the [REVIEW TIMING, e.g., 12-month] mark following the Effective Date and annually thereafter. Adjustments may be made based on:
   (a) Associate's clinical performance metrics;
   (b) Practice revenue growth;
   (c) Patient satisfaction survey results;
   (d) Market compensation data for associate chiropractors in the [CITY/REGION] area.

3C.3 DISCRETIONARY BONUS. Practice may, in its sole discretion, award periodic bonuses based on exceptional performance, practice milestones, or other criteria. Any such bonus shall not create an expectation or entitlement to future bonuses.

3C.4 PAYMENT SCHEDULE. Salary shall be paid [PAYROLL FREQUENCY, e.g., bi-weekly / semi-monthly] in accordance with Practice's standard payroll schedule, subject to all applicable withholdings and deductions.

[ANNOTATION: The flat salary model provides maximum predictability for both parties. Associates love the stability; owners appreciate the predictable cost. However, it carries a significant risk for the practice: there is no built-in incentive for the associate to grow production. Mitigate this by using the performance review process aggressively and tying salary increases to measurable growth. We recommend the flat salary model primarily for: (1) brand-new graduates in their first 6-12 months, (2) associates in a ramp-up period before transitioning to percentage-based pay, or (3) highly experienced doctors who consistently produce at a known level. The salary range of $6,000-$10,000/month should be calibrated to your market -- urban areas and states with higher cost of living command higher salaries.]

-----------------------------------------------------------------------
ARTICLE 4 -- SCHEDULE AND HOURS
-----------------------------------------------------------------------

4.1 CLINICAL HOURS. Associate shall maintain a clinical schedule of [WEEKLY CLINICAL HOURS, e.g., 36] hours per week ("Clinical Hours"). Clinical Hours are defined as hours during which Associate is scheduled and available to see patients, including time spent on patient examinations, adjustments, ROFs, and direct patient communication.

4.2 NON-CLINICAL DUTIES. In addition to Clinical Hours, Associate shall dedicate reasonable time to non-clinical duties including but not limited to: documentation and charting, team meetings (including daily morning huddles), case review conferences, community outreach events, and continuing education. Non-clinical duties are expected to require approximately [NON-CLINICAL HOURS, e.g., 4-8] hours per week.

4.3 OFFICE HOURS. Practice's standard office hours are [OFFICE HOURS, e.g., Monday-Thursday 8:00 AM - 12:00 PM and 2:30 PM - 6:30 PM; Friday 8:00 AM - 12:00 PM]. Associate's specific schedule within these hours shall be established by mutual agreement and may be adjusted by Practice with [SCHEDULE CHANGE NOTICE, e.g., 14] days' written notice.

4.4 SATURDAY AND EXTENDED HOURS. Associate may be required to work [SATURDAY FREQUENCY, e.g., 2 Saturdays per month] from [SATURDAY HOURS, e.g., 9:00 AM - 12:00 PM]. Saturday hours shall count toward the weekly Clinical Hours requirement.

4.5 ON-CALL. Associate shall participate in any on-call rotation established by Practice for after-hours patient emergencies. On-call responsibilities shall be shared equitably among all doctors in the Practice.

[ANNOTATION: Define "Clinical Hours" precisely. A common dispute arises when the practice expects 36 hours of patient contact but the associate counts documentation and meetings toward that total. By separating clinical and non-clinical time, both parties have clear expectations. The morning huddle reference is intentional -- if your practice runs a daily huddle (and it should), build it into the contract so attendance is expected, not optional.]

-----------------------------------------------------------------------
ARTICLE 5 -- NON-COMPETITION AND NON-SOLICITATION
-----------------------------------------------------------------------

5.1 NON-COMPETE COVENANT. During the term of this Agreement and for a period of [NON-COMPETE DURATION, e.g., 2] year(s) following the termination of this Agreement for any reason (the "Restricted Period"), Associate shall not, directly or indirectly, own, manage, operate, control, be employed by, consult with, or participate in the ownership, management, operation, or control of any chiropractic practice, clinic, or healthcare facility that offers chiropractic services within a radius of [NON-COMPETE RADIUS, e.g., 15] miles from any location at which Practice operates as of the date of termination (the "Restricted Area").

5.2 PATIENT NON-SOLICITATION. During the Restricted Period, Associate shall not, directly or indirectly, solicit, contact, or attempt to induce any patient of Practice to: (a) discontinue or reduce their patronage of Practice, or (b) become a patient of any chiropractic practice in which Associate has an interest or by which Associate is employed. For purposes of this Section, "patient of Practice" means any individual who received chiropractic services from Practice within the [PATIENT LOOKBACK PERIOD, e.g., 24] months preceding Associate's termination.

5.3 EMPLOYEE AND CONTRACTOR NON-SOLICITATION. During the Restricted Period, Associate shall not, directly or indirectly, recruit, solicit, or induce any employee, independent contractor, or agent of Practice to terminate their relationship with Practice.

5.4 VENDOR AND REFERRAL SOURCE NON-SOLICITATION. During the Restricted Period, Associate shall not, directly or indirectly, solicit or interfere with Practice's relationships with its referral sources, including but not limited to: medical doctors, personal injury attorneys, massage therapists, physical therapists, or other healthcare providers who refer patients to Practice.

5.5 CONSIDERATION. Associate acknowledges that: (a) this Agreement and the compensation, training, access to patients, and professional development opportunities provided hereunder constitute adequate consideration for the restrictive covenants in this Article 5; and (b) the restrictions are reasonable in scope, duration, and geographic area and are necessary to protect Practice's legitimate business interests, including its patient relationships, proprietary clinical protocols, and confidential business information.

5.6 REMEDIES. Associate acknowledges that a breach of this Article 5 would cause irreparable harm to Practice for which monetary damages would be an inadequate remedy. Accordingly, Practice shall be entitled to seek injunctive relief (temporary, preliminary, and permanent) in addition to any other remedies available at law or in equity. In the event of a breach, the Restricted Period shall be tolled for the duration of the breach.

5.7 JUDICIAL MODIFICATION. If any court of competent jurisdiction determines that any provision of this Article 5 is unenforceable because it is overbroad in scope, duration, or geographic area, the Parties agree that the court shall modify such provision to the minimum extent necessary to make it enforceable, and this Article 5 as so modified shall remain in full force and effect.

[ANNOTATION: Non-competes are the most litigated clause in chiropractic employment agreements. CRITICAL STATE-SPECIFIC NOTES: California (and increasingly Colorado, Minnesota, North Dakota, and Oklahoma) prohibit or severely restrict non-compete agreements for employees. If your practice is in California, DO NOT include Section 5.1 -- it is void and attempting to enforce it can expose you to liability. In states where non-competes are enforceable, courts apply a reasonableness test. Generally: 10-15 miles is enforceable in urban/suburban areas; 15-25 miles may be appropriate in rural areas where practices are spread out; more than 25 miles is almost always struck down. Duration of 1-2 years is generally reasonable; more than 2 years is risky. The "judicial modification" clause (also called a blue-pencil clause) is critical -- without it, an overbroad restriction may be voided entirely rather than trimmed. The tolling provision prevents an associate from breaching the covenant, running out the clock, and then competing freely. Patient non-solicitation is often more enforceable than geographic non-competes and may be your strongest protection.]

-----------------------------------------------------------------------
ARTICLE 6 -- TERMINATION
-----------------------------------------------------------------------

6.1 TERMINATION FOR CAUSE BY PRACTICE. Practice may terminate this Agreement immediately upon written notice if Associate:
   (a) Has their chiropractic license suspended, revoked, or restricted by any state licensing board;
   (b) Is convicted of a felony or any crime involving moral turpitude, fraud, or dishonesty;
   (c) Commits an act of gross negligence or willful misconduct in the performance of clinical duties;
   (d) Materially breaches any provision of this Agreement and fails to cure such breach within [CURE PERIOD, e.g., 15] days after written notice specifying the breach;
   (e) Commits fraud, embezzlement, or misappropriation of Practice funds or property;
   (f) Engages in sexual harassment, discrimination, or other conduct in violation of Practice policies or applicable law;
   (g) Fails to maintain professional liability insurance as required by this Agreement;
   (h) Is found to be impaired by drugs or alcohol while providing patient care;
   (i) Engages in patient abandonment or a pattern of substandard care;
   (j) Is excluded from participation in any federal or state healthcare program (e.g., Medicare, Medicaid).

6.2 TERMINATION WITHOUT CAUSE. Either Party may terminate this Agreement without cause upon [WITHOUT CAUSE NOTICE PERIOD, e.g., 90] days' prior written notice to the other Party. During the notice period, Practice may, at its option: (a) require Associate to continue performing duties, (b) relieve Associate of clinical duties while continuing to pay compensation ("garden leave"), or (c) pay Associate the equivalent of [WITHOUT CAUSE NOTICE PERIOD] days' compensation in lieu of notice and terminate immediately.

6.3 TERMINATION FOR CAUSE BY ASSOCIATE. Associate may terminate this Agreement immediately upon written notice if Practice:
   (a) Fails to pay compensation when due and does not cure such failure within [PRACTICE CURE PERIOD, e.g., 10] days after written notice;
   (b) Requires Associate to perform services in violation of the chiropractic standard of care or applicable law;
   (c) Materially breaches its obligations under this Agreement and fails to cure such breach within [PRACTICE CURE PERIOD] days after written notice;
   (d) Fails to maintain malpractice insurance coverage as required by this Agreement.

6.4 OBLIGATIONS UPON TERMINATION. Upon termination for any reason:
   (a) Associate shall immediately return all Practice property, including keys, access badges, electronic devices, patient files (originals and copies), clinical protocols, and marketing materials;
   (b) Associate shall cooperate in the orderly transition of patient care, including completing documentation for all open cases;
   (c) Practice shall pay all accrued but unpaid compensation within [FINAL PAY TIMELINE, e.g., 30] days of termination, or as required by [STATE] law, whichever is sooner;
   (d) All provisions of this Agreement that by their nature survive termination (including Articles 5, 7, 9, and 10) shall survive;
   (e) Associate shall execute and deliver any documents reasonably necessary to effectuate the transition, including patient notification letters approved by both Parties.

6.5 PATIENT NOTIFICATION. Upon termination, Practice shall send a written notification to all active patients treated by Associate within the [PATIENT NOTIFICATION PERIOD, e.g., 12] months preceding termination, informing them of the transition and their right to choose any provider. The content of such notification shall be mutually agreed upon, provided that agreement is not unreasonably withheld.

[ANNOTATION: The termination provisions must be balanced. A contract that only allows the practice to terminate is unconscionable and may be voided. Note that Section 6.3 gives the associate the right to terminate immediately if the practice requires substandard care -- this is not just good practice, it is an ethical obligation under every state's chiropractic practice act. The "garden leave" option in 6.2 is a powerful tool: it allows the practice to remove a departing associate from patient contact immediately while honoring the notice period financially. Without it, a departing associate might spend their notice period subtly (or not so subtly) encouraging patients to follow them. The patient notification provision is required by many state licensing boards and is ethically mandated regardless. Failing to notify patients can result in board complaints against both doctors.]

-----------------------------------------------------------------------
ARTICLE 7 -- INTELLECTUAL PROPERTY
-----------------------------------------------------------------------

7.1 PRACTICE PROPERTY. Associate acknowledges and agrees that the following constitute the exclusive property of Practice:
   (a) All patient records, files, and clinical documentation;
   (b) Patient relationships, including contact information and treatment histories;
   (c) Clinical protocols, procedures, and treatment systems developed or used by Practice;
   (d) Marketing materials, brand assets, and social media content created during Associate's employment, including content posted on Practice's social media accounts or created using Practice resources;
   (e) Business methods, fee schedules, and operational procedures;
   (f) Training materials, scripts, and presentation decks;
   (g) Any inventions, improvements, or developments related to chiropractic clinical methods made by Associate during working hours or using Practice resources.

7.2 SOCIAL MEDIA AND ONLINE PRESENCE. Any social media accounts created or maintained in Practice's name or for Practice's benefit shall be the property of Practice. Associate shall not use Practice's social media accounts after termination. Associate may maintain their own personal professional social media accounts, provided they do not use Practice's proprietary content, patient testimonials (even with consent previously given), or branding after termination.

7.3 RETURN OF MATERIALS. Upon termination, Associate shall promptly return all materials described in this Article 7 and shall not retain copies in any format (physical or electronic).

[ANNOTATION: Social media ownership is one of the most overlooked issues in chiropractic employment agreements. When an associate builds a following on the practice's Instagram account or creates TikTok content that goes viral, who owns that audience? Without this clause, it is a gray area. Define it clearly. Patient relationships are the most valuable asset in a chiropractic practice. This clause makes clear that the practice -- not the associate -- owns those relationships. However, note that you cannot prevent a patient from choosing their own provider. What you can prevent is the associate actively soliciting those patients (see Article 5).]

-----------------------------------------------------------------------
ARTICLE 8 -- MALPRACTICE INSURANCE
-----------------------------------------------------------------------

8.1 COVERAGE. Practice shall provide and maintain, at Practice's expense, professional liability (malpractice) insurance covering Associate's chiropractic services performed within the scope of this Agreement. Coverage shall be in an amount of no less than $[COVERAGE PER OCCURRENCE, e.g., 1,000,000] per occurrence and $[COVERAGE AGGREGATE, e.g., 3,000,000] in the aggregate.

8.2 POLICY TYPE. Coverage shall be provided on a [POLICY TYPE: "claims-made" or "occurrence"] basis. If coverage is provided on a claims-made basis, Practice's obligations regarding tail coverage shall be as set forth in Section 8.3.

8.3 TAIL COVERAGE. If malpractice coverage is provided on a claims-made basis:
   (a) If Practice terminates this Agreement without cause, or if Associate terminates for cause under Section 6.3, Practice shall purchase and pay for tail coverage (extended reporting period endorsement) for Associate for a minimum period of [TAIL COVERAGE PERIOD, e.g., 3] years;
   (b) If Associate voluntarily resigns (other than for cause under Section 6.3) or is terminated for cause under Section 6.1, the cost of tail coverage shall be borne by [TAIL COVERAGE RESPONSIBILITY: "Associate" / "Practice" / "shared equally"];
   (c) The tail coverage period shall be a minimum of [TAIL COVERAGE PERIOD] years with limits no less than those maintained during the term of employment.

8.4 CERTIFICATE OF INSURANCE. Practice shall provide Associate with a certificate of insurance upon request and shall notify Associate of any material changes to coverage within [INSURANCE NOTICE PERIOD, e.g., 10] business days.

[ANNOTATION: Tail coverage is a MAJOR financial issue that associates often overlook until it is too late. Claims-made policies only cover claims that are both made and reported during the active policy period. When the associate leaves, they are exposed to claims from patients treated during employment that are filed after departure. Tail coverage closes that gap. It can cost 1.5x to 2.5x the annual premium. Deciding who pays for tail coverage BEFORE there is a dispute is far cheaper than litigating it afterward. Best practice: the practice pays for tail coverage in all scenarios -- it is a cost of doing business and prevents the departing associate from going uninsured (which creates liability exposure for the practice as well).]

-----------------------------------------------------------------------
ARTICLE 9 -- CONFIDENTIALITY
-----------------------------------------------------------------------

9.1 CONFIDENTIAL INFORMATION. Associate acknowledges that during employment, Associate will have access to and become familiar with Confidential Information of Practice. "Confidential Information" includes but is not limited to: patient lists and contact information, fee schedules and pricing strategies, financial records and revenue data, marketing strategies and patient acquisition costs, vendor contracts and supplier terms, clinical protocols and proprietary treatment systems, employee compensation information, business plans and expansion strategies, and any other information that derives economic value from not being generally known.

9.2 NON-DISCLOSURE. Associate shall not, during or after the term of this Agreement, disclose, publish, or use for any purpose other than the performance of duties hereunder any Confidential Information of Practice, except: (a) as required by law, regulation, or court order; (b) as necessary for the performance of Associate's duties; or (c) with the prior written consent of Practice.

9.3 HIPAA AND PATIENT PRIVACY. Associate shall comply with all requirements of the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), as amended, the HITECH Act, and all applicable state privacy laws regarding the use and disclosure of protected health information ("PHI"). Associate shall execute Practice's Business Associate Agreement and any other privacy-related documents required by Practice. Breach of patient privacy obligations shall constitute grounds for immediate termination under Section 6.1.

9.4 SURVIVAL. The obligations of this Article 9 shall survive the termination of this Agreement indefinitely.

[ANNOTATION: The confidentiality clause does double duty: it protects trade secrets under the Uniform Trade Secrets Act (or your state equivalent) and reinforces HIPAA obligations. The "indefinitely" survival period is enforceable for trade secrets but may be limited by courts for general business information. Include HIPAA specifically because a breach of patient privacy can result in fines of up to $1.9 million per violation category per year under current HHS enforcement guidelines.]

-----------------------------------------------------------------------
ARTICLE 10 -- BENEFITS
-----------------------------------------------------------------------

10.1 PAID TIME OFF. Associate shall be entitled to [PTO DAYS, e.g., 10] days of paid time off ("PTO") per year, accruing at a rate of [PTO ACCRUAL RATE, e.g., 0.83] days per month. PTO must be scheduled at least [PTO NOTICE, e.g., 30] days in advance and approved by Practice. Unused PTO [PTO ROLLOVER: "shall roll over up to a maximum of [MAX ROLLOVER] days" / "shall not roll over and will be forfeited at the end of each calendar year" / "shall be paid out at Associate's daily rate"].

10.2 CONTINUING EDUCATION. Practice shall provide a continuing education ("CE") allowance of $[CE ALLOWANCE, e.g., 2,500] per year for approved continuing education seminars, courses, and materials. Associate shall be responsible for maintaining all CE credits required by [STATE] for license renewal. Practice shall additionally provide [CE DAYS, e.g., 3] paid CE days per year, separate from PTO.

10.3 HEALTH INSURANCE. [SELECT ONE: "Practice shall offer Associate the opportunity to participate in Practice's group health insurance plan, with Practice contributing [HEALTH INSURANCE CONTRIBUTION, e.g., 50]% of the premium for individual coverage." / "Practice does not offer group health insurance. Associate shall be responsible for obtaining their own health insurance coverage."]

10.4 RETIREMENT. [SELECT ONE: "Practice offers a [RETIREMENT PLAN TYPE, e.g., SIMPLE IRA / 401(k)] with an employer match of [MATCH PERCENTAGE, e.g., 3]% of compensation." / "Practice does not currently offer a retirement plan."]

10.5 LICENSURE AND DUES. Practice shall reimburse Associate for the cost of: (a) [STATE] chiropractic license renewal, (b) DEA registration (if applicable), and (c) membership dues for [PROFESSIONAL ORGANIZATIONS, e.g., state chiropractic association, ACA/ICA].

10.6 SEMINAR AND CONFERENCE ATTENDANCE. Associate [SELECT ONE: "shall be required" / "is encouraged"] to attend the following Practice-designated seminars and conferences: [LIST SPECIFIC EVENTS/COACHING PROGRAMS, e.g., Practice management coaching program meetings, annual chiropractic technique seminar]. Practice shall cover registration fees and reasonable travel expenses for required events.

[ANNOTATION: Benefits are where you differentiate your offer from every other practice posting on a job board. The CE allowance signals that you invest in your doctors. Requiring specific seminars (Section 10.6) ensures clinical consistency -- if your practice follows a specific technique or coaching program, contractually requiring attendance prevents the associate from skipping events that align the whole team. A common mistake is failing to address whether PTO is paid out on termination. Many states (e.g., California, Illinois, Montana) require payout of accrued PTO regardless of what the contract says. Check your state law.]

-----------------------------------------------------------------------
ARTICLE 11 -- PROFESSIONAL DEVELOPMENT AND EQUITY PATHWAY
-----------------------------------------------------------------------

11.1 CONTINUING EDUCATION REQUIREMENTS. Associate shall complete all continuing education hours required by the [STATE] Board of Chiropractic Examiners for license renewal. Practice may require additional CE in specific topics relevant to Practice's clinical model, including but not limited to: [REQUIRED CE TOPICS, e.g., specific adjusting techniques, pediatric chiropractic, personal injury documentation, advanced imaging interpretation].

11.2 MENTORSHIP. During the first [MENTORSHIP PERIOD, e.g., 6] months, Clinical Director shall provide structured mentorship including observation of patient encounters, case review sessions, and feedback on clinical technique and patient communication.

11.3 EQUITY/PARTNERSHIP PATHWAY (OPTIONAL).

[NOTE: Include this section only if the Practice intends to offer an equity or partnership pathway. Delete if not applicable.]

   (a) Eligibility. After [PARTNERSHIP ELIGIBILITY PERIOD, e.g., 3] years of continuous employment in good standing, Associate may become eligible for discussion of an equity interest or partnership position in Practice, subject to Practice's sole discretion.

   (b) Terms of Equity Offer. If Practice elects to offer an equity interest, the terms shall be set forth in a separate Partnership or Operating Agreement and shall address, at minimum: (i) purchase price and valuation methodology; (ii) percentage of ownership offered; (iii) buy-in payment structure (lump sum, installment, or production-based earn-in); (iv) governance rights and decision-making authority; (v) profit distribution; (vi) buy-sell provisions; (vii) non-compete obligations as an owner; and (viii) disability and death provisions.

   (c) No Guarantee. Nothing in this Section 11.3 creates a binding obligation on Practice to offer equity or partnership, nor does it create any expectation of equity or partnership. This Section merely acknowledges that equity/partnership is a possibility that the Parties may explore in good faith.

[ANNOTATION: The partnership pathway is a retention tool. Top associates stay when they see a future. But be extremely careful: this language is intentionally non-binding. A poorly drafted equity provision that creates even an implied promise of partnership can become a breach of contract claim if you decide not to offer equity. The phrase "subject to Practice's sole discretion" and the explicit "no guarantee" clause are essential. When the time comes to actually offer equity, engage a healthcare attorney to draft the partnership or operating agreement -- do not try to include those complex terms in this employment agreement.]

-----------------------------------------------------------------------
ARTICLE 12 -- DISPUTE RESOLUTION
-----------------------------------------------------------------------

12.1 INFORMAL RESOLUTION. The Parties shall attempt to resolve any dispute arising under this Agreement through good-faith negotiation. Either Party may initiate the informal resolution process by providing written notice describing the dispute. The Parties shall meet (in person or via videoconference) within [INFORMAL RESOLUTION PERIOD, e.g., 14] days of such notice to attempt resolution.

12.2 MEDIATION. If informal negotiation fails to resolve the dispute within [MEDIATION TRIGGER PERIOD, e.g., 30] days, either Party may initiate mediation by filing a request with [MEDIATION PROVIDER, e.g., the American Arbitration Association ("AAA")] or another mutually agreed-upon mediation service. Mediation costs shall be shared equally. Each Party shall participate in at least one mediation session in good faith before proceeding to arbitration.

12.3 BINDING ARBITRATION. If mediation does not resolve the dispute, any remaining controversy or claim arising out of or relating to this Agreement, including the breach, termination, or validity thereof, shall be settled by binding arbitration administered by the American Arbitration Association ("AAA") under its Employment Arbitration Rules then in effect. The arbitration shall take place in [ARBITRATION LOCATION, e.g., [CITY], [STATE]]. The arbitrator's decision shall be final, binding, and enforceable in any court of competent jurisdiction.

12.4 EXCEPTIONS. Notwithstanding the foregoing, either Party may seek temporary or preliminary injunctive relief in a court of competent jurisdiction to enforce the provisions of Articles 5, 7, or 9 without first complying with the mediation or arbitration requirements of this Article 12.

12.5 ATTORNEYS' FEES. The prevailing Party in any arbitration or court proceeding arising out of this Agreement shall be entitled to recover reasonable attorneys' fees and costs from the non-prevailing Party.

[ANNOTATION: Arbitration is typically faster, more private, and less expensive than litigation. The AAA Employment Arbitration Rules provide a well-established framework. The injunctive relief exception in 12.4 is critical: if an associate violates a non-compete, you cannot wait 6 months for arbitration -- you need a court order immediately. The attorneys' fees provision discourages frivolous claims by both parties. Note: some states have restrictions on mandatory arbitration in employment agreements. California has made pre-dispute mandatory arbitration agreements largely unenforceable for employees under AB 51 (though this is being litigated). Check your state's current law.]

-----------------------------------------------------------------------
ARTICLE 13 -- GENERAL PROVISIONS
-----------------------------------------------------------------------

13.1 ENTIRE AGREEMENT. This Agreement, together with all exhibits and addenda attached hereto, constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, representations, and understandings, whether written or oral.

13.2 AMENDMENTS. This Agreement may be amended only by a written instrument signed by both Parties.

13.3 SEVERABILITY. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.

13.4 GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of [STATE], without regard to its conflict-of-laws principles.

13.5 NOTICES. All notices required or permitted under this Agreement shall be in writing and shall be deemed delivered: (a) when delivered personally; (b) one (1) business day after deposit with a nationally recognized overnight courier; or (c) three (3) business days after mailing by certified mail, return receipt requested, to the addresses set forth in the preamble or such other address as a Party may designate in writing.

13.6 WAIVER. The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of that Party's right to enforce that provision or any other provision in the future.

13.7 ASSIGNMENT. Associate may not assign this Agreement or any rights hereunder without Practice's prior written consent. Practice may assign this Agreement in connection with a merger, acquisition, or sale of substantially all of Practice's assets, provided that the assignee assumes all of Practice's obligations hereunder.

13.8 COUNTERPARTS. This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed original signatures for all purposes.

13.9 HEADINGS. The headings in this Agreement are for convenience only and shall not affect its interpretation.

13.10 INDEPENDENT LEGAL ADVICE. Each Party acknowledges that they have had the opportunity to seek independent legal counsel regarding this Agreement and have either obtained such counsel or voluntarily chosen not to do so.

[ANNOTATION: Section 13.10 is one of the most important clauses in the entire agreement. Without it, an associate may later claim they did not understand what they signed and seek to void the contract. Always encourage your associate to have an attorney review the agreement -- it makes the contract stronger, not weaker, when both parties have had independent counsel. The assignment clause (13.7) is critical for practice owners planning a future sale. Without it, the new owner may not be able to enforce the non-compete or other restrictive covenants against existing associates.]

-----------------------------------------------------------------------
SIGNATURES
-----------------------------------------------------------------------

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

PRACTICE:
[PRACTICE NAME]

By: ___________________________________
Name: [OWNER/AUTHORIZED SIGNER NAME]
Title: [TITLE]
Date: _________________________________

ASSOCIATE:
___________________________________
[ASSOCIATE NAME], D.C.
Date: _________________________________

WITNESS (Optional, depending on state requirements):
___________________________________
Name: _________________________________
Date: _________________________________`;

// ---------------------------------------------------------------------------
// Template 2 -- Independent Contractor Agreement
// ---------------------------------------------------------------------------

const independentContractorContent = `INDEPENDENT CONTRACTOR AGREEMENT FOR CHIROPRACTIC AND ALLIED HEALTH SERVICES

THIS INDEPENDENT CONTRACTOR AGREEMENT (the "Agreement") is entered into as of [EFFECTIVE DATE], by and between:

PRACTICE:
[PRACTICE NAME], a [STATE] [ENTITY TYPE] with its principal place of business at [PRACTICE ADDRESS] (hereinafter "Practice");

AND

CONTRACTOR:
[CONTRACTOR NAME], [CREDENTIAL, e.g., D.C. / L.M.T. / L.Ac.], an individual with a principal business address at [CONTRACTOR ADDRESS] (hereinafter "Contractor").

RECITALS

WHEREAS, Practice operates a chiropractic and wellness clinic and desires to engage Contractor to provide [SERVICES TYPE, e.g., chiropractic locum tenens services / massage therapy / acupuncture] on an independent contractor basis;

WHEREAS, Contractor is an independent professional who maintains their own practice or provides services to multiple entities and desires to provide such services under the terms set forth herein;

NOW, THEREFORE, in consideration of the mutual promises and covenants contained herein, the Parties agree as follows:

[ANNOTATION: The recitals establish the independent nature of the relationship from the very first paragraph. Courts look at the "totality of the circumstances" when determining worker classification. Building the IC framework into the recitals strengthens the argument. CRITICAL WARNING: Worker misclassification carries severe penalties. The IRS can impose back employment taxes (FICA, FUTA, income tax withholding), plus penalties of up to 100% of the tax due. State agencies may impose additional penalties, and some states (e.g., California under AB 5, Massachusetts, New Jersey) have extremely aggressive enforcement. If you control WHEN, WHERE, and HOW the contractor works, they are likely an employee regardless of what this contract says.]

ARTICLE 1 -- INDEPENDENT CONTRACTOR STATUS

1.1 RELATIONSHIP. Contractor is an independent contractor and NOT an employee, partner, agent, or joint venturer of Practice. Nothing in this Agreement creates an employer-employee relationship.

1.2 CONTROL AND INDEPENDENCE. The Parties acknowledge and agree that Contractor shall maintain independent contractor status as evidenced by the following:

   (a) METHOD AND MANNER. Contractor shall determine the method, manner, and means of performing services, including but not limited to: clinical techniques used, treatment protocols applied, and therapeutic approaches employed, subject only to applicable standards of care and licensing requirements.

   (b) SCHEDULE. Contractor shall set their own schedule of availability, subject to mutually agreed-upon dates and times. Practice shall not require Contractor to work specific hours or a minimum number of hours. Contractor is free to accept or decline any assignment or shift.

   (c) TOOLS AND EQUIPMENT. Contractor [SELECT ONE: "shall provide their own instruments, tools, and equipment necessary for the performance of services" / "may use Practice's equipment and facilities as a matter of convenience, which shall not alter Contractor's independent contractor status"]. Contractor shall maintain their own professional supplies as appropriate for their discipline.

   (d) EXCLUSIVITY. Contractor is expressly permitted to provide services to other practices, clinics, or clients during the term of this Agreement. Contractor is not required to work exclusively for Practice.

   (e) BUSINESS EXPENSES. Contractor is responsible for their own business expenses, including but not limited to: professional licensing fees, continuing education, professional liability insurance, equipment, transportation, and income taxes.

   (f) HIRING AUTHORITY. Contractor may hire assistants or subcontractors at Contractor's own expense, subject to Practice's reasonable approval for purposes of patient safety and facility access.

[ANNOTATION: This is the heart of the IC agreement. The IRS uses a multi-factor test that examines behavioral control, financial control, and the type of relationship. Every single provision in Section 1.2 maps to a specific IRS factor. The more of these factors that weigh in favor of IC status, the stronger your classification. KEY DANGER ZONES: If you require the contractor to attend staff meetings, follow your office protocols for treatment frequency, use your specific charting templates, or set their schedule unilaterally, you are creating employee-level control. Any ONE of those could tip the balance toward employment. The most common mistake in chiropractic: requiring the IC to follow the practice's care plan protocols and ROF scripts. That level of clinical control strongly suggests employment.]

1.3 TAX OBLIGATIONS. Contractor is solely responsible for all federal, state, and local taxes arising from compensation received under this Agreement, including self-employment taxes. Practice shall issue an IRS Form 1099-NEC to Contractor for compensation of $600 or more in any calendar year. Practice shall NOT withhold federal or state income taxes, Social Security, or Medicare taxes from payments to Contractor.

1.4 BENEFITS EXCLUSION. Contractor shall NOT be entitled to any employee benefits, including but not limited to: health insurance, retirement plans, paid time off, workers' compensation insurance, unemployment insurance, or any other benefit provided to Practice employees.

ARTICLE 2 -- SERVICES AND COMPENSATION

2.1 SCOPE OF SERVICES. Contractor shall provide [DESCRIPTION OF SERVICES, e.g., chiropractic adjustments, spinal screenings, patient consultations / therapeutic massage / acupuncture treatments] at Practice's facility located at [SERVICE LOCATION].

2.2 COMPENSATION. Contractor shall be compensated as follows:
[SELECT ONE:]
   (a) FLAT RATE: $[RATE] per [PERIOD: hour / half-day / full day / patient visit]; OR
   (b) PERCENTAGE: [PERCENTAGE]% of collections attributable to Contractor's personal services; OR
   (c) PER-PATIENT: $[PER PATIENT RATE] per patient encounter.

2.3 INVOICING AND PAYMENT. Contractor shall submit invoices to Practice on a [INVOICE FREQUENCY, e.g., weekly / bi-weekly / monthly] basis. Practice shall pay undisputed invoices within [PAYMENT TERMS, e.g., 15] business days of receipt.

2.4 NO GUARANTEED MINIMUM. Practice does not guarantee any minimum number of patients, hours, or level of compensation to Contractor.

[ANNOTATION: The invoicing requirement reinforces IC status. Employees receive paychecks; contractors submit invoices. Similarly, offering no guaranteed minimum demonstrates that Contractor bears economic risk -- a key IRS factor. If you pay a guaranteed daily rate regardless of patient volume, that looks more like a salary. The percentage-of-collections model is the safest for IC classification because it most clearly places economic risk on the contractor.]

ARTICLE 3 -- INSURANCE AND LICENSING

3.1 PROFESSIONAL LIABILITY. Contractor shall maintain, at Contractor's sole expense, professional liability (malpractice) insurance with minimum limits of $[COVERAGE AMOUNT, e.g., 1,000,000] per occurrence and $[AGGREGATE, e.g., 3,000,000] aggregate. Contractor shall provide Practice with a certificate of insurance prior to commencing services and upon each renewal.

3.2 GENERAL LIABILITY. Contractor shall maintain general liability insurance with minimum limits of $[GL AMOUNT, e.g., 1,000,000] per occurrence.

3.3 LICENSING. Contractor shall maintain all licenses, certifications, and registrations required by [STATE] law for the services provided hereunder. Contractor shall immediately notify Practice if any license is suspended, revoked, or restricted.

ARTICLE 4 -- TERM AND TERMINATION

4.1 TERM. This Agreement shall commence on [START DATE] and continue until [END DATE / "terminated by either Party"].

4.2 TERMINATION. Either Party may terminate this Agreement upon [NOTICE PERIOD, e.g., 14] days' written notice for any reason or no reason.

4.3 IMMEDIATE TERMINATION. Practice may terminate this Agreement immediately if Contractor: (a) loses any required license or certification; (b) fails to maintain required insurance; (c) engages in conduct that endangers patient safety; or (d) violates applicable law.

ARTICLE 5 -- CONFIDENTIALITY AND HIPAA

5.1 CONFIDENTIALITY. Contractor shall maintain the confidentiality of all Practice business information, patient information, and proprietary materials.

5.2 HIPAA COMPLIANCE. Contractor shall comply with HIPAA and all applicable privacy laws. Contractor shall execute Practice's Business Associate Agreement prior to accessing any protected health information.

5.3 PATIENT RECORDS. All patient records created by Contractor during the performance of services shall be the property of Practice.

ARTICLE 6 -- NON-SOLICITATION

6.1 PATIENT NON-SOLICITATION. During the term of this Agreement and for [NON-SOLICITATION PERIOD, e.g., 1] year following termination, Contractor shall not directly solicit patients of Practice to receive services at any other location.

6.2 EMPLOYEE NON-SOLICITATION. During the term and for [EMPLOYEE NON-SOLICITATION PERIOD, e.g., 1] year following termination, Contractor shall not solicit or recruit any employee or contractor of Practice.

[ANNOTATION: Non-solicitation provisions are generally more enforceable against independent contractors than non-compete clauses. A geographic non-compete imposed on an independent contractor strongly undermines the IC classification because it restricts the contractor's ability to work for others -- which contradicts the independence you are claiming. If you absolutely need geographic protection, keep the radius very small and the duration very short. Better yet, rely on patient non-solicitation only.]

ARTICLE 7 -- INDEMNIFICATION

7.1 MUTUAL INDEMNIFICATION. Each Party shall indemnify, defend, and hold harmless the other Party from and against any claims, damages, losses, and expenses arising from: (a) the indemnifying Party's negligence or willful misconduct; (b) the indemnifying Party's breach of this Agreement; or (c) the indemnifying Party's violation of applicable law.

7.2 RECLASSIFICATION INDEMNIFICATION. In the event that any governmental agency reclassifies Contractor as an employee of Practice, Contractor shall cooperate with Practice in any appeal of such determination. [NOTE: This provision does not shift tax liability but ensures cooperation.]

ARTICLE 8 -- GENERAL PROVISIONS

8.1 ENTIRE AGREEMENT. This Agreement constitutes the entire agreement between the Parties regarding its subject matter.

8.2 AMENDMENTS. Amendments must be in writing and signed by both Parties.

8.3 GOVERNING LAW. This Agreement shall be governed by the laws of the State of [STATE].

8.4 SEVERABILITY. If any provision is held unenforceable, the remainder shall continue in full force.

8.5 INDEPENDENT LEGAL ADVICE. Both Parties have had the opportunity to seek independent legal counsel.

SIGNATURES

PRACTICE:
[PRACTICE NAME]
By: ___________________________________
Name: [AUTHORIZED SIGNER]
Title: [TITLE]
Date: _________________________________

CONTRACTOR:
___________________________________
[CONTRACTOR NAME], [CREDENTIAL]
Date: _________________________________`;

// ---------------------------------------------------------------------------
// Template 3 -- Non-Compete / Non-Solicitation Agreement
// ---------------------------------------------------------------------------

const nonCompeteContent = `STANDALONE NON-COMPETITION AND NON-SOLICITATION AGREEMENT

THIS NON-COMPETITION AND NON-SOLICITATION AGREEMENT (the "Agreement") is entered into as of [EFFECTIVE DATE], by and between:

[PRACTICE NAME], a [STATE] [ENTITY TYPE] with its principal place of business at [PRACTICE ADDRESS] (hereinafter "Practice");

AND

[DOCTOR/EMPLOYEE NAME], [CREDENTIAL, e.g., D.C.] (hereinafter "Restricted Party").

RECITALS

WHEREAS, Restricted Party is or will be [employed by / contracted with / a partner in] Practice;

WHEREAS, in the course of such relationship, Restricted Party will have access to Practice's confidential business information, proprietary clinical protocols, patient relationships, and other trade secrets;

WHEREAS, Practice has a legitimate business interest in protecting its patient relationships, confidential information, and investment in employee training and development;

WHEREAS, as a condition of [commencement of employment / continued employment / receipt of additional compensation in the amount of $[CONSIDERATION AMOUNT] / admission to partnership discussions], Restricted Party agrees to the restrictions set forth herein;

NOW, THEREFORE, in consideration of the promises herein and other good and valuable consideration, the Parties agree as follows:

[ANNOTATION: CONSIDERATION IS EVERYTHING. The single most common reason non-competes are struck down is lack of adequate consideration. If you are asking an existing employee to sign a non-compete after they have already started working, "continued employment" may not be sufficient consideration in many states (e.g., Illinois requires at least 2 years of subsequent employment; Texas requires the non-compete to be ancillary to an otherwise enforceable agreement). The safest approach: provide additional monetary consideration -- a signing bonus, a raise, or access to specialized training. Specify the exact amount. Courts are much more likely to enforce a non-compete where the restricted party received $5,000 in signing consideration versus a vague reference to "continued employment."]

ARTICLE 1 -- NON-COMPETITION

1.1 RESTRICTION. During the term of Restricted Party's relationship with Practice and for a period of [NON-COMPETE DURATION, e.g., 1 / 2] year(s) following the termination of such relationship for any reason (the "Restricted Period"), Restricted Party shall not, directly or indirectly:

   (a) Own, manage, operate, control, be employed by, consult with, or participate in any chiropractic practice, clinic, or healthcare facility that provides chiropractic services within a [RADIUS, e.g., 15]-mile radius of [MEASUREMENT POINT: "Practice's location at [ADDRESS]" / "any Practice location operating as of the date of termination"] (the "Restricted Area");

   (b) Establish, open, or participate in the establishment of a new chiropractic practice within the Restricted Area;

   (c) Provide chiropractic services as a mobile practitioner, telehealth provider, or through house calls to patients residing within the Restricted Area, even if the practitioner's office is located outside the Restricted Area.

1.2 SCOPE LIMITATION. The restrictions in Section 1.1 apply only to the practice of chiropractic and related healthcare services. They do not restrict Restricted Party from: (a) owning passive investments (less than 5% equity interest) in publicly traded companies that may compete with Practice; (b) practicing chiropractic outside the Restricted Area; or (c) engaging in non-chiropractic employment within the Restricted Area.

[ANNOTATION: Section 1.1(c) closes a loophole that many non-competes miss. Without it, a departing associate can set up an office 16 miles away but drive into the restricted area to treat patients at their homes, gyms, or corporate offices. The scope limitation in 1.2 is equally important -- an overly broad restriction that prevents someone from earning a living in ANY capacity is almost certainly unenforceable.]

ARTICLE 2 -- NON-SOLICITATION OF PATIENTS

2.1 RESTRICTION. During the Restricted Period, Restricted Party shall not, directly or indirectly:

   (a) Solicit, contact, communicate with, or attempt to induce any Protected Patient (as defined below) to discontinue, reduce, or divert their patronage from Practice;

   (b) Accept as a patient any Protected Patient who contacts Restricted Party as a result of Restricted Party's direct or indirect solicitation;

   (c) Use any patient list, contact information, or treatment records obtained from Practice to identify or contact patients.

2.2 DEFINITION OF PROTECTED PATIENT. "Protected Patient" means any individual who: (a) was a patient of Practice at any time during the [LOOKBACK PERIOD, e.g., 24] months preceding Restricted Party's termination; AND (b) was treated by or had a clinical relationship with Restricted Party during such period.

2.3 UNSOLICITED PATIENTS. Nothing in this Article 2 prevents Restricted Party from treating a former Practice patient who independently seeks treatment from Restricted Party without any solicitation, provided that Restricted Party has not directly or indirectly encouraged such contact. Restricted Party bears the burden of demonstrating that the patient was unsolicited.

[ANNOTATION: The "unsolicited patient" exception is critical for enforceability. Courts in most states recognize a patient's fundamental right to choose their own healthcare provider. A blanket prohibition on treating any former patient -- even one who shows up unannounced at the new practice -- is likely to be struck down as against public policy. By including this exception and placing the burden of proof on the restricted party, you protect both enforceability and patient autonomy.]

ARTICLE 3 -- NON-SOLICITATION OF EMPLOYEES AND CONTRACTORS

3.1 RESTRICTION. During the Restricted Period, Restricted Party shall not, directly or indirectly, recruit, solicit, induce, or attempt to induce any employee, independent contractor, or agent of Practice to leave Practice's employ or engagement.

3.2 GENERAL ADVERTISING EXCEPTION. A general job advertisement or posting (e.g., on a job board, newspaper, or social media) that is not specifically targeted at Practice employees shall not constitute a violation of this Article 3.

ARTICLE 4 -- NON-SOLICITATION OF REFERRAL SOURCES

4.1 RESTRICTION. During the Restricted Period, Restricted Party shall not solicit or interfere with Practice's relationships with its professional referral sources, including but not limited to physicians, attorneys, therapists, and other healthcare providers who have referred patients to Practice within the [REFERRAL LOOKBACK, e.g., 24] months preceding termination.

ARTICLE 5 -- CONSIDERATION

5.1 The Restricted Party acknowledges receipt of the following consideration for entering into this Agreement:
   [SELECT ALL APPLICABLE:]
   (a) Initial employment and the compensation and benefits associated therewith;
   (b) Continued employment and the compensation and benefits associated therewith;
   (c) A one-time payment of $[CONSIDERATION AMOUNT] payable within [PAYMENT TIMING] of execution of this Agreement;
   (d) Access to Practice's specialized training program valued at $[TRAINING VALUE];
   (e) Eligibility for partnership or equity discussions as described in [REFERENCE TO EMPLOYMENT AGREEMENT];
   (f) Other: [DESCRIBE].

5.2 Restricted Party acknowledges that the above consideration is adequate and that the restrictions herein are reasonable and necessary to protect Practice's legitimate business interests.

ARTICLE 6 -- REMEDIES

6.1 INJUNCTIVE RELIEF. Restricted Party acknowledges that a breach of this Agreement would cause irreparable harm to Practice for which monetary damages alone would be an inadequate remedy. Practice shall be entitled to temporary, preliminary, and permanent injunctive relief, without the requirement of posting a bond (to the extent permitted by law).

6.2 TOLLING. The Restricted Period shall be tolled during any period in which Restricted Party is in violation of this Agreement.

6.3 LIQUIDATED DAMAGES. In addition to injunctive relief, upon a breach of any provision of this Agreement, Restricted Party shall pay Practice liquidated damages in the amount of $[LIQUIDATED DAMAGES AMOUNT, e.g., 25,000 - 100,000]. The Parties agree this amount is a reasonable estimate of damages and is not a penalty.

[ANNOTATION: Liquidated damages give you a concrete financial remedy. Without them, proving actual damages from a non-compete breach is expensive and difficult -- how do you prove exactly how much revenue you lost because the associate opened down the street? The amount must be a reasonable pre-estimate of harm, not a punishment. Set it too high and a court will void it as a penalty. For a typical chiropractic practice, $25,000-$100,000 is a defensible range depending on practice size, patient base, and geographic market.]

6.4 ATTORNEYS' FEES. The prevailing Party in any action to enforce this Agreement shall be entitled to recover reasonable attorneys' fees and costs.

6.5 CUMULATIVE REMEDIES. All remedies under this Agreement are cumulative and not exclusive.

ARTICLE 7 -- STATE-SPECIFIC ENFORCEABILITY NOTES

[ANNOTATION: THIS IS THE MOST CRITICAL SECTION FOR YOUR REVIEW. Non-compete enforceability varies dramatically by state. Below is a summary for frequently asked states. THIS IS NOT LEGAL ADVICE FOR YOUR SPECIFIC SITUATION -- consult a licensed attorney in your state.

CALIFORNIA: Non-compete covenants are VOID under Business & Professions Code Section 16600. Do not include Article 1 (non-competition) for California-based practices. Patient non-solicitation and confidentiality provisions remain enforceable. As of January 1, 2024, California employers cannot even require employees to sign non-competes, and penalties for attempting to enforce them have increased.

TEXAS: Enforceable if: (1) ancillary to an otherwise enforceable agreement; (2) reasonable in time, geographic area, and scope; and (3) supported by consideration (including access to confidential information or specialized training). The Texas Business & Commerce Code allows courts to reform overbroad restrictions. Recommended: 2-year maximum duration, 10-25 mile radius.

FLORIDA: Generally pro-enforcement under Fla. Stat. 542.335. Presumptively reasonable: 6 months to 2 years duration. Courts will blue-pencil overbroad restrictions. Florida does NOT allow consideration of hardship to the restricted party in determining enforceability. One of the strongest states for enforcement.

NEW YORK: Enforceable if reasonable and necessary to protect legitimate business interests. Courts apply a strict three-part test: (1) necessary to protect employer's legitimate interests; (2) not impose undue hardship on employee; (3) not harmful to the public. New York courts are increasingly skeptical of non-competes and tend to narrow their scope. Proposed legislation to ban non-competes has been introduced repeatedly.

ILLINOIS: The Illinois Freedom to Work Act (effective January 1, 2022) prohibits non-competes for employees earning less than $75,000/year (threshold increases over time). For eligible employees, requires "adequate consideration" -- at least 2 years of continued employment or other consideration. Courts will blue-pencil.

GEORGIA: Enforceable under the Restrictive Covenants Act (O.C.G.A. 13-8-50 et seq.) if reasonable. Courts may modify overbroad restrictions. Maximum reasonable duration is generally 2 years. Geographic restrictions must be clearly defined.

OHIO: Enforceable if reasonable. Courts apply a totality-of-the-circumstances test. Continued employment alone may constitute consideration. Courts may blue-pencil. 1-2 year duration and 15-25 mile radius are typical.

PENNSYLVANIA: Enforceable if: (1) necessary to protect employer's legitimate interests; (2) supported by adequate consideration; (3) reasonably limited in duration and geography. New consideration required for existing at-will employees. Courts may modify overbroad restrictions.]

ARTICLE 8 -- GENERAL PROVISIONS

8.1 JUDICIAL MODIFICATION. If any restriction in this Agreement is found overbroad or unenforceable, the Parties authorize the court to modify it to the minimum extent necessary for enforceability.

8.2 GOVERNING LAW. This Agreement shall be governed by the laws of the State of [STATE].

8.3 SEVERABILITY. Unenforceability of any provision shall not affect the remaining provisions.

8.4 ENTIRE AGREEMENT. This Agreement constitutes the entire agreement regarding its subject matter and may be amended only in writing.

8.5 INDEPENDENT COUNSEL. Both Parties acknowledge the opportunity to seek independent legal advice before signing.

SIGNATURES

[PRACTICE NAME]
By: ___________________________________
Name: [AUTHORIZED SIGNER]
Title: [TITLE]
Date: _________________________________

RESTRICTED PARTY:
___________________________________
[NAME], [CREDENTIAL]
Date: _________________________________

WITNESS:
___________________________________
Name: _________________________________
Date: _________________________________`;

// ---------------------------------------------------------------------------
// Template 4 -- Associate Compensation Addendum
// ---------------------------------------------------------------------------

const compensationAddendumContent = `ASSOCIATE COMPENSATION ADDENDUM

THIS COMPENSATION ADDENDUM (the "Addendum") is entered into as of [EFFECTIVE DATE] and is incorporated into and made a part of the Employment Agreement dated [ORIGINAL AGREEMENT DATE] (the "Employment Agreement") between [PRACTICE NAME] ("Practice") and [ASSOCIATE NAME], D.C. ("Associate").

In the event of any conflict between this Addendum and the Employment Agreement, the terms of this Addendum shall control with respect to compensation matters.

-----------------------------------------------------------------------
SECTION 1 -- COMPENSATION MODEL
-----------------------------------------------------------------------

SELECT ONE MODEL BELOW. DELETE THE ALTERNATIVES NOT SELECTED.

==== MODEL A: PERCENTAGE OF PERSONAL COLLECTIONS WITH FLOOR ====

A.1 BASE COMPENSATION. Associate shall receive [PERCENTAGE, e.g., 30]% of Net Personal Collections (defined below) per month.

A.2 GUARANTEED FLOOR. For the first [FLOOR DURATION, e.g., 6] months of employment (the "Ramp-Up Period"), Associate shall receive a guaranteed monthly minimum of $5,000 (the "Floor"). If percentage-based compensation exceeds the Floor in any month, Associate receives the higher amount. The Floor expires at the end of the Ramp-Up Period.

A.3 DEFINITION OF NET PERSONAL COLLECTIONS. "Net Personal Collections" means the total dollar amount actually received by Practice for professional chiropractic services personally rendered by Associate during the applicable period, as determined by the treating provider field in Practice's EHR system, less:
   (a) Patient refunds;
   (b) Insurance contractual adjustments;
   (c) Write-offs approved under Practice's standard collection policy (not to exceed [MAX WRITE-OFF PERCENTAGE, e.g., 5]% of gross charges without Associate's written consent).

Net Personal Collections expressly EXCLUDE:
   (i) Revenue from supplements, orthotics, or retail product sales (unless separately agreed);
   (ii) Revenue from ancillary services (massage, physical therapy modalities) performed by non-doctor staff;
   (iii) Revenue from X-rays or imaging read by another provider;
   (iv) Revenue from patients Associate did not personally examine or adjust.

A.4 EXAMPLE CALCULATION.
   - Gross charges billed for Associate's services in March: $42,000
   - Insurance contractual adjustments: ($8,400)
   - Refunds: ($200)
   - Approved write-offs: ($1,400)
   - Net Personal Collections: $32,000
   - Associate's compensation: 30% x $32,000 = $9,600

A.5 COLLECTION TIMING. Because insurance payments arrive on a delayed basis, monthly compensation reflects collections received during the calendar month, regardless of when the service was rendered. A true-up reconciliation shall be performed [RECONCILIATION FREQUENCY, e.g., quarterly] to ensure accurate attribution.

[ANNOTATION: Model A is the industry standard and the best alignment of incentives. The floor protects the associate during ramp-up when patient volume is building. The exclusions list is critical -- without it, disputes arise over whether the associate deserves a cut of supplement sales they recommended or X-rays they ordered but a tech performed. Define it once, avoid arguments forever. The true-up provision handles the reality of insurance billing: a service rendered in March may not be paid until May. Without periodic reconciliation, the associate is systematically underpaid in early months and overpaid in later months.]

==== MODEL B: BASE SALARY PLUS PRODUCTION BONUS ====

B.1 BASE SALARY. Associate shall receive a base salary of $7,000 per month ($84,000 annualized).

B.2 PRODUCTION BONUS. If Associate's Net Personal Collections (as defined in Model A, Section A.3, incorporated by reference) exceed $25,000 in any calendar month, Associate shall receive an additional bonus equal to 10% of all Net Personal Collections above $25,000.

B.3 EXAMPLE CALCULATION.
   - Net Personal Collections in March: $32,000
   - Amount above threshold: $32,000 - $25,000 = $7,000
   - Bonus: 10% x $7,000 = $700
   - Total compensation: $7,000 (base) + $700 (bonus) = $7,700

B.4 QUARTERLY PERFORMANCE BONUS. Associate may earn an additional $[QUARTERLY BONUS, e.g., 1,500] per quarter if all of the following targets are met:
   (a) Average weekly patient visits of [PVA TARGET, e.g., 90] or more;
   (b) Report of Findings conversion rate of [ROF TARGET, e.g., 75]% or higher;
   (c) All SOAP notes completed within [DOCUMENTATION DEADLINE, e.g., 24] hours of encounter;
   (d) Attendance at all required team meetings and [EVENTS TARGET, e.g., 4] community events.

[ANNOTATION: Model B suits associates who value predictability. The $25,000 threshold should be set at roughly 65-70% of expected monthly collections so the associate has a realistic path to earning bonuses from day one. If you set the threshold too high, the bonus becomes unattainable and demotivating. The quarterly bonus tied to clinical KPIs ensures engagement beyond just volume. For the practice owner, the base salary is a fixed cost that must be covered regardless of collections, so budget carefully.]

==== MODEL C: FLAT SALARY WITH REVIEW ====

C.1 SALARY. Associate shall receive a flat salary of $8,500 per month ($102,000 annualized).

C.2 SALARY REVIEW. Practice shall conduct a formal compensation review at the 12-month anniversary of employment. At that time, Practice and Associate shall evaluate:
   (a) Associate's trailing 6-month average Net Personal Collections;
   (b) Practice growth attributable to Associate;
   (c) Patient satisfaction metrics;
   (d) Clinical quality indicators.

Based on this review, the Parties may mutually agree to: (i) maintain the flat salary; (ii) adjust the salary amount; or (iii) transition to a percentage-based or base-plus-bonus model.

C.3 DISCRETIONARY BONUS. Practice may award discretionary bonuses for exceptional performance. Such bonuses do not create an entitlement to future bonuses.

[ANNOTATION: Model C is the simplest structure and works best for new graduates or associates transitioning from another practice who need income stability during adjustment. The 12-month review is the critical mechanism -- it forces both parties to revisit the arrangement with real data. Many practices use Model C as a "starter" compensation plan with the explicit intention of transitioning to Model A once the associate is established and both parties have data on production levels.]

-----------------------------------------------------------------------
SECTION 2 -- BONUS STRUCTURES (APPLICABLE TO ALL MODELS)
-----------------------------------------------------------------------

2.1 NEW PATIENT BONUS. Associate shall receive a bonus of $[NEW PATIENT BONUS, e.g., 25] for each new patient who: (a) completes an initial examination with Associate, (b) receives a Report of Findings, and (c) begins a care plan. New patient bonuses are payable monthly.

2.2 RETENTION BONUS. If Associate remains employed in good standing for [RETENTION PERIOD, e.g., 12] consecutive months, Associate shall receive a one-time retention bonus of $[RETENTION BONUS, e.g., 3,000].

2.3 ANNUAL PERFORMANCE BONUS. Practice may award an annual performance bonus based on Practice's overall revenue growth, patient satisfaction scores, and Associate's individual contributions. Target bonus: $[ANNUAL BONUS TARGET, e.g., 5,000]. This bonus is discretionary and not guaranteed.

-----------------------------------------------------------------------
SECTION 3 -- PAYMENT TERMS
-----------------------------------------------------------------------

3.1 PAYMENT SCHEDULE.
   - Base salary / floor payments: [PAYROLL SCHEDULE, e.g., 1st and 15th of each month]
   - Monthly production bonuses: Within [BONUS PAYMENT TIMING, e.g., 30] days following end of the applicable month
   - Quarterly bonuses: Within [QUARTERLY TIMING, e.g., 45] days following end of the applicable quarter
   - Annual bonuses: Within [ANNUAL TIMING, e.g., 60] days following end of the calendar year

3.2 WITHHOLDINGS. All compensation is subject to applicable federal, state, and local tax withholdings and deductions.

3.3 COLLECTIONS REPORTS. Practice shall provide Associate with a detailed collections report for each pay period, including: patient name, date of service, CPT codes, amount billed, amount collected, contractual adjustments, and Associate's calculated compensation. Reports shall be delivered no later than [REPORT DELIVERY, e.g., 5] business days after the end of each pay period.

3.4 AUDIT RIGHT. Associate may request a review of collections records upon [AUDIT NOTICE, e.g., 10] business days' written notice, not more than once per quarter.

-----------------------------------------------------------------------
SECTION 4 -- BENEFITS SUMMARY
-----------------------------------------------------------------------

4.1 PAID TIME OFF. [PTO DAYS, e.g., 10] days per year, accruing monthly. Additional unpaid time off may be requested subject to Practice approval.

4.2 CONTINUING EDUCATION. $[CE ALLOWANCE, e.g., 2,500] annual CE allowance plus [CE DAYS, e.g., 3] paid CE days.

4.3 HEALTH INSURANCE. [DESCRIBE: e.g., "Practice contributes 50% of individual plan premium" / "Not provided"].

4.4 MALPRACTICE INSURANCE. Provided by Practice with limits of $[PER OCCURRENCE, e.g., 1,000,000]/$[AGGREGATE, e.g., 3,000,000]. Tail coverage as specified in the Employment Agreement.

4.5 LICENSURE AND DUES. Practice reimburses state license renewal, DEA registration (if applicable), and [PROFESSIONAL ORG] membership dues.

4.6 RETIREMENT. [DESCRIBE: e.g., "SIMPLE IRA with 3% employer match" / "Not currently offered"].

-----------------------------------------------------------------------
SECTION 5 -- GENERAL PROVISIONS
-----------------------------------------------------------------------

5.1 TERM. This Addendum shall remain in effect for the duration of the Employment Agreement unless amended in writing by both Parties.

5.2 AMENDMENTS. This Addendum may be amended only by written agreement signed by both Parties. Any modification to the compensation model (e.g., transitioning from Model C to Model A) shall be documented as an amendment to this Addendum.

5.3 INTEGRATION. This Addendum, together with the Employment Agreement, constitutes the entire agreement between the Parties regarding Associate's compensation and benefits. All prior oral or written understandings regarding compensation are superseded.

5.4 GOVERNING LAW. This Addendum shall be governed by the laws of the State of [STATE].

SIGNATURES

PRACTICE:
[PRACTICE NAME]
By: ___________________________________
Name: [AUTHORIZED SIGNER]
Title: [TITLE]
Date: _________________________________

ASSOCIATE:
___________________________________
[ASSOCIATE NAME], D.C.
Date: _________________________________`;

// ---------------------------------------------------------------------------
// Word counts & page estimates
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

const associateWordCount = countWords(associateEmploymentContent);
const icWordCount = countWords(independentContractorContent);
const nonCompeteWordCount = countWords(nonCompeteContent);
const addendumWordCount = countWords(compensationAddendumContent);

export const EMPLOYMENT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'associate-employment',
    title: 'Associate Doctor Employment Agreement',
    category: 'employment',
    tags: [
      'associate',
      'employment',
      'chiropractic',
      'compensation',
      'non-compete',
      'benefits',
      'termination',
      'partnership',
    ],
    description:
      'Comprehensive employment agreement for associate chiropractors. Includes three alternative compensation structures (percentage of collections, base salary + bonus, and flat salary), non-compete and non-solicitation covenants, malpractice insurance provisions, termination clauses, intellectual property protections, optional equity/partnership pathway, and detailed attorney annotations explaining each clause. Drafted to protect both the practice owner and the associate doctor.',
    content: associateEmploymentContent,
    price: 49,
    wordCount: associateWordCount,
    pageEstimate: Math.ceil(associateWordCount / 250),
  },
  {
    id: 'independent-contractor',
    title: 'Independent Contractor Agreement',
    category: 'employment',
    tags: [
      'independent contractor',
      '1099',
      'locum',
      'massage therapist',
      'acupuncturist',
      'chiropractic',
      'IC classification',
      'IRS',
    ],
    description:
      'Independent contractor agreement for hiring 1099 providers including locum chiropractors, massage therapists, and acupuncturists. Carefully structured to establish and maintain independent contractor status under IRS multi-factor analysis. Includes provisions addressing control, schedule, tools, exclusivity, insurance, HIPAA compliance, and non-solicitation. Features detailed annotations on misclassification risks and penalties.',
    content: independentContractorContent,
    price: 39,
    wordCount: icWordCount,
    pageEstimate: Math.ceil(icWordCount / 250),
  },
  {
    id: 'non-compete',
    title: 'Non-Compete / Non-Solicitation Agreement',
    category: 'employment',
    tags: [
      'non-compete',
      'non-solicitation',
      'restrictive covenant',
      'chiropractic',
      'patient protection',
      'enforceability',
    ],
    description:
      'Standalone non-competition and non-solicitation agreement for chiropractic practices. Covers geographic non-compete, patient non-solicitation, employee non-solicitation, and referral source protection. Includes consideration provisions, remedies (injunctive relief and liquidated damages), judicial modification clause, and comprehensive state-by-state enforceability notes for CA, TX, FL, NY, IL, GA, OH, and PA. Usable alongside any employment or contractor agreement.',
    content: nonCompeteContent,
    price: 39,
    wordCount: nonCompeteWordCount,
    pageEstimate: Math.ceil(nonCompeteWordCount / 250),
  },
  {
    id: 'compensation-addendum',
    title: 'Associate Compensation Addendum',
    category: 'employment',
    tags: [
      'compensation',
      'addendum',
      'collections',
      'salary',
      'bonus',
      'chiropractic',
      'pay structure',
      'benefits',
    ],
    description:
      'Modular compensation addendum attachable to any chiropractic employment agreement. Includes three ready-to-use compensation models with real numbers: (A) 30% of personal collections with $5,000/month floor, (B) $7,000 base salary plus 10% bonus on collections above $25,000, and (C) $8,500 flat salary with 12-month review. Also covers bonus structures, production thresholds, collections definitions, payment timing, audit rights, and benefits summary.',
    content: compensationAddendumContent,
    price: 29,
    wordCount: addendumWordCount,
    pageEstimate: Math.ceil(addendumWordCount / 250),
  },
];
