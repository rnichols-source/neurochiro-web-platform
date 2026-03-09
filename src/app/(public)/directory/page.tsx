import { Suspense } from "react";
import DirectoryContent from "./DirectoryContent";
import { getDoctors } from "./actions";

export default async function PublicDirectory() {
  const initialData = await getDoctors({ regionCode: 'US', limit: 100 });

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neuro-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuro-orange"></div>
      </div>
    }>
      <DirectoryContent initialData={initialData} />
    </Suspense>
  );
}
