import { Suspense } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";

export const dynamic = 'force-dynamic';

export default async function PublicDirectory() {
  const initialData = await getDoctors({ regionCode: 'US', limit: 100 });

  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <DirectoryContent initialData={initialData} />
    </Suspense>
  );
}
