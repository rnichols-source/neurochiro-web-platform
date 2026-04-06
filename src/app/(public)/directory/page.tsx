"use client";

import { Suspense, useEffect, useState } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export default function PublicDirectory() {
  const [initialData, setInitialData] = useState<{ doctors: any[], total: number } | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const data = await getDoctors({ limit: 20 });
        setInitialData(data);
      } catch (err) {
        console.error('Directory initial fetch failed:', err);
      }
    }
    fetchInitialData();
  }, []);

  if (!initialData) {
    return <DirectorySkeleton />;
  }

  return (
    <ErrorBoundary title="Directory Content Error">
      <Suspense fallback={<DirectorySkeleton />}>
        <DirectoryContent initialData={initialData} />
      </Suspense>
    </ErrorBoundary>
  );
}
