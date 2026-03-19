export type RegionCode = "US" | "AU";

export interface RegionConfig {
  code: RegionCode;
  label: string;
  flag: string;
  currency: {
    code: string;
    symbol: string;
  };
  pricing: {
    doctor: {
      starter: { monthly: string; annual: string };
      growth: { monthly: string; annual: string };
      pro: { monthly: string; annual: string };
    };
    student: {
      foundation: { monthly: string; annual: string };
      professional: { monthly: string; annual: string };
      accelerator: { monthly: string; annual: string };
    };
  };
  terminology: {
    postalCode: string;
    state: string;
  };
  mapDefaults: {
    center: [number, number];
    zoom: number;
  };
}

export const REGIONS: Record<RegionCode, RegionConfig> = {
  US: {
    code: "US",
    label: "United States",
    flag: "🇺🇸",
    currency: {
      code: "USD",
      symbol: "$",
    },
    pricing: {
      doctor: {
        starter: { monthly: "49", annual: "490" },
        growth: { monthly: "99", annual: "990" },
        pro: { monthly: "199", annual: "1990" },
      },
      student: {
        foundation: { monthly: "12", annual: "120" },
        professional: { monthly: "35", annual: "350" },
        accelerator: { monthly: "79", annual: "790" },
      }
    },
    terminology: {
      postalCode: "Zip Code",
      state: "State",
    },
    mapDefaults: {
      center: [-98.5795, 39.8283], // Geometric center of US
      zoom: 4,
    },
  },
  AU: {
    code: "AU",
    label: "Australia",
    flag: "🇦🇺",
    currency: {
      code: "AUD",
      symbol: "A$",
    },
    pricing: {
      doctor: {
        starter: { monthly: "79", annual: "790" },
        growth: { monthly: "149", annual: "1490" },
        pro: { monthly: "299", annual: "2990" },
      },
      student: {
        foundation: { monthly: "19", annual: "190" },
        professional: { monthly: "55", annual: "550" },
        accelerator: { monthly: "119", annual: "1190" },
      }
    },
    terminology: {
      postalCode: "Postcode",
      state: "State / Territory",
    },
    mapDefaults: {
      center: [133.7751, -25.2744], // Center of Australia
      zoom: 4,
    },
  },
};

export const DEFAULT_REGION = REGIONS.US;
