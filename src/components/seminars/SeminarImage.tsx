import Image from "next/image";

const ALLOWED = new Set([
  "gddapefwrmucimpdhjrz.supabase.co",
  "vpxuzoqsnshvgtukvsqy.supabase.co",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "img.youtube.com",
  "cdn.shopify.com",
]);

export function SeminarImage({ src, alt, priority = false, className = "" }: { src: string | null; alt: string; priority?: boolean; className?: string }) {
  if (!src) return <div className={`bg-neuro-navy ${className}`} aria-hidden="true" />;
  let host = "";
  try { host = new URL(src).hostname; } catch { host = ""; }
  if (ALLOWED.has(host)) {
    return <Image src={src} alt={alt} fill priority={priority} className={`object-cover ${className}`} sizes="(max-width: 1024px) 100vw, 33vw" />;
  }
  return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
}
