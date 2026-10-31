/**
 * Old digital-product ids that used to live at /store/[id].
 * Keep this list in sync with STORE_PRODUCTS in store-data.ts.
 * If a Shopify merch handle ever matches one of these, remove that id
 * so the Shopify product page wins over the redirect.
 */
export const LEGACY_STORE_PRODUCT_IDS = [
  "course-clinical-identity",
  "course-business",
  "course-clinical-confidence",
  "course-associate-playbook",
  "course-bundle",
  "student-financial-planner",
  "technique-guide",
  "interview-playbook",
  "workshop-stress-sleep",
  "workshop-pediatric",
  "workshop-corporate",
  "workshop-dinner",
  "workshop-reactivation",
  "workshop-bundle",
  "contract-basic",
  "contract-standard",
  "contract-employment",
  "contract-bundle",
  "pl-analyzer",
  "billing-guide",
  "scan-report",
  "kpi-tracker",
  "content-library",
  "screening-mastery",
  "patient-premium",
  "patient-ns-guide",
  "patient-family-guide",
  "patient-exercise-library",
  "patient-supplement-guide",
] as const;

const LEGACY_STORE_PRODUCT_ID_SET = new Set<string>(LEGACY_STORE_PRODUCT_IDS);

export function isLegacyStoreProductId(handle: string): boolean {
  return LEGACY_STORE_PRODUCT_ID_SET.has(handle);
}
