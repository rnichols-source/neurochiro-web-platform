export type RegionCode = "US" | "AU" | "CA" | "UK" | "NZ" | "EU" | "ALL";

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
  CA: {
    code: "CA",
    label: "Canada",
    flag: "\u{1F1E8}\u{1F1E6}",
    currency: { code: "CAD", symbol: "C$" },
    pricing: {
      doctor: { starter: { monthly: "65", annual: "650" }, growth: { monthly: "99", annual: "990" }, pro: { monthly: "199", annual: "1990" } },
      student: { foundation: { monthly: "12", annual: "120" }, professional: { monthly: "35", annual: "350" }, accelerator: { monthly: "79", annual: "790" } },
    },
    terminology: { postalCode: "Postal Code", state: "Province" },
    mapDefaults: { center: [-96.8, 56.1], zoom: 3 },
  },
  UK: {
    code: "UK",
    label: "United Kingdom",
    flag: "\u{1F1EC}\u{1F1E7}",
    currency: { code: "GBP", symbol: "\u00A3" },
    pricing: {
      doctor: { starter: { monthly: "39", annual: "390" }, growth: { monthly: "79", annual: "790" }, pro: { monthly: "159", annual: "1590" } },
      student: { foundation: { monthly: "7", annual: "70" }, professional: { monthly: "25", annual: "250" }, accelerator: { monthly: "59", annual: "590" } },
    },
    terminology: { postalCode: "Postcode", state: "County" },
    mapDefaults: { center: [-3.4, 55.4], zoom: 5 },
  },
  NZ: {
    code: "NZ",
    label: "New Zealand",
    flag: "\u{1F1F3}\u{1F1FF}",
    currency: { code: "NZD", symbol: "NZ$" },
    pricing: {
      doctor: { starter: { monthly: "79", annual: "790" }, growth: { monthly: "149", annual: "1490" }, pro: { monthly: "299", annual: "2990" } },
      student: { foundation: { monthly: "15", annual: "150" }, professional: { monthly: "55", annual: "550" }, accelerator: { monthly: "119", annual: "1190" } },
    },
    terminology: { postalCode: "Postcode", state: "Region" },
    mapDefaults: { center: [174.8, -41.3], zoom: 5 },
  },
  EU: {
    code: "EU",
    label: "Europe",
    flag: "\u{1F1EA}\u{1F1FA}",
    currency: { code: "EUR", symbol: "\u20AC" },
    pricing: {
      doctor: { starter: { monthly: "45", annual: "450" }, growth: { monthly: "89", annual: "890" }, pro: { monthly: "179", annual: "1790" } },
      student: { foundation: { monthly: "9", annual: "90" }, professional: { monthly: "30", annual: "300" }, accelerator: { monthly: "69", annual: "690" } },
    },
    terminology: { postalCode: "Postal Code", state: "Region" },
    mapDefaults: { center: [10.5, 51.1], zoom: 4 },
  },
  ALL: {
    code: "ALL",
    label: "Global",
    flag: "\u{1F30D}",
    currency: { code: "USD", symbol: "$" },
    pricing: {
      doctor: { starter: { monthly: "49", annual: "490" }, growth: { monthly: "99", annual: "990" }, pro: { monthly: "199", annual: "1990" } },
      student: { foundation: { monthly: "9", annual: "90" }, professional: { monthly: "35", annual: "350" }, accelerator: { monthly: "79", annual: "790" } },
    },
    terminology: { postalCode: "Postal Code", state: "Region" },
    mapDefaults: { center: [0, 20], zoom: 2 },
  },
};

export const DEFAULT_REGION = REGIONS.US;
