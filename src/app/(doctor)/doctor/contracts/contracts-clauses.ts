interface ContractTemplate {
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

export const CLAUSE_LIBRARY: ContractTemplate[] = [
  // ─────────────────────────────────────────────────────────────────────
  // 1. Confidentiality / NDA Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-confidentiality',
    title: 'Confidentiality / NDA Clause',
    category: 'clause',
    tags: ['clause', 'confidentiality', 'nda', 'hipaa', 'patient-data', 'trade-secrets'],
    description:
      'Comprehensive confidentiality clause covering patient data, financial information, clinical protocols, and trade secrets with HIPAA-aligned obligations.',
    price: 0,
    wordCount: 312,
    pageEstimate: 1,
    content: `CONFIDENTIALITY AND NON-DISCLOSURE

1. Definition of Confidential Information. "Confidential Information" shall mean all proprietary, non-public information disclosed by either Party to the other, whether orally, in writing, or by any other means, including but not limited to: (a) patient records, protected health information ("PHI"), and individually identifiable health information as defined under the Health Insurance Portability and Accountability Act of 1996 ("HIPAA") and its implementing regulations; (b) financial information, including revenue figures, fee schedules, payor contracts, accounts receivable data, and compensation structures; (c) clinical protocols, treatment methodologies, patient intake procedures, and proprietary care plans; (d) marketing strategies, referral source lists, patient demographics, and business development plans; and (e) trade secrets, proprietary software configurations, and operational systems unique to the Practice.

2. Obligations of Receiving Party. The Receiving Party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party without the prior written consent of the Disclosing Party; (c) use Confidential Information solely for the purposes contemplated by this Agreement; and (d) take all reasonable measures, no less protective than those used to protect its own confidential information, to prevent unauthorized disclosure or use.

3. Exclusions. Confidential Information shall not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was rightfully in the Receiving Party's possession prior to disclosure; (c) is independently developed without use of Confidential Information; or (d) is required to be disclosed by law, regulation, or court order, provided that the Receiving Party gives prompt written notice to the Disclosing Party.

4. Duration. The obligations under this Section shall survive the termination or expiration of this Agreement and shall continue for a period of five (5) years following such termination or expiration, except with respect to PHI and trade secrets, which shall remain confidential indefinitely.

[PLAIN ENGLISH]
This clause protects sensitive practice information from being shared outside the agreement. It covers patient records, money details, how you treat patients, and business secrets. Both sides must keep this information private and can only use it for work purposes. The obligation lasts five years after the contract ends, except patient health data and trade secrets which are protected forever.

[WHEN TO USE]
Include this clause in every employment agreement, independent contractor agreement, and associate doctor contract. It is essential whenever a party will have access to patient records, billing data, proprietary treatment protocols, or any business information you would not want a competitor to obtain.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 2. Severability Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-severability',
    title: 'Severability Clause',
    category: 'clause',
    tags: ['clause', 'severability', 'enforceability', 'boilerplate'],
    description:
      'Ensures the remainder of the contract survives if any individual provision is held unenforceable by a court or regulatory body.',
    price: 0,
    wordCount: 198,
    pageEstimate: 1,
    content: `SEVERABILITY

If any provision, clause, or part thereof of this Agreement is held to be invalid, illegal, void, or unenforceable by a court of competent jurisdiction, arbitral tribunal, or regulatory body, such determination shall not affect, impair, or invalidate the remainder of this Agreement, and all other provisions shall remain in full force and effect. The Parties agree that should any provision be deemed unenforceable, the court or tribunal shall have the authority to modify such provision to the minimum extent necessary to render it valid and enforceable while preserving the original intent of the Parties to the greatest extent possible.

In the event that modification is not feasible, the invalid provision shall be severed from this Agreement, and the remaining provisions shall be construed as if such invalid provision had never been included. The Parties further agree that, upon any such determination, they shall negotiate in good faith to replace the invalid provision with a valid provision that most closely approximates the economic and legal effect of the severed provision.

This Section shall apply to all provisions of this Agreement, including but not limited to restrictive covenants, non-competition clauses, and compensation terms, each of which the Parties acknowledge to be independently valuable and severable from the remainder of this Agreement.

[PLAIN ENGLISH]
If a court decides that one part of the contract is not enforceable, the rest of the contract still applies. The court can adjust the problem section to make it work, or simply remove it. Either way, the rest of your agreement stays intact.

[WHEN TO USE]
Include in every contract. This is a standard protective clause that prevents the entire agreement from being thrown out because of one problematic provision. It is especially critical when the contract contains non-compete or restrictive covenant provisions, which courts frequently narrow or strike down.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 3. Entire Agreement / Integration Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-entire-agreement',
    title: 'Entire Agreement / Integration Clause',
    category: 'clause',
    tags: ['clause', 'entire-agreement', 'integration', 'merger', 'boilerplate'],
    description:
      'Establishes the contract as the complete and final agreement, superseding all prior negotiations, representations, and understandings.',
    price: 0,
    wordCount: 210,
    pageEstimate: 1,
    content: `ENTIRE AGREEMENT

This Agreement, including all exhibits, schedules, and addenda attached hereto and incorporated herein by reference, constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous negotiations, representations, warranties, commitments, offers, contracts, and understandings between the Parties, whether written or oral, relating to such subject matter.

Each Party acknowledges and agrees that it has not relied upon any statement, representation, warranty, or agreement of the other Party except for those expressly set forth in this Agreement. No prior drafts of this Agreement, nor any correspondence or communications exchanged during the negotiation of this Agreement, shall be used to construe or interpret any provision hereof.

This Agreement may not be contradicted by evidence of any prior or contemporaneous oral agreement between the Parties. The Parties further acknowledge that there are no other agreements, understandings, or commitments between them relating to the subject matter hereof that are not fully expressed in this Agreement. Any terms or conditions contained in any purchase order, acknowledgment, invoice, or similar document issued by either Party that are inconsistent with or in addition to the terms of this Agreement shall be void and of no effect.

[PLAIN ENGLISH]
This clause means the signed contract is the final word. Any promises, emails, conversations, or earlier draft agreements that happened before signing do not count. If it is not in the signed document, it does not exist as part of the deal.

[WHEN TO USE]
Include in every contract. This prevents a party from later claiming that a verbal promise or informal email creates additional obligations beyond what is in the signed agreement. It is particularly important after lengthy negotiations where many terms may have been discussed but not all were included in the final version.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 4. Amendment Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-amendment',
    title: 'Amendment Clause',
    category: 'clause',
    tags: ['clause', 'amendment', 'modification', 'boilerplate'],
    description:
      'Specifies the process for modifying the contract, requiring written consent signed by both parties.',
    price: 0,
    wordCount: 195,
    pageEstimate: 1,
    content: `AMENDMENTS AND MODIFICATIONS

No amendment, modification, supplement, or waiver of any provision of this Agreement shall be valid or binding unless made in writing and duly executed by authorized representatives of both Parties. No oral modification, amendment, or waiver of any term of this Agreement shall be effective, regardless of whether either Party has knowledge of or acquiesces to such modification.

Any amendment to this Agreement shall specifically reference this Agreement by title and date, identify the Section(s) being amended, and set forth the revised language in full. Amendments shall become effective on the date of the last signature unless the amendment specifies a different effective date.

The Parties agree that no course of dealing, course of performance, or trade usage shall operate to amend or modify this Agreement. The failure of either Party to insist upon strict performance of any provision shall not be construed as a waiver of any subsequent breach or default of the same or similar nature.

Each Party represents that the individual executing any amendment on its behalf has full authority to bind that Party to the terms of such amendment. All amendments shall be attached to and become part of this Agreement.

[PLAIN ENGLISH]
The contract can only be changed if both sides agree in writing and sign the changes. Verbal agreements to change the contract do not count. Each change must clearly state what section is being modified and what the new language is.

[WHEN TO USE]
Include in every contract. Without this clause, a party could argue that informal communications or conduct effectively changed the contract terms. This is especially important in chiropractic practices where employment terms, compensation, or schedules may be discussed informally but should only change through formal amendment.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 5. Force Majeure Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-force-majeure',
    title: 'Force Majeure Clause',
    category: 'clause',
    tags: ['clause', 'force-majeure', 'pandemic', 'disaster', 'emergency'],
    description:
      'Excuses performance obligations during extraordinary events such as pandemics, natural disasters, and government-ordered shutdowns.',
    price: 0,
    wordCount: 278,
    pageEstimate: 1,
    content: `FORCE MAJEURE

Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement to the extent that such failure or delay results from a Force Majeure Event, provided that the affected Party gives prompt written notice to the other Party describing the nature and expected duration of the event.

"Force Majeure Event" means any event beyond the reasonable control of the affected Party, including but not limited to: (a) pandemics, epidemics, or public health emergencies, including government-mandated quarantines, stay-at-home orders, or mandatory practice closures; (b) natural disasters, including earthquakes, hurricanes, floods, tornadoes, and wildfires; (c) acts of government, including changes in law, regulation, executive order, or the suspension, revocation, or non-renewal of professional licenses or permits through no fault of the affected Party; (d) acts of war, terrorism, civil unrest, or insurrection; (e) utility failures, including prolonged power outages, internet disruptions, or telecommunications failures; and (f) supply chain disruptions materially affecting the availability of clinical equipment or supplies necessary for practice operations.

The affected Party shall use commercially reasonable efforts to mitigate the effects of the Force Majeure Event and resume performance as soon as practicable. During any Force Majeure Event exceeding thirty (30) consecutive days, either Party may, upon written notice, renegotiate the affected terms of this Agreement. If the Force Majeure Event continues for ninety (90) consecutive days or more, either Party may terminate this Agreement upon thirty (30) days' written notice without penalty or liability to the other Party.

Notwithstanding the foregoing, a Force Majeure Event shall not excuse any obligation to make payments that accrued prior to the occurrence of the event, nor shall it excuse compliance with HIPAA, state privacy laws, or patient record retention requirements.

[PLAIN ENGLISH]
If something extraordinary and uncontrollable happens -- like a pandemic, hurricane, or government shutdown -- neither side is penalized for being unable to fulfill the contract. The affected party must notify the other side promptly and try to resume as soon as possible. If the event lasts more than 90 days, either side can end the contract. However, money already owed must still be paid, and patient privacy laws still apply regardless.

[WHEN TO USE]
Include in any long-term employment, associate, or lease agreement. This clause became critical after the COVID-19 pandemic demonstrated that government-ordered practice closures can make contract performance impossible. It protects both the practice owner and the associate doctor from liability during events neither party can control.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 6. Governing Law Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-governing-law',
    title: 'Governing Law Clause',
    category: 'clause',
    tags: ['clause', 'governing-law', 'jurisdiction', 'venue', 'boilerplate'],
    description:
      'Specifies which state laws govern the agreement and establishes the exclusive venue for any legal proceedings.',
    price: 0,
    wordCount: 192,
    pageEstimate: 1,
    content: `GOVERNING LAW AND JURISDICTION

This Agreement shall be governed by, construed, and enforced in accordance with the laws of the State of __________, without regard to its conflict of laws principles. The Parties expressly agree that the United Nations Convention on Contracts for the International Sale of Goods shall not apply to this Agreement.

Any action, suit, or proceeding arising out of or relating to this Agreement shall be brought exclusively in the state or federal courts located in __________ County, State of __________. Each Party hereby irrevocably consents to the personal jurisdiction and venue of such courts and waives any objection based on inconvenient forum or lack of jurisdiction.

The Parties agree that service of process may be made by certified mail, return receipt requested, to the addresses set forth in the Notice provisions of this Agreement, or by any other method permitted by applicable law. Each Party waives any right to a jury trial in any action, proceeding, or counterclaim arising out of or relating to this Agreement.

Nothing in this Section shall prevent either Party from seeking injunctive or equitable relief in any court of competent jurisdiction to protect its rights under this Agreement, including enforcement of confidentiality and restrictive covenant provisions.

[PLAIN ENGLISH]
This clause picks which state's laws control the contract and where any lawsuits must be filed. Both sides agree to that specific court location and give up the right to a jury trial. Either side can still go to court for emergency orders, like stopping someone from violating a non-compete.

[WHEN TO USE]
Include in every contract. Always select the state where the practice is physically located. This prevents disputes about which state's laws apply and avoids the expense of litigating in a distant or inconvenient jurisdiction. Fill in the blanks with the appropriate state and county before execution.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 7. Waiver Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-waiver',
    title: 'Waiver Clause',
    category: 'clause',
    tags: ['clause', 'waiver', 'enforcement', 'boilerplate'],
    description:
      'Preserves the right to enforce contract terms even if a party has previously overlooked or tolerated a breach.',
    price: 0,
    wordCount: 178,
    pageEstimate: 1,
    content: `NO WAIVER

The failure or delay of either Party to exercise any right, power, or remedy under this Agreement shall not operate as a waiver thereof, nor shall any single or partial exercise of any right, power, or remedy preclude any other or further exercise thereof or the exercise of any other right, power, or remedy.

No waiver of any provision of this Agreement shall be effective unless made in writing and signed by the waiving Party. A written waiver of any particular breach or default shall not constitute a waiver of any subsequent breach or default of the same or any other provision.

The rights and remedies provided in this Agreement are cumulative and not exclusive of any rights or remedies provided by law or equity. No course of dealing between the Parties shall constitute a waiver or modification of any provision of this Agreement.

Each Party acknowledges that the other Party may, from time to time, overlook or fail to enforce strict compliance with certain provisions of this Agreement, and that such forbearance shall not constitute a waiver or estoppel with respect to any subsequent or continuing breach.

[PLAIN ENGLISH]
Just because one side lets something slide once does not mean they have given up their right to enforce it later. For example, if the practice overlooks a late report one month, it can still enforce the deadline next month. Any official waiver must be in writing.

[WHEN TO USE]
Include in every contract. This clause is particularly valuable for practice owners who may informally accommodate an associate on scheduling, reporting, or other obligations. Without it, a pattern of tolerance could be argued as an implicit waiver of contract rights.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 8. Assignment Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-assignment',
    title: 'Assignment Clause',
    category: 'clause',
    tags: ['clause', 'assignment', 'transfer', 'successor', 'practice-sale'],
    description:
      'Controls whether and how the contract may be transferred to another party, including in the event of a practice sale or merger.',
    price: 0,
    wordCount: 215,
    pageEstimate: 1,
    content: `ASSIGNMENT

Neither Party may assign, delegate, or otherwise transfer this Agreement or any rights or obligations hereunder, in whole or in part, without the prior written consent of the other Party, which consent shall not be unreasonably withheld, conditioned, or delayed. Any attempted assignment in violation of this Section shall be null and void and of no force or effect.

Notwithstanding the foregoing, the Practice Owner may assign this Agreement without the consent of the other Party in connection with: (a) a merger, acquisition, or consolidation of the Practice; (b) a sale of all or substantially all of the Practice's assets; or (c) a transfer to an affiliate or successor entity under common ownership or control, provided that the assignee expressly assumes all obligations under this Agreement.

In the event of a permitted assignment, the assigning Party shall provide written notice to the other Party within fifteen (15) business days of such assignment, identifying the assignee and confirming the assignee's assumption of all obligations hereunder. The assigning Party shall remain jointly and severally liable for all obligations arising prior to the effective date of such assignment unless the non-assigning Party provides a written release.

This Agreement shall be binding upon and shall inure to the benefit of the Parties and their respective heirs, executors, administrators, legal representatives, successors, and permitted assigns.

[PLAIN ENGLISH]
Neither side can transfer this contract to someone else without written permission. The main exception is if the practice is sold or merges with another practice -- in that case, the contract transfers to the new owner, who must honor all existing obligations. The original party is still on the hook for anything owed before the transfer date.

[WHEN TO USE]
Include in employment and associate agreements to protect both parties during ownership transitions. This is critical for practice owners planning a future sale and for associates who want assurance that their contract terms survive a change in ownership. It balances the owner's need for deal flexibility with the associate's need for stability.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 9. Indemnification Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-indemnification',
    title: 'Indemnification Clause',
    category: 'clause',
    tags: ['clause', 'indemnification', 'liability', 'hold-harmless', 'malpractice'],
    description:
      'Requires one party to cover the other party\'s losses, damages, and legal costs arising from specified events such as malpractice, negligence, or regulatory violations.',
    price: 0,
    wordCount: 268,
    pageEstimate: 1,
    content: `INDEMNIFICATION

1. Indemnification by Associate. The Associate shall indemnify, defend, and hold harmless the Practice, its owners, officers, directors, employees, and agents (collectively, the "Practice Indemnified Parties") from and against any and all claims, demands, actions, suits, damages, liabilities, losses, settlements, judgments, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of or relating to: (a) any act or omission of the Associate in the performance of clinical services, including malpractice, negligence, or deviation from accepted standards of chiropractic care; (b) any breach of this Agreement by the Associate; (c) any violation of applicable federal, state, or local law, regulation, or professional licensing requirement by the Associate; or (d) any claim by a third party arising from the Associate's conduct outside the scope of this Agreement.

2. Indemnification by Practice. The Practice shall indemnify, defend, and hold harmless the Associate from and against any and all claims, demands, actions, suits, damages, liabilities, losses, settlements, judgments, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of or relating to: (a) any deficiency in the Practice's facilities, equipment, or staffing that directly causes patient harm; (b) any breach of this Agreement by the Practice; or (c) any employment practices claim arising from the Practice's conduct as employer.

3. Procedure. The indemnified Party shall provide prompt written notice of any claim or demand to the indemnifying Party. The indemnifying Party shall have the right to assume control of the defense of any such claim at its own expense. The indemnified Party shall cooperate fully in the defense and shall not settle any claim without the prior written consent of the indemnifying Party.

[PLAIN ENGLISH]
Each side agrees to cover the other's legal bills and losses when the covered side causes a problem. The associate covers malpractice and personal negligence claims. The practice covers claims caused by facility problems or its own breaches. Whoever receives a claim must promptly notify the other side.

[WHEN TO USE]
Include in associate and employment agreements. This clause is critical for defining who pays when something goes wrong. It protects practice owners from associate malpractice exposure and protects associates from claims caused by practice-level failures. Both sides should maintain adequate malpractice insurance in addition to this clause.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 10. Limitation of Liability Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-liability-limit',
    title: 'Limitation of Liability Clause',
    category: 'clause',
    tags: ['clause', 'liability', 'damages-cap', 'limitation', 'risk-management'],
    description:
      'Caps the maximum financial exposure of each party under the agreement, excluding certain categories of damages from recovery.',
    price: 0,
    wordCount: 235,
    pageEstimate: 1,
    content: `LIMITATION OF LIABILITY

1. Cap on Damages. Except as provided in Section 2 below, the aggregate liability of either Party to the other Party for any and all claims arising out of or relating to this Agreement, whether in contract, tort, strict liability, or otherwise, shall not exceed the total compensation paid or payable under this Agreement during the twelve (12) month period immediately preceding the event giving rise to the claim.

2. Exclusions from Cap. The limitation set forth in Section 1 shall not apply to: (a) liability arising from willful misconduct, gross negligence, or fraud; (b) liability arising from the breach of confidentiality obligations or unauthorized disclosure of protected health information; (c) indemnification obligations under this Agreement; or (d) liability that cannot be limited by applicable law.

3. Exclusion of Consequential Damages. In no event shall either Party be liable to the other Party for any indirect, incidental, special, consequential, punitive, or exemplary damages, including but not limited to loss of profits, loss of revenue, loss of patients, loss of goodwill, or business interruption, regardless of the cause of action or the theory of liability, even if such Party has been advised of the possibility of such damages.

4. Duty to Mitigate. Each Party shall take commercially reasonable steps to mitigate any damages for which the other Party may be liable under this Agreement.

[PLAIN ENGLISH]
This clause puts a ceiling on how much money one side can owe the other -- generally limited to one year of compensation paid under the contract. It also eliminates the ability to claim speculative or indirect damages like lost future profits. However, the cap does not protect anyone who acts fraudulently, is grossly negligent, or violates patient privacy.

[WHEN TO USE]
Include in employment and associate agreements to manage financial risk. Practice owners benefit from capping potential exposure to contract claims; associates benefit from limiting their liability for business losses. This clause should be reviewed with counsel to ensure the cap amount is appropriate for the specific arrangement.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 11. Insurance Requirements Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-insurance',
    title: 'Insurance Requirements Clause',
    category: 'clause',
    tags: ['clause', 'insurance', 'malpractice', 'liability', 'workers-comp', 'coverage'],
    description:
      'Establishes minimum insurance coverage requirements including professional malpractice, general liability, and workers compensation.',
    price: 0,
    wordCount: 272,
    pageEstimate: 1,
    content: `INSURANCE REQUIREMENTS

1. Professional Liability Insurance. The Associate shall obtain and maintain, at all times during the term of this Agreement, professional liability (malpractice) insurance with minimum coverage limits of $1,000,000 per occurrence and $3,000,000 in the aggregate, issued by a carrier rated A- or better by A.M. Best Company. If such insurance is provided on a claims-made basis, the Associate shall maintain continuous coverage or purchase tail coverage (extended reporting period) for a minimum of three (3) years following the termination of this Agreement.

2. General Liability Insurance. The Practice shall maintain commercial general liability insurance with minimum coverage limits of $1,000,000 per occurrence and $2,000,000 in the aggregate, covering the premises, operations, and activities of the Practice.

3. Workers' Compensation Insurance. The Practice shall maintain workers' compensation insurance as required by applicable state law, with employer's liability limits of no less than $500,000 per accident, $500,000 per employee for disease, and $500,000 policy limit for disease.

4. Additional Insured. Upon request, each Party shall name the other Party as an additional insured on its applicable insurance policies and provide certificates of insurance evidencing such coverage within fifteen (15) business days of the request.

5. Notice of Changes. Each Party shall provide the other Party with at least thirty (30) days' prior written notice of any cancellation, material reduction in coverage, or non-renewal of any insurance policy required under this Section. Failure to maintain required insurance shall constitute a material breach of this Agreement.

[PLAIN ENGLISH]
Both sides must carry specific insurance. The associate needs malpractice coverage of at least $1 million per incident and $3 million total. If the malpractice policy only covers claims filed during the policy term (claims-made), the associate must buy extended coverage for three years after leaving. The practice must carry general business liability and workers' comp. Each side can ask to be listed on the other's insurance.

[WHEN TO USE]
Include in every associate and employment agreement. Insurance requirements protect both parties and their patients. The coverage minimums listed here are common starting points; adjust them based on your state's requirements, practice volume, and risk profile. Many states mandate specific minimum coverage for licensed chiropractors.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 12. Dispute Resolution (Arbitration)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-arbitration',
    title: 'Dispute Resolution (Arbitration)',
    category: 'clause',
    tags: ['clause', 'arbitration', 'dispute-resolution', 'aaa', 'binding'],
    description:
      'Requires binding arbitration under AAA rules as the exclusive method for resolving disputes, with limited exceptions for injunctive relief.',
    price: 0,
    wordCount: 248,
    pageEstimate: 1,
    content: `DISPUTE RESOLUTION -- BINDING ARBITRATION

1. Agreement to Arbitrate. Any dispute, controversy, or claim arising out of or relating to this Agreement, including the breach, termination, or validity thereof, shall be finally and exclusively resolved by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its then-current Employment Arbitration Rules and Mediation Procedures.

2. Arbitrator Selection. The arbitration shall be conducted by a single neutral arbitrator selected in accordance with the AAA's arbitrator selection procedures. The arbitrator shall be an attorney with at least ten (10) years of experience in healthcare or employment law.

3. Location and Procedure. The arbitration shall take place in the city and state where the Practice's principal office is located. The arbitrator shall apply the substantive law of the state specified in the Governing Law provision of this Agreement. Discovery shall be limited to the exchange of relevant documents and no more than two (2) depositions per Party, unless the arbitrator determines that additional discovery is necessary for a fair resolution.

4. Arbitration Award. The arbitrator's award shall be final and binding and may be entered as a judgment in any court of competent jurisdiction. The arbitrator shall have the authority to award any remedy available under applicable law, including compensatory damages, injunctive relief, and attorneys' fees.

5. Costs. Each Party shall bear its own attorneys' fees and costs, and the Parties shall share equally the arbitrator's fees and AAA administrative costs, unless the arbitrator awards fees and costs to the prevailing Party.

6. Exception. Notwithstanding the foregoing, either Party may seek temporary or preliminary injunctive relief from a court of competent jurisdiction to prevent irreparable harm pending arbitration.

[PLAIN ENGLISH]
Instead of going to court, both sides agree to settle disagreements through a private arbitrator under AAA rules. The arbitrator is a lawyer with healthcare experience, and the decision is final and legally binding. Each side pays their own legal fees and splits the arbitration costs. Either side can still go to court for emergency protective orders.

[WHEN TO USE]
Use when both parties prefer faster, more private dispute resolution over public litigation. Arbitration is typically quicker and less expensive than a full trial. However, it limits the right to appeal, so both sides should understand the trade-off. Consider pairing this with the Mediation First clause for a two-step process.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 13. Dispute Resolution (Mediation First)
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-mediation',
    title: 'Dispute Resolution (Mediation First)',
    category: 'clause',
    tags: ['clause', 'mediation', 'dispute-resolution', 'negotiation', 'alternative-dispute'],
    description:
      'Requires the parties to attempt mediation before proceeding to arbitration or litigation, promoting early resolution and preserving professional relationships.',
    price: 0,
    wordCount: 242,
    pageEstimate: 1,
    content: `DISPUTE RESOLUTION -- MEDIATION PREREQUISITE

1. Good Faith Negotiation. In the event of any dispute, controversy, or claim arising out of or relating to this Agreement, the Parties shall first attempt to resolve the dispute through good faith negotiation. Either Party may initiate the negotiation process by providing written notice to the other Party describing the nature of the dispute and the relief sought. The Parties shall meet, in person or by videoconference, within fourteen (14) calendar days of such notice to discuss resolution.

2. Mediation. If the dispute is not resolved through negotiation within thirty (30) calendar days of the initial notice, either Party may submit the dispute to mediation. Mediation shall be conducted by a neutral mediator mutually agreed upon by the Parties, or, failing agreement within ten (10) business days, selected by the American Arbitration Association. The mediation shall take place in the county where the Practice's principal office is located and shall be completed within sixty (60) calendar days of the mediator's appointment.

3. Costs of Mediation. The Parties shall share equally the mediator's fees and expenses. Each Party shall bear its own attorneys' fees, costs, and expenses related to the mediation.

4. Confidentiality. All communications, offers, and statements made during mediation shall be confidential and inadmissible in any subsequent arbitration or litigation proceeding, except as required by law.

5. Condition Precedent. Neither Party may initiate arbitration or litigation until the mediation process described herein has been completed or the mediator has declared an impasse in writing.

[PLAIN ENGLISH]
Before anyone can sue or start arbitration, both sides must first try to work it out themselves and then, if needed, go through formal mediation with a neutral mediator. This gives both parties a lower-cost, less adversarial way to resolve disagreements. Anything said during mediation stays confidential and cannot be used against either side later.

[WHEN TO USE]
Use when you want to preserve the professional relationship and avoid jumping straight to adversarial proceedings. This is ideal for associate agreements and partnerships where the parties will likely continue to interact in the same professional community. Pair with the Arbitration clause for a complete two-step dispute resolution process.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 14. Social Media Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-social-media',
    title: 'Social Media Clause',
    category: 'clause',
    tags: ['clause', 'social-media', 'content-ownership', 'patient-privacy', 'marketing', 'hipaa'],
    description:
      'Governs social media activities including content ownership, patient privacy protections, and restrictions on practice-related posts during and after employment.',
    price: 0,
    wordCount: 275,
    pageEstimate: 1,
    content: `SOCIAL MEDIA AND ONLINE PRESENCE

1. Practice Accounts. All social media accounts created for or on behalf of the Practice, including but not limited to accounts on Facebook, Instagram, TikTok, YouTube, LinkedIn, and any successor platforms, are and shall remain the exclusive property of the Practice. The Associate shall not create any social media account using the Practice's name, branding, or likeness without prior written approval.

2. Content Ownership. All content created by the Associate in the course of employment or engagement, including videos, photographs, written posts, educational materials, and patient testimonials, using Practice resources, branding, or patient relationships, shall be the property of the Practice under work-for-hire principles. The Associate may request a non-exclusive license to use such content for personal professional portfolio purposes, subject to written approval.

3. Patient Privacy. The Associate shall not post, share, or otherwise disseminate any content that identifies or could reasonably identify a patient, directly or indirectly, without a valid, signed HIPAA-compliant authorization from the patient. This obligation applies to all platforms, including personal accounts, and survives termination of this Agreement.

4. Personal Accounts. The Associate may maintain personal social media accounts, provided that: (a) the Associate clearly distinguishes personal opinions from Practice positions; (b) the Associate does not disparage the Practice, its owners, staff, or patients; (c) the Associate does not solicit or communicate with Practice patients through personal accounts for purposes of redirecting patients away from the Practice; and (d) all content complies with applicable state chiropractic board advertising and ethics rules.

5. Post-Termination. Upon termination, the Associate shall immediately surrender access to all Practice social media accounts, remove any Practice branding from personal accounts, and cease representing any ongoing affiliation with the Practice.

[PLAIN ENGLISH]
The practice owns its social media accounts and any content you create using practice resources. You cannot post anything that could identify a patient without their written HIPAA authorization. You may use your personal accounts but cannot badmouth the practice, steal patients through social media, or violate advertising rules. When you leave, you hand over all practice account access immediately.

[WHEN TO USE]
Include in every modern employment and associate agreement. Social media disputes are increasingly common in chiropractic practices, particularly when an associate leaves and patients follow the associate's personal social media presence. This clause also protects against HIPAA violations from well-intentioned but non-compliant patient posts.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 15. Moonlighting Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-moonlighting',
    title: 'Moonlighting Clause',
    category: 'clause',
    tags: ['clause', 'moonlighting', 'outside-employment', 'exclusivity', 'conflict-of-interest'],
    description:
      'Restricts the associate from engaging in outside employment or practice that conflicts with their obligations to the practice.',
    price: 0,
    wordCount: 238,
    pageEstimate: 1,
    content: `OUTSIDE EMPLOYMENT AND ACTIVITIES

1. Disclosure Requirement. During the term of this Agreement, the Associate shall not engage in any outside employment, consulting, independent practice, or professional activity related to chiropractic care, healthcare, or wellness services without the prior written consent of the Practice Owner. Any request for approval shall be submitted in writing and shall include the nature, location, time commitment, and compensation of the proposed activity.

2. Standards for Approval. The Practice Owner shall evaluate each request based on whether the proposed activity: (a) conflicts with the Associate's scheduling obligations under this Agreement; (b) involves direct or indirect competition with the Practice within the geographic area defined in any applicable non-competition provision; (c) creates a conflict of interest with the Practice's patients, referral sources, or business relationships; or (d) presents a risk to the Practice's professional reputation.

3. Permitted Activities. The following activities shall not require prior approval: (a) teaching or lecturing at accredited educational institutions; (b) publishing academic or professional articles; (c) participating in professional association activities; and (d) providing volunteer healthcare services at charitable events, provided such activities do not materially interfere with the Associate's obligations under this Agreement.

4. Revocation. The Practice Owner reserves the right to revoke approval for any outside activity upon thirty (30) days' written notice if circumstances change such that the activity now conflicts with the standards described in Section 2.

[PLAIN ENGLISH]
You need written permission before working anywhere else in healthcare while under this contract. The practice evaluates whether the side work competes with or hurts the practice. Teaching, writing articles, professional associations, and charity events are generally fine without permission as long as they do not interfere with your job.

[WHEN TO USE]
Include in full-time associate and employment agreements when you expect the associate to devote their primary professional efforts to your practice. This clause is especially important in markets where multiple chiropractic practices are nearby and an associate could divert patients or referrals. For part-time arrangements, consider a more permissive version.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 16. Invention / IP Assignment Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-ip-assignment',
    title: 'Invention / IP Assignment Clause',
    category: 'clause',
    tags: ['clause', 'intellectual-property', 'ip-assignment', 'work-for-hire', 'protocols', 'systems'],
    description:
      'Assigns ownership of clinical protocols, marketing materials, proprietary systems, and other intellectual property developed during employment to the practice.',
    price: 0,
    wordCount: 258,
    pageEstimate: 1,
    content: `INTELLECTUAL PROPERTY AND WORK PRODUCT

1. Work for Hire. All work product, materials, documents, protocols, systems, processes, inventions, discoveries, improvements, and creative works (collectively, "Work Product") created, conceived, developed, or reduced to practice by the Associate, alone or jointly with others, during the term of this Agreement and within the scope of the Associate's engagement, shall be considered "work made for hire" as defined under the United States Copyright Act (17 U.S.C. Section 101) and shall be the sole and exclusive property of the Practice.

2. Assignment. To the extent any Work Product does not qualify as work made for hire, the Associate hereby irrevocably assigns, transfers, and conveys to the Practice all right, title, and interest in and to such Work Product, including all copyrights, patents, trademarks, trade secrets, and other intellectual property rights therein.

3. Scope. Work Product includes but is not limited to: (a) clinical treatment protocols, care plans, and patient education materials; (b) marketing materials, brochures, website content, and advertising copy; (c) operational procedures, workflow systems, and training manuals; (d) software configurations, database designs, and technology implementations; and (e) research data, presentations, and publications created using Practice resources.

4. Cooperation. The Associate agrees to execute all documents and take all actions reasonably requested by the Practice to perfect, register, or enforce its rights in any Work Product, both during and after the term of this Agreement.

5. Pre-Existing Work. The Associate retains ownership of any intellectual property created prior to the effective date of this Agreement, provided such property is identified in writing in Exhibit __ attached hereto.

[PLAIN ENGLISH]
Anything you create while working for the practice -- treatment protocols, marketing materials, office systems, educational content -- belongs to the practice. If you had work you created before starting, list it in the exhibit to keep ownership. After leaving, you may be asked to sign additional documents to confirm the practice's ownership of things you created.

[WHEN TO USE]
Include when the associate will develop clinical protocols, create marketing content, build operational systems, or produce educational materials. This is essential for practices investing in system development where an associate's departure could lead to disputes over who owns the protocols and systems they built.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 17. Non-Disparagement Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-non-disparagement',
    title: 'Non-Disparagement Clause',
    category: 'clause',
    tags: ['clause', 'non-disparagement', 'reputation', 'post-termination', 'public-statements'],
    description:
      'Prohibits both parties from making negative, derogatory, or damaging public statements about each other following separation.',
    price: 0,
    wordCount: 222,
    pageEstimate: 1,
    content: `NON-DISPARAGEMENT

1. Mutual Obligation. During the term of this Agreement and for a period of three (3) years following its termination or expiration, neither Party shall, directly or indirectly, make, publish, or communicate any disparaging, derogatory, defamatory, or negative statements, whether written or oral, about the other Party, its owners, officers, directors, employees, agents, services, products, or business practices, to any person or entity, including but not limited to patients, prospective patients, referral sources, vendors, insurance companies, professional organizations, or members of the media.

2. Social Media and Online Platforms. The obligations under this Section extend to all forms of communication, including social media posts, online reviews, blog entries, forum comments, podcast appearances, and video content, whether posted under the Party's real name, a pseudonym, or anonymously.

3. Exceptions. Nothing in this Section shall prevent either Party from: (a) providing truthful testimony or information when required by law, subpoena, court order, or governmental investigation; (b) communicating with licensed attorneys for purposes of obtaining legal advice; (c) filing complaints with appropriate regulatory or licensing boards; or (d) responding truthfully to inquiries from regulatory agencies.

4. Remedies. Any breach of this Section shall entitle the non-breaching Party to seek injunctive relief and recover actual damages, including damage to professional reputation and lost business, without the need to post a bond.

[PLAIN ENGLISH]
Neither side can badmouth the other for three years after the contract ends. This covers everything -- conversations, social media, online reviews, podcasts, all of it. You can still tell the truth in court, talk to your lawyer, or file regulatory complaints. If someone violates this clause, the other side can go to court for an immediate order to stop it plus damages.

[WHEN TO USE]
Include in employment, associate, and separation agreements. This clause protects both the practice's reputation and the departing associate's professional standing. It is particularly valuable in small communities where negative statements can quickly damage a chiropractic practice's referral network and patient base.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 18. Return of Property Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-return-property',
    title: 'Return of Property Clause',
    category: 'clause',
    tags: ['clause', 'return-property', 'termination', 'equipment', 'credentials', 'patient-data'],
    description:
      'Requires the return of all practice property including physical items, digital assets, patient data, and login credentials upon termination.',
    price: 0,
    wordCount: 245,
    pageEstimate: 1,
    content: `RETURN OF PROPERTY

1. Obligation to Return. Upon the termination or expiration of this Agreement, or at any time upon the Practice's request, the Associate shall immediately return to the Practice all property, materials, and information belonging to the Practice or relating to its business, patients, or operations, including but not limited to:

   (a) Physical Property: keys, access cards, security badges, identification cards, office equipment, laptops, tablets, mobile devices, diagnostic instruments, and clinical tools;

   (b) Documents and Records: patient files, charts, intake forms, care plans, financial records, billing documents, referral lists, vendor contracts, and operational manuals, whether in paper or electronic form;

   (c) Digital Assets: electronic files, databases, email archives, digital images, X-rays, MRI scans, and other diagnostic imaging stored on any device or cloud platform, as well as copies of all Practice software and proprietary applications;

   (d) Credentials and Access: all login credentials, passwords, encryption keys, and access codes for Practice systems, including electronic health record ("EHR") systems, billing platforms, email accounts, social media accounts, scheduling software, and cloud storage services.

2. Certification. Within five (5) business days of termination, the Associate shall provide a written certification to the Practice confirming that all property has been returned and that no copies, duplicates, or reproductions of Confidential Information or Practice property have been retained in any form.

3. Failure to Return. The Associate's failure to return any property or provide the required certification shall constitute a material breach and shall entitle the Practice to pursue all available legal and equitable remedies, including withholding any final payments to the extent permitted by applicable law.

[PLAIN ENGLISH]
When you leave, you must return everything that belongs to the practice -- keys, laptops, patient files, scan data, login credentials, everything. Within five business days, you must also sign a statement confirming you returned everything and kept no copies. If you fail to return property, the practice can take legal action and may withhold final payments where the law allows.

[WHEN TO USE]
Include in every employment and associate agreement. This clause is critical for protecting patient data and practice operations during transitions. It should be paired with the Confidentiality clause and reviewed alongside your EHR system's access management procedures to ensure a complete offboarding process.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 19. Survival Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-survival',
    title: 'Survival Clause',
    category: 'clause',
    tags: ['clause', 'survival', 'post-termination', 'continuing-obligations'],
    description:
      'Identifies which contractual obligations continue to bind the parties after the agreement terminates or expires.',
    price: 0,
    wordCount: 208,
    pageEstimate: 1,
    content: `SURVIVAL

The following provisions of this Agreement, together with any other provisions that by their nature are intended to survive, shall survive and remain in full force and effect following the termination or expiration of this Agreement, regardless of the reason for such termination:

(a) Confidentiality and Non-Disclosure obligations, for the duration specified therein;
(b) Non-Competition and Non-Solicitation covenants, for the duration specified therein;
(c) Indemnification obligations, with respect to claims arising from acts or omissions occurring during the term of this Agreement;
(d) Intellectual Property and Work Product provisions;
(e) Non-Disparagement obligations, for the duration specified therein;
(f) Return of Property obligations;
(g) Insurance obligations, including tail coverage requirements;
(h) Dispute Resolution provisions, including arbitration and mediation requirements;
(i) Limitation of Liability provisions;
(j) Governing Law and Jurisdiction provisions; and
(k) Any accrued but unpaid compensation, bonuses, or expense reimbursement obligations.

The survival of the foregoing provisions shall not be affected by any determination that any other provision of this Agreement is invalid, illegal, or unenforceable. The Parties acknowledge that the obligations described in this Section form a material part of the consideration for this Agreement and that neither Party would have entered into this Agreement without the assurance that such obligations would survive its termination.

[PLAIN ENGLISH]
When the contract ends, certain obligations do not disappear. Confidentiality, non-compete, non-solicitation, indemnification, intellectual property, non-disparagement, and several other provisions continue to apply for their stated duration. Any unpaid compensation must still be paid. Both sides acknowledged these surviving obligations were a key reason they agreed to the contract.

[WHEN TO USE]
Include in every contract that contains provisions intended to outlast the agreement itself. Without this clause, there can be arguments about whether post-termination obligations like non-competes or confidentiality requirements are actually enforceable. This clause removes that ambiguity by explicitly listing what survives.`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // 20. Notice Provisions Clause
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'clause-notice',
    title: 'Notice Provisions Clause',
    category: 'clause',
    tags: ['clause', 'notice', 'communication', 'certified-mail', 'delivery', 'boilerplate'],
    description:
      'Establishes the required methods and addresses for delivering formal notices under the agreement, including certified mail, email, and hand delivery.',
    price: 0,
    wordCount: 240,
    pageEstimate: 1,
    content: `NOTICES

1. Method of Delivery. All notices, demands, consents, approvals, requests, and other communications required or permitted under this Agreement ("Notices") shall be in writing and shall be deemed duly given and effective upon:

   (a) Personal Delivery: the date of hand delivery to the designated recipient at the address specified below, confirmed by written acknowledgment of receipt;

   (b) Certified Mail: three (3) business days after deposit in the United States mail, certified or registered, return receipt requested, postage prepaid, addressed to the recipient at the address specified below;

   (c) Overnight Courier: one (1) business day after deposit with a nationally recognized overnight courier service (e.g., FedEx, UPS) with tracking and delivery confirmation, addressed to the recipient at the address specified below;

   (d) Email: the date of electronic transmission, provided that the sender receives electronic confirmation of delivery (not merely confirmation of sending) and sends a confirmatory copy by one of the methods described in subsections (a) through (c) within two (2) business days.

2. Addresses. Notices shall be addressed as follows:

   If to the Practice:
   [Practice Name]
   [Street Address]
   [City, State, ZIP]
   Attn: [Name/Title]
   Email: [Email Address]

   If to the Associate:
   [Associate Name]
   [Street Address]
   [City, State, ZIP]
   Email: [Email Address]

3. Change of Address. Either Party may change its address for notice purposes by providing written notice to the other Party in accordance with this Section. Such change shall be effective five (5) business days after receipt.

[PLAIN ENGLISH]
When the contract requires you to formally notify the other side of something -- like termination, a breach, or a change request -- this clause tells you how to do it. You can hand-deliver, send certified mail, use an overnight courier, or email (but email requires a follow-up hard copy). Notices are only valid if sent to the correct address listed here.

[WHEN TO USE]
Include in every contract. Without this clause, disputes can arise about whether a party received proper notice. It is especially important for time-sensitive actions like termination notices, breach cure periods, and renewal deadlines. Fill in the addresses before execution and update them whenever contact information changes.`,
  },
];
