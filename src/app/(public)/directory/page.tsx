"use client";

import { Suspense, useEffect, useState } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";

export default function PublicDirectory() {
  const [initialData, setInitialData] = useState<{ doctors: any[], total: number } | null>(null);

  useEffect(() => {
    console.log('📡 [PAGE_DEBUG] Initializing Directory Page (Client-Side)...');
    async function fetchInitialData() {
      console.log('📡 [PAGE_DEBUG] Starting initial fetch (MINIMAL)...');
      try {
        const data = await getDoctors({ limit: 100 });
        console.log('CLIENT_RECEIVE (INITIAL):', data.doctors.length);
        setInitialData(data);
      } catch (err) {
        console.error('❌ [PAGE_DEBUG] Fetch failed:', err);
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
