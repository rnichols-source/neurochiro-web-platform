export interface SpotlightEpisode {
  id: string;
  doctorName: string;
  doctorSlug: string;
  clinicName: string;
  city: string;
  state: string;
  videoUrl: string;
  thumbnail: string;
  quote: string;
  description: string;
  episodeNumber: number;
  publishedAt: string;
}

export function getYouTubeThumbnail(videoUrl: string): string {
  const match = videoUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  const videoId = match ? match[1] : "";
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export const spotlightEpisodes: SpotlightEpisode[] = [
  {
    id: "ep-001",
    doctorName: "Dr. Dakota Turgeon",
    doctorSlug: "dakota-turgeon",
    clinicName: "Envision Chiropractic",
    city: "Bellingham",
    state: "WA",
    videoUrl: "https://www.youtube.com/embed/aPeMroYs4Vg",
    thumbnail: getYouTubeThumbnail("https://www.youtube.com/embed/aPeMroYs4Vg"),
    quote: "We don't do crack and go. We want to make sure we're the right solution for them — and if we're not, we'll be brutally honest about it.",
    description:
      "Dr. Dakota Turgeon of Envision Chiropractic in Bellingham, WA breaks down what sets his practice apart from the typical chiropractic office. He talks about taking the time to do thorough exams before ever adjusting, finding the root cause instead of chasing symptoms, and building a practice culture centered on honesty and personalized care.",
    episodeNumber: 1,
    publishedAt: "2026-04-17T12:00:00Z",
  },
];

export function getLatestEpisode(): SpotlightEpisode {
  return spotlightEpisodes[spotlightEpisodes.length - 1];
}

export function getEpisodeById(id: string): SpotlightEpisode | undefined {
  return spotlightEpisodes.find((ep) => ep.id === id);
}

export function getEpisodeByDoctorSlug(slug: string): SpotlightEpisode | undefined {
  return spotlightEpisodes.find((ep) => ep.doctorSlug === slug);
}
