import { Suspense } from "react";
import type { Metadata } from "next";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { languageAlternates } from "@/i18n/alternates";
import { getRequestDictionary } from "@/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getRequestDictionary();
  return {
    title: t.meta.directoryTitle,
    description: t.meta.directoryDescription,
    alternates: languageAlternates("/directory", locale),
  };
}

// Dynamic because getDoctors uses cookies for Supabase auth
export const dynamic = 'force-dynamic';

export default async function PublicDirectory() {
  const { t } = await getRequestDictionary();
  // Don't pre-load a national list of all doctors.
  // A patient can't act on 148 unsorted results.
  // The client fetches doctors after a location is entered.
  const initialData = { doctors: [], total: 0 };

  return (
    <ErrorBoundary title={t.directory.errorTitle}>
      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent initialData={initialData} />
      </Suspense>
    </ErrorBoundary>
  );
}
