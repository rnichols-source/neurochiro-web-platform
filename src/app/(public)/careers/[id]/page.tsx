import { getJobById } from "../actions";
import JobDetailClient from "./JobDetailClient";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    return (
      <div className="min-h-dvh bg-neuro-cream pt-32 text-center">
        <h1 className="text-2xl font-bold text-neuro-navy">Job not found</h1>
        <p className="text-gray-500 mt-2">This listing may have been removed or expired.</p>
      </div>
    );
  }

  return <JobDetailClient job={job} />;
}
