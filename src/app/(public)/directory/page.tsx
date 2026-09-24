import { Suspense } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export const metadata = {
  title: "Doctor Directory | NeuroChiro",
  description: "Browse 140+ verified nervous system chiropractors worldwide. Search by city, state, or specialty.",
};

// Dynamic because getDoctors uses cookies for Supabase auth
export const dynamic = 'force-dynamic';

export default async function PublicDirectory() {
  // Don't pre-load a national list of all doctors.
  // A patient can't act on 148 unsorted results.
  // The client fetches doctors after a location is entered.
  const initialData = { doctors: [], total: 0 };

  return (
    <ErrorBoundary title="Directory Content Error">
      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent initialData={initialData} />
      </Suspense>
    </ErrorBoundary>
  );
}
