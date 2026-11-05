import type { Metadata } from "next";
import { getRequestDictionary } from "@/i18n/get-locale";
import { LocaleLink as Link } from "@/i18n/LocaleLink";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestDictionary();
  return { title: t.meta.notFoundTitle };
}

export default async function DoctorNotFound() {
  const { t } = await getRequestDictionary();
  return (
    <div style={{ minHeight: "70vh", background: "#F5F3EF", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D66829", marginBottom: 12 }}>NeuroChiro</p>
        <h1 style={{ fontFamily: "Lato, sans-serif", fontSize: 36, fontWeight: 900, color: "#1E2D3B", lineHeight: 1.15 }}>{t.meta.notFoundTitle.replace(" | NeuroChiro", "")}</h1>
        <p style={{ color: "#718096", marginTop: 12, lineHeight: 1.6, fontSize: 15 }}>
          {t.profile.notFoundBody}
        </p>
        <Link href="/directory" style={{ display: "inline-block", marginTop: 24, background: "#D66829", color: "white", fontWeight: 800, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}>
          {t.profile.browseDirectory}
        </Link>
      </div>
    </div>
  );
}
