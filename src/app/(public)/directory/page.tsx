import { Suspense } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";
import DirectorySkeleton from "@/components/directory/DirectorySkeleton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicDirectory() {
  const initialData = await getDoctors({ limit: 1000 });

  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <DirectoryContent initialData={initialData} />
    </Suspense>
  );
}
