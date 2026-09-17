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
    doctorSlug: "dr.-matthew-lawrence",
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
  {
    id: "ep-004",
    doctorName: "Dr. Maryanne Shiozawa",
    doctorSlug: "maryanne-shiozawa",
    clinicName: "Shiozawa Wellness",
    city: "London",
    state: "UK",
    videoUrl: "https://www.youtube.com/embed/2ftGcUjed4I",
    thumbnail: "https://img.youtube.com/vi/2ftGcUjed4I/hqdefault.jpg",
    quote:
      "The more I do this, the more I want and the more I learn. And the less I feel like I know. That's a level of mastery.",
    description:
      "Dr. Maryanne Shiozawa is a NetworkSpinal practitioner based in London — and the first NeuroChiro member in the UK. With nearly 30 years in practice, she shares a powerful story of a single mother who went from bedridden and planning to end her life to completely transforming her health through chiropractic care. Dr. Maryanne talks about why chiropractic is rooted in salutogenesis, how she tests primitive reflexes and brain function in children, and why parents should trust their intuition when something feels off with their child.",
    episodeNumber: 4,
    publishedAt: "2026-05-04T12:00:00Z",
  },
  {
    id: "ep-005",
    doctorName: "Dr. Haley Turpin",
    doctorSlug: "dr.-haley-turpin",
    clinicName: "Blue Oak Family Chiropractic",
    city: "Broomfield",
    state: "CO",
    videoUrl: "https://www.youtube.com/embed/-GW1c3mayFA",
    thumbnail: "https://img.youtube.com/vi/-GW1c3mayFA/hqdefault.jpg",
    quote:
      "For the first time in my life, someone with so much confidence said the body was designed to heal. And not just from sports injuries. I was like, why have I never heard this before?",
    description:
      "Dr. Haley Turpin is the owner of Blue Oak Family Chiropractic in Broomfield, Colorado, located between Denver and Boulder. She shares how losing her mom to suicide led her to discover chiropractic and the body's innate ability to heal. Dr. Haley tells the story of an 8-year-old patient who came in for bedwetting and ended up eating a cookie at a birthday party with no stomach issues for the first time. With over 5 years in practice and one year owning her own clinic, she leads with curiosity and believes the adjustment starts when you walk out the door.",
    episodeNumber: 5,
    publishedAt: "2026-09-09T12:00:00Z",
  },
  {
    id: "ep-006",
    doctorName: "Dr. Ryan Maxwell",
    doctorSlug: "ryan-maxwell",
    clinicName: "Silver Lining Chiropractic",
    city: "Park Ridge",
    state: "IL",
    videoUrl: "https://www.youtube.com/embed/naF6AlnXNvI",
    thumbnail: "https://img.youtube.com/vi/naF6AlnXNvI/hqdefault.jpg",
    quote:
      "Somebody needs to stop this. Our kids are growing up sicker than ever. Somebody needs to get ahead of it rather than behind it.",
    description:
      "Dr. Ryan Maxwell is the owner of Silver Lining Chiropractic in Park Ridge, Illinois, just outside Chicago. A former college baseball player at Monmouth, he discovered chiropractic after an ankle injury that PT couldn't fully resolve. He opened his practice in November 2020 and has built a 3-doctor team with nearly 400 five-star Google reviews and Best Chiropractor of Park Ridge four years running. With 60% of his patients being pediatric and prenatal, Dr. Ryan shares why birth is one of the most stressful events on a baby's nervous system, how INSiGHT scans change the conversation with families, and why he's on a mission to make kids healthier than ever.",
    episodeNumber: 6,
    publishedAt: "2026-09-15T12:00:00Z",
  },
  {
    id: "ep-007",
    doctorName: "Dr. Brittany Perez",
    doctorSlug: "brittany-perez",
    clinicName: "AlignLife Wellington",
    city: "Wellington",
    state: "FL",
    videoUrl: "https://www.youtube.com/embed/4xwERaHW3WQ",
    thumbnail: "https://img.youtube.com/vi/4xwERaHW3WQ/hqdefault.jpg",
    quote:
      "You can't medicate your way out of something you behaved your way into.",
    description:
      "Dr. Brittany Perez is the owner of AlignLife Wellington in Wellington, Florida. Her journey into chiropractic started through CrossFit, where she discovered that the nervous system was the biggest piece of health and recovery. Now with four years in practice, she shares powerful patient stories, including a woman with a full spinal fusion who found a way to tell her family she loves coming to the office, and an older patient who walked in with a cane and started swinging it on the way out. Dr. Brittany talks about why chiropractors are educators above all things, why healing is a \"done with you\" process, and how she built her office to feel like a community, not a doctor's office.",
    episodeNumber: 7,
    publishedAt: "2026-09-17T12:00:00Z",
  },
  {
    id: "ep-008",
    doctorName: "Dr. Frank Kaden",
    doctorSlug: "dr-frank-kaden",
    clinicName: "Frank E. Kaden, D.C. Chiropractic",
    city: "Redondo Beach",
    state: "CA",
    videoUrl: "https://www.youtube.com/embed/DdUSc6iR68w",
    thumbnail: "https://img.youtube.com/vi/DdUSc6iR68w/hqdefault.jpg",
    quote:
      "I have never cured anybody of anything. But I have given their bodies the opportunity to cure themselves.",
    description:
      "Dr. Frank Kaden has been in practice for 28 years in Redondo Beach, California. A competitive swimmer for 20 years, he discovered chiropractic when a teammate training for the 1988 Olympics healed her shoulder without surgery. Now a certified instructor in Zone Technique, one of only 20 in the world, he shares incredible patient stories: a man who forgot his oxygen generator after one visit, a patient who avoided a kidney transplant, and people with frozen shoulders regaining full range of motion in minutes. He also shares his own healing journey, recovering from 5% to 85% vision in his left eye through Zone Technique. After 28 years, Dr. Kaden says chiropractic is not a job, it is a calling.",
    episodeNumber: 8,
    publishedAt: "2026-09-17T12:00:00Z",
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
