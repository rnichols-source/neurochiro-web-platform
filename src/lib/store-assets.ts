import "server-only";
import fs from "node:fs";
import path from "node:path";

const STORE_FILES = {
  heroDesktop: "hero_desktop_2400x1000.jpg",
  heroMobile: "hero_mobile_1080x1350.jpg",
  corduroy: "banner_corduroy_fall_2400x1350.jpg",
  flatlay: "banner_flatlay_2400x1350.jpg",
} as const;

export type StoreAssetName = keyof typeof STORE_FILES;

export function publicStoreImage(name: StoreAssetName): string | null {
  const file = STORE_FILES[name];
  const absolute = path.join(process.cwd(), "public", "store", file);
  return fs.existsSync(absolute) ? `/store/${file}` : null;
}
