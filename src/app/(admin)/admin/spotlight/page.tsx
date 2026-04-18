import Link from "next/link";
import { spotlightEpisodes } from "@/app/(public)/spotlight/spotlight-data";

export const metadata = {
  title: "Spotlight Management | Admin",
};

export default function AdminSpotlightPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Spotlight Episodes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage NeuroChiro Spotlight interviews. {spotlightEpisodes.length} episodes total.
          </p>
        </div>
        <Link
          href="/spotlight"
          target="_blank"
          className="px-4 py-2 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
        >
          View Public Page
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-left">
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">EP</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Doctor</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Clinic</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Location</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Published</th>
              <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Video</th>
            </tr>
          </thead>
          <tbody>
            {spotlightEpisodes.map((ep) => (
              <tr key={ep.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-5 py-4">
                  <span className="bg-neuro-orange/20 text-neuro-orange text-xs font-black px-2 py-1 rounded">
                    {String(ep.episodeNumber).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-white">{ep.doctorName}</td>
                <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{ep.clinicName}</td>
                <td className="px-5 py-4 text-gray-400 hidden md:table-cell">
                  {ep.city}, {ep.state}
                </td>
                <td className="px-5 py-4 text-gray-400 hidden lg:table-cell">
                  {new Date(ep.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4">
                  <a
                    href={ep.videoUrl.replace("/embed/", "/watch?v=")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neuro-orange text-xs font-bold hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-gray-400 text-sm">
          To add a new episode, update the seed data in{" "}
          <code className="text-neuro-orange bg-white/5 px-1.5 py-0.5 rounded text-xs">
            src/app/(public)/spotlight/spotlight-data.ts
          </code>{" "}
          — Supabase integration coming soon.
        </p>
      </div>
    </div>
  );
}
