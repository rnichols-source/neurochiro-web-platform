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
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export const spotlightEpisodes: SpotlightEpisode[] = [
  {
    id: "ep-001",
    doctorName: "Dr. Jordan Wolff",
    doctorSlug: "dr.-jordan-wolff",
    clinicName: "Wolff Chiropractic",
    city: "New York City",
    state: "NY",
    videoUrl: "https://www.youtube.com/embed/brqOe37KgTU",
    thumbnail: "https://img.youtube.com/vi/brqOe37KgTU/hqdefault.jpg",
    quote: "I was adjusted the day I was born. I've never not known what it feels like to be under chiropractic care.",
    description:
      "Dr. Jordan Wolff is a second-generation chiropractor practicing in the same Midtown Manhattan office his father opened 40 years ago. Adjusted from birth, he shares why chiropractic is a way of life — not just pain relief. He talks about real patient transformations happening daily, why every pregnant woman and baby should be adjusted, and the full-circle moment of adjusting his daughter in the delivery room.",
    episodeNumber: 1,
    publishedAt: "2026-04-23T12:00:00Z",
  },
  {
    id: "ep-002",
    doctorName: "Dr. Kara Zuleg",
    doctorSlug: "dr.-kara-zuleg",
    clinicName: "Hand in Hand Chiropractic",
    city: "Mendham",
    state: "NJ",
    videoUrl: "https://www.youtube.com/embed/fx69gKEZ-y0",
    thumbnail: "https://img.youtube.com/vi/fx69gKEZ-y0/hqdefault.jpg",
    quote:
      "I received my first adjustment at just two weeks old. I've been under chiropractic care my entire life.",
    description:
      "Dr. Kara Zuleg is a second-generation chiropractic patient turned doctor, adjusted since she was just two weeks old. She opened Hand in Hand Chiropractic in Mendham, New Jersey to serve the families in her community with nervous system-based care. She shares how growing up under chiropractic shaped her path, why she's passionate about prenatal and pediatric adjustments, and what it means to walk alongside families on their health journey.",
    episodeNumber: 2,
    publishedAt: "2026-04-30T12:00:00Z",
  },
  {
    id: "ep-003",
    doctorName: "Dr. Matt Lawrence",
    doctorSlug: "dr.-matt-lawrence",
    clinicName: "AlignLife",
    city: "Cary",
    state: "NC",
    videoUrl: "https://www.youtube.com/embed/yH8wrzxt-lI",
    thumbnail: "https://img.youtube.com/vi/yH8wrzxt-lI/hqdefault.jpg",
    quote:
      "My journey into chiropractic started as a teenager when I was dealing with my own back injury. That experience changed everything.",
    description:
      "Dr. Matt Lawrence is the owner of AlignLife Preston in Cary, North Carolina, where he helps families get to the root cause of their health problems through structural restoration, functional nutrition, and neurofunctional care. A graduate of Life University, Dr. Matt shares his personal story of how a teenage back injury led him to chiropractic, why he goes beyond symptom relief to find the real issue, and how he uses x-rays, labs, and nutrition alongside adjustments to serve the whole family.",
    episodeNumber: 3,
    publishedAt: "2026-05-01T12:00:00Z",
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
