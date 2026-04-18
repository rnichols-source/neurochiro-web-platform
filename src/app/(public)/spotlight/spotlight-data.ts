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
  const videoId = match ? match[1] : "dQw4w9WgXcQ";
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export const spotlightEpisodes: SpotlightEpisode[] = [
  {
    id: "ep-001",
    doctorName: "Dr. Sarah Mitchell",
    doctorSlug: "sarah-mitchell",
    clinicName: "NeuroVital Chiropractic",
    city: "Austin",
    state: "TX",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: getYouTubeThumbnail("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    quote: "When you adjust the nervous system, you don't just fix pain — you unlock potential.",
    description:
      "Dr. Sarah Mitchell shares how she transitioned from traditional chiropractic to a nervous system-first approach, and the patient transformations that followed. She breaks down her scanning protocol and why objective data changed everything for her practice.",
    episodeNumber: 1,
    publishedAt: "2026-03-15T12:00:00Z",
  },
  {
    id: "ep-002",
    doctorName: "Dr. James Carter",
    doctorSlug: "james-carter",
    clinicName: "Thrive Neuro Spine",
    city: "Denver",
    state: "CO",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: getYouTubeThumbnail("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    quote: "The scan doesn't lie. When patients see their own nervous system on screen, everything clicks.",
    description:
      "Dr. James Carter talks about building a multi-doctor nervous system practice from scratch. From hiring the right associates to creating a culture of accountability, James shares the playbook that took his clinic from startup to seven figures.",
    episodeNumber: 2,
    publishedAt: "2026-03-29T12:00:00Z",
  },
  {
    id: "ep-003",
    doctorName: "Dr. Maria Gonzalez",
    doctorSlug: "maria-gonzalez",
    clinicName: "Elevate Neurological Wellness",
    city: "Miami",
    state: "FL",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: getYouTubeThumbnail("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    quote: "I became a chiropractor to change lives, not just crack backs. Nervous system care is the difference.",
    description:
      "Dr. Maria Gonzalez opens up about serving the underserved communities of Miami with nervous system chiropractic. She discusses her bilingual practice model, community workshops, and why accessibility is at the heart of everything she does.",
    episodeNumber: 3,
    publishedAt: "2026-04-10T12:00:00Z",
  },
  {
    id: "ep-004",
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
    episodeNumber: 4,
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
