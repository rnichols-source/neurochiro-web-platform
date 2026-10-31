"use client";

export function MapHover({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div
      onMouseEnter={() => {
        const frame = document.getElementById("network-map-iframe") as HTMLIFrameElement | null;
        frame?.contentWindow?.postMessage({ type: "focus-seminar", slug }, window.location.origin);
      }}
      onClick={() => {
        const frame = document.getElementById("network-map-iframe") as HTMLIFrameElement | null;
        frame?.contentWindow?.postMessage({ type: "focus-seminar", slug }, window.location.origin);
      }}
    >
      {children}
    </div>
  );
}
