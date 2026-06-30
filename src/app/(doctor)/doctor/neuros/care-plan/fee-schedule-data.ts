// Default fee schedule data for major payers
// Amounts in cents. These are national averages and should be customized per practice during onboarding.
// Source: 2026 CMS fee schedules, payer fee schedule publications, AlignLife verified rates

export interface FeeScheduleEntry {
  payer_code: string;
  payer_name: string;
  cpt_code: string;
  allowed_amount: number; // cents
}

export const DEFAULT_FEE_SCHEDULES: FeeScheduleEntry[] = [
  // BCBS
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "98940", allowed_amount: 3200 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "98941", allowed_amount: 4800 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "98942", allowed_amount: 6400 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "98943", allowed_amount: 3600 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "97110", allowed_amount: 3400 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "97112", allowed_amount: 3200 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "97140", allowed_amount: 3200 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "97012", allowed_amount: 2000 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "97014", allowed_amount: 1600 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "97035", allowed_amount: 2200 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "99203", allowed_amount: 11500 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "99204", allowed_amount: 17000 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "99213", allowed_amount: 7500 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "72040", allowed_amount: 4200 },
  { payer_code: "BCBS", payer_name: "Blue Cross Blue Shield", cpt_code: "72100", allowed_amount: 4800 },

  // Aetna
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "98940", allowed_amount: 2800 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "98941", allowed_amount: 4200 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "98942", allowed_amount: 5600 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "98943", allowed_amount: 3200 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "97110", allowed_amount: 3000 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "97140", allowed_amount: 2800 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "97012", allowed_amount: 1800 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "99203", allowed_amount: 10500 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "99204", allowed_amount: 15500 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "72040", allowed_amount: 3800 },
  { payer_code: "AETNA", payer_name: "Aetna", cpt_code: "72100", allowed_amount: 4400 },

  // Cigna
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "98940", allowed_amount: 3000 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "98941", allowed_amount: 4500 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "98942", allowed_amount: 6000 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "97110", allowed_amount: 3200 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "97140", allowed_amount: 3000 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "97012", allowed_amount: 1900 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "99203", allowed_amount: 11000 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "72040", allowed_amount: 4000 },
  { payer_code: "CIGNA", payer_name: "Cigna", cpt_code: "72100", allowed_amount: 4600 },

  // United Healthcare
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "98940", allowed_amount: 2600 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "98941", allowed_amount: 4000 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "98942", allowed_amount: 5200 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "97110", allowed_amount: 2800 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "97140", allowed_amount: 2600 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "97012", allowed_amount: 1600 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "99203", allowed_amount: 10000 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "72040", allowed_amount: 3600 },
  { payer_code: "UNITED", payer_name: "United Healthcare", cpt_code: "72100", allowed_amount: 4200 },

  // Medicare
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "98940", allowed_amount: 2400 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "98941", allowed_amount: 3600 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "98942", allowed_amount: 4800 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "97110", allowed_amount: 2600 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "97140", allowed_amount: 2400 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "99203", allowed_amount: 9800 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "72040", allowed_amount: 3200 },
  { payer_code: "MEDICARE", payer_name: "Medicare", cpt_code: "72100", allowed_amount: 3800 },
];

export function getFeeForCode(payerCode: string, cptCode: string): number | null {
  const entry = DEFAULT_FEE_SCHEDULES.find(
    f => f.payer_code === payerCode && f.cpt_code === cptCode
  );
  return entry?.allowed_amount ?? null;
}

export function getPayerFees(payerCode: string): FeeScheduleEntry[] {
  return DEFAULT_FEE_SCHEDULES.filter(f => f.payer_code === payerCode);
}
