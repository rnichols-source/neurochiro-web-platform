"use client";

import { Suspense, useEffect, useState } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";

export default function PublicDirectory() {
  const [initialData, setInitialData] = useState<{ doctors: any[], total: number } | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const data = await getDoctors({ limit: 1000 });
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
    <Suspense fallback={<DirectorySkeleton />}>
      <DirectoryContent initialData={initialData} />
    </Suspense>
  );
}
