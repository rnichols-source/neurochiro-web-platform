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
  /** Homepage "Meet the doctors" prefers these episodes. */
  patientFacing?: boolean;
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
    doctorSlug: "jordan-wolff",
    clinicName: "Sutton Place Chiropractic",
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
    doctorSlug: "kara-zuleg",
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
    doctorSlug: "matthew-lawrence",
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
    videoUrl: "https://www.youtube.com/embed/2ftGcUjed4I?rel=0",
    thumbnail: "https://img.youtube.com/vi/2ftGcUjed4I/maxresdefault.jpg",
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
    doctorSlug: "haley-turpin",
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
    patientFacing: true,
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
      "Dr. Frank Kaden has been in practice for 28 years in Redondo Beach, California. A competitive swimmer for 20 years, he discovered chiropractic when a teammate's shoulder injury was resolved without surgery. Now a certified instructor in Zone Technique, one of only 20 in the world, Dr. Kaden shares what drew him to this approach, how it changed his own health, and why he believes the body's natural state is health. After 28 years, he says chiropractic is not a job, it is a calling.",
    episodeNumber: 8,
    publishedAt: "2026-09-17T12:00:00Z",
  },
  {
    id: "ep-009",
    doctorName: "Dr. Alisha Davis",
    doctorSlug: "dr-alisha-davis",
    clinicName: "Davis Family Chiropractic",
    city: "Raleigh",
    state: "NC",
    videoUrl: "https://www.youtube.com/embed/u6Zaqn8NXFo",
    thumbnail: "https://img.youtube.com/vi/u6Zaqn8NXFo/hqdefault.jpg",
    quote:
      "I love having a child's nervous system in my hands to be able to impact their life from birth on.",
    description:
      "Dr. Alisha Davis has been in practice for 28 years at Davis Family Chiropractic in Raleigh, North Carolina. A second-generation chiropractor with her dad and sister both in the profession, she earned her ICPA Diplomate in Pediatrics after her own son was diagnosed with sensory processing disorder, becoming one of only four in the state. She shares the story of a patient who lost his job and marriage to vertigo before chiropractic care turned his life around, why only 10% of the nervous system feels pain, and her full-circle vision of one day adjusting babies she cared for through pregnancy and into parenthood.",
    episodeNumber: 9,
    publishedAt: "2026-09-25T12:00:00Z",
  },
  {
    id: "ep-010",
    doctorName: "Dr. Johnny Cooper",
    doctorSlug: "dr-johnny-cooper",
    clinicName: "Resilient Chiropractic",
    city: "Altamonte Springs",
    state: "FL",
    videoUrl: "https://www.youtube.com/embed/R_EUBVAs4tw",
    thumbnail: "https://img.youtube.com/vi/R_EUBVAs4tw/hqdefault.jpg",
    quote:
      "When I learned that chiropractic is about healing the body naturally, I was like, this is what I want to do.",
    description:
      "Dr. Johnny Cooper is the owner of Resilient Chiropractic in Altamonte Springs, Florida, about 20 minutes north of Orlando. A Palmer College graduate, he discovered chiropractic through a high school shadowing assignment where he unknowingly ended up in the office of a distant relative, who later presented his diploma at graduation. Dr. Cooper practices Gonstead Technique using nervoscope instrumentation and x-ray analysis. He shares the story of a nonverbal 9-year-old who went three days without Miralax after a single adjustment, and why chiropractic is about helping the body function better now and for the future.",
    episodeNumber: 10,
    publishedAt: "2026-09-26T12:00:00Z",
  },
  {
    id: "ep-011",
    doctorName: "Dr. Danika Phillips",
    doctorSlug: "danika-phillips",
    clinicName: "Fika Chiropractic",
    city: "Oakland",
    state: "CA",
    videoUrl: "https://www.youtube.com/embed/YJ0rWIw15R4",
    thumbnail: "https://img.youtube.com/vi/YJ0rWIw15R4/hqdefault.jpg",
    quote:
      "I heard 'I love you' in my office for the very first time to mom. That always melts my heart.",
    description:
      "Dr. Danika Phillips is the founder of Fika Chiropractic in Oakland, California. A former Canadian hockey player, she experienced a complete health breakdown during chiropractic school that forced her to step away for a quarter. That crisis led her to nervous system focused care and changed everything about how she practices. Now specializing in pediatric and prenatal care, she shares the story of her first complex pediatric case, an autistic child who slept through the night after one adjustment, a child who said 'I love you' for the first time in her office, and why Fika means taking a pause from your day to focus on your health.",
    episodeNumber: 11,
    patientFacing: true,
    publishedAt: "2026-10-07T12:00:00Z",
  },
  {
    id: "ep-012",
    doctorName: "Dr. Devin DiCenzo",
    doctorSlug: "dr-devin-dicenzo",
    clinicName: "Lighthouse Family Chiropractic",
    city: "Mount Pleasant",
    state: "SC",
    videoUrl: "https://www.youtube.com/embed/_341ojIYcT8",
    thumbnail: "https://img.youtube.com/vi/_341ojIYcT8/hqdefault.jpg",
    quote:
      "Don't stop chiropractic. — A nonverbal child's message to his mom after learning to communicate through a spelling program.",
    description:
      "Dr. Devin DiCenzo is the founder of Lighthouse Family Chiropractic in Mount Pleasant, South Carolina, just outside Charleston. A Life University graduate and PX Doc, he specializes in pediatric and family nervous system care with a focus on neurodevelopmental cases including autism, ADHD, seizures, and sensory processing disorders. He shares the story of Declan, a nonverbal autistic child who now communicates and told his mom not to stop chiropractic, a child with grand mal seizures who is 8 months seizure-free, and why adults are just big kids who need the same care.",
    episodeNumber: 12,
    patientFacing: true,
    publishedAt: "2026-10-08T12:00:00Z",
  },
  {
    id: "ep-013",
    doctorName: "Dr. Roger Brady",
    doctorSlug: "roger-brady",
    clinicName: "Optimal Life Chiropractic",
    city: "Oakdale",
    state: "MN",
    videoUrl: "https://www.youtube.com/embed/uZAnAzkCCs0",
    thumbnail: "https://img.youtube.com/vi/uZAnAzkCCs0/hqdefault.jpg",
    quote: "No Gimmicks. Just Honest Care.",
    description:
      "Dr. Roger Brady is the founder of Optimal Life Chiropractic in Oakdale, Minnesota, a family practice focused on pediatric, prenatal, and infant care. A Cleveland University graduate, he practices Torque Release Technique and looks at the whole nervous system, including cranial care. He shares how a bad first chiropractic visit at 12 shaped the way he practices today — assess first, every time — the clinic visit that made him want to be a neurologically focused chiropractor, why having kids of his own changed his heart and his practice, and his family's journey with their daughter's mouth breathing that led him into cranial work.",
    episodeNumber: 13,
    publishedAt: "2026-10-09T12:00:00Z",
  },
  {
    id: "ep-014",
    doctorName: "Dr. Andrew Burd",
    doctorSlug: "andrew-burd",
    clinicName: "The Foundry Chiropractic & Upper Cervical",
    city: "Nashville",
    state: "TN",
    videoUrl: "https://www.youtube.com/embed/1zaxVwtZTWE",
    thumbnail: "https://img.youtube.com/vi/1zaxVwtZTWE/hqdefault.jpg",
    quote: "Health Is a Rhythm",
    description:
      "Dr. Andrew Burd is the owner and clinic director of The Foundry Chiropractic & Upper Cervical in Nashville, Tennessee. A Palmer College of Chiropractic graduate, he has advanced training in Tonal Chiropractic Analysis and Tonal Pediatrics, specializes in upper cervical care, is certified in the Webster Technique, and was named the Tennessee Chiropractic Association's Rising Chiropractor of the Year. He shares how a sports injury, a music career, and a persistent chiropractor in Chicago led him back to chiropractic, what upper cervical care focuses on, how tonal work and upper cervical care fit together, what Webster care looks like at The Foundry, the story behind the name, and why he sees health as a rhythm, not a finish line.",
    episodeNumber: 14,
    publishedAt: "2026-10-10T12:00:00Z",
  },
  {
    id: "ep-015",
    doctorName: "Dr. Kaylee Conlan",
    doctorSlug: "kaylee-conlan",
    clinicName: "Salt + Light Waco",
    city: "Waco",
    state: "TX",
    videoUrl: "https://www.youtube.com/embed/LswG5y6iUfI",
    thumbnail: "https://img.youtube.com/vi/LswG5y6iUfI/hqdefault.jpg",
    quote: "Common Isn't Normal",
    description:
      "Dr. Kaylee Conlan is the founder of Salt + Light Waco in Waco, Texas, a family practice focused on pediatric, prenatal, and perinatal care and nervous system regulation. A second-generation chiropractor and ICPA member, she studied neuroscience and psychology before chiropractic school. She shares what it was like growing up adjusted by her chiropractor dad, the Dallas chiropractor she shadowed who showed her how a mom could build a practice of her own, why her office focuses on nervous system regulation rather than chasing symptoms, how Insight scans and HRV help track progress, what a gentle first visit looks like for a newborn, the verse behind the name Salt + Light, and why common doesn't have to mean normal.",
    episodeNumber: 15,
    publishedAt: "2026-10-11T12:00:00Z",
  },
  {
    id: "ep-016",
    doctorName: "Dr. Reid Doyle",
    doctorSlug: "reid-doyle",
    clinicName: "Monarch Chiropractic",
    city: "Kalispell",
    state: "MT",
    videoUrl: "https://www.youtube.com/embed/t6WhhCaYF88",
    thumbnail: "https://img.youtube.com/vi/t6WhhCaYF88/hqdefault.jpg",
    quote: "I'm here to help you do more, not do less.",
    description:
      "Dr. Reid Doyle is the chiropractor behind Monarch Chiropractic in Kalispell, Montana, where he blends upper cervical and corrective care with extremity work for families, athletes, and kids. He earned his Doctor of Chiropractic from Cleveland University–Kansas City and is Webster Technique certified. He shares how a doctor's \"so what\" about his grandmother's pain meds pulled him away from pharmacy school and toward chiropractic, the mission trip to El Salvador that showed him what's possible, what it's like building a nervous system practice in a small Montana town, the bull elk behind the name Monarch, what a first visit and day-two report of findings look like, and why a big guy can still have the gentlest touch.",
    episodeNumber: 16,
    publishedAt: "2026-10-12T12:00:00Z",
  },
  {
    id: "ep-017",
    doctorName: "Dr. Alex Lee",
    doctorSlug: "alex-lee",
    clinicName: "Circadian Chiropractic & Sport",
    city: "Sarasota",
    state: "FL",
    videoUrl: "https://www.youtube.com/embed/5l3AXiHf2wk",
    thumbnail: "https://img.youtube.com/vi/5l3AXiHf2wk/hqdefault.jpg",
    quote: "Be a Chiropractor",
    description:
      "Dr. Alex Lee is the founder of Circadian Chiropractic & Sport in Sarasota, Florida, serving families and athletes across Sarasota, Bradenton, and Lakewood Ranch. He earned his Doctor of Chiropractic from Life Chiropractic College West, played college baseball at Wofford, and is a NeuFit provider. He shares how an injury at the end of his college baseball career led him through ten different professionals before chiropractic finally made sense, why he walked away from a player-coach offer in Europe to go to chiropractic school, how he cares for whole families and the young athletes from nearby IMG Academy, what corrective care means in his office, the story behind the name Circadian, and his message to teens and twenty-somethings: be a chiropractor.",
    episodeNumber: 17,
    publishedAt: "2026-10-13T12:00:00Z",
  },
  {
    id: "ep-018",
    doctorName: "Dr. Anthony Cutting",
    doctorSlug: "dr-anthony-cutting",
    clinicName: "Active Chiropractic Meridian",
    city: "Meridian",
    state: "ID",
    videoUrl: "https://www.youtube.com/embed/mmeDCYPtoFk",
    thumbnail: "https://img.youtube.com/vi/mmeDCYPtoFk/hqdefault.jpg",
    quote: "There's Hope",
    description:
      "Dr. Anthony Cutting is the chiropractor behind Active Chiropractic Meridian in Meridian, Idaho, caring for families and athletes across the Treasure Valley. He earned his Doctor of Chiropractic from University of Western States in 2012, trained in Zone Technique under its founder, and uses Active Release Technique. He shares his own health journey, including losing his hearing as a teenager and later going deaf in both ears, how losing the chance to become an Air Force pilot pointed him toward chiropractic, discovering Zone Technique in 2017, his ten years in practice in Eugene, Oregon, what to expect on a first visit, adjusting his four kids since the night they were born, and his mission to show people there is hope and that life can be beautiful.",
    episodeNumber: 18,
    publishedAt: "2026-10-14T12:00:00Z",
  },
  {
    id: "ep-019",
    doctorName: "Dr. Adam Lamb",
    doctorSlug: "dr-adam-lamb",
    clinicName: "Lamb Chiropractic",
    city: "New York",
    state: "NY",
    videoUrl: "https://www.youtube.com/embed/-6pxQSNbATk",
    thumbnail: "https://img.youtube.com/vi/-6pxQSNbATk/hqdefault.jpg",
    quote: "The brain controls the body through the nervous system.",
    description:
      "Dr. Adam Lamb has practiced in Midtown Manhattan for more than 25 years at Lamb Chiropractic, near Grand Central. A Life Chiropractic College West graduate, he is Webster certified and an ICPA member, and cares for families, expecting moms, kids, and athletes with Gonstead, structural, and corrective chiropractic. He shares how a badly broken leg at 13 and a chiropractor who explained how the brain controls the body through the nervous system set him on his path, why he came home to New York, volunteering for the rescue and recovery workers at Ground Zero after 9/11 in his first year out of school, gentle care for babies and pregnancy, and what he wishes everyone understood about chiropractic.",
    episodeNumber: 19,
    publishedAt: "2026-10-15T12:00:00Z",
  },
  {
    id: "ep-020",
    doctorName: "Dr. Joseph Benne",
    doctorSlug: "joseph-benne",
    clinicName: "Atone Chiropractic",
    city: "Columbus",
    state: "OH",
    videoUrl: "https://www.youtube.com/embed/7DKnjPCZgXI",
    thumbnail: "https://img.youtube.com/vi/7DKnjPCZgXI/hqdefault.jpg",
    quote: "Bringing the brain and body to be at one.",
    description:
      "Dr. Joseph Benne is the chiropractor behind Atone Chiropractic in Columbus, Ohio, serving families in North Columbus, Westerville, Lewis Center, Powell, Dublin, and beyond. A Palmer College of Chiropractic graduate, he is Webster certified, an ICPA member, and focuses on neurologically-focused care for pregnancy, newborns, kids, and whole families. He shares how a childhood struggle with chronic ear infections in Nebraska first brought him to a chiropractor, his path from the University of Nebraska to Palmer, why he and his wife chose Columbus, opening Atone in September 2019, what the name Atone means, what a gentle adjustment looks like for babies and kids, and why he wants kids to grow up seeing life through a clear lens.",
    episodeNumber: 20,
    publishedAt: "2026-10-16T12:00:00Z",
  },
  {
    id: "ep-021",
    doctorName: "Dr. Chris Boman",
    doctorSlug: "chris-boman",
    clinicName: "Trailhead Family Chiropractic",
    city: "Murrieta",
    state: "CA",
    videoUrl: "https://www.youtube.com/embed/4xt6McSJQBw",
    thumbnail: "https://img.youtube.com/vi/4xt6McSJQBw/hqdefault.jpg",
    quote: "I wish I'd known sooner.",
    description:
      "Dr. Chris Boman founded Trailhead Family Chiropractic in Murrieta, California, to help families discover their health potential through nervous system care. He earned his Doctor of Chiropractic from Southern California University of Health Sciences and holds the Diplomate in Chiropractic Pediatrics through the ICPA, one of roughly 70 chiropractors worldwide with that credential. He is also Webster certified, with a practice focused on prenatal, pediatric, and family care. He shares how growing up under chiropractic care and a high school report set him on his path, the CalJam moment with Dr. Tony Ebel that turned his focus to kids and families, what earning his pediatric Diplomate took, why care during pregnancy and after birth matters to him, and his message to parents and chiropractors alike: trust your gut.",
    episodeNumber: 21,
    publishedAt: "2026-10-18T12:00:00Z",
  },
  {
    id: "ep-022",
    doctorName: "Dr. Taylor Cox",
    doctorSlug: "taylor-cox",
    clinicName: "Hometown Chiropractic",
    city: "Fuquay-Varina",
    state: "NC",
    videoUrl: "https://www.youtube.com/embed/Cz7g9B1kS88",
    thumbnail: "https://img.youtube.com/vi/Cz7g9B1kS88/hqdefault.jpg",
    quote: "If something still isn't right, it's time to dig deeper.",
    description:
      "Dr. Taylor Cox is the owner of Hometown Chiropractic in Fuquay-Varina, North Carolina, caring for families across Fuquay-Varina, Holly Springs, and the Raleigh area. Born in Raleigh, she graduated from UNC Charlotte and Life University. She is Webster certified through the ICPA, pediatric certified through The Pediatric Experience, a Level 1 tongue-tie and latch assessment provider, and is working toward her Diplomate through the ICPA. She shares how a CNA license at 17 and a summer working for her mom's chiropractor set her path, what mission trips to Haiti taught her about connecting with patients, why she named her practice Hometown Chiropractic, how her office uses nervous system scans to show families what is going on, and her message to parents: trust your gut.",
    episodeNumber: 22,
    publishedAt: "2026-10-20T12:00:00Z",
  },
  {
    id: "ep-023",
    doctorName: "Dr. Scott Campbell-Lloyd",
    doctorSlug: "dr-scott-campbell-lloyd",
    clinicName: "Mt Hawthorn Chiropractic",
    city: "Mount Hawthorn",
    state: "WA",
    videoUrl: "https://www.youtube.com/embed/Sk6lRASsVng",
    thumbnail: "https://img.youtube.com/vi/Sk6lRASsVng/hqdefault.jpg",
    quote: "Average isn't okay. Beige sucks. Be better.",
    description:
      "Dr. Scott Campbell-Lloyd is the chiropractor behind Mt Hawthorn Chiropractic in Mount Hawthorn, Western Australia, just outside Perth, where he practices the Gonstead approach with families, kids, and babies. He shares how he knew he wanted to be a chiropractor from the age of nine, why he believes chiropractic is specific or it's nothing, why every technique can work and the path can be different, the standard behind his motto \"average isn't okay, beige sucks, be better,\" why tummy time is about more than lifting the head, why chiropractors should be checking babies' movement patterns, and why chiropractic is for everyone even if he isn't everyone's chiropractor.",
    episodeNumber: 23,
    publishedAt: "2026-11-13T12:00:00Z",
  },
  {
    id: "ep-024",
    doctorName: "Dr. Cole Snyder",
    doctorSlug: "dr-cole-snyder",
    clinicName: "Envive Chiropractic",
    city: "Sioux Falls",
    state: "SD",
    videoUrl: "https://www.youtube.com/embed/O-jzdKTfHmQ",
    thumbnail: "https://img.youtube.com/vi/O-jzdKTfHmQ/hqdefault.jpg",
    quote: "We're healthcare, but why can't we also be hospitality?",
    description:
      "Dr. Cole Snyder leads Envive Chiropractic in downtown Sioux Falls, South Dakota, a legacy practice serving the community since 1999. A Palmer College of Chiropractic (Florida) graduate, he took over the clinic from his mentor and leads with what his team calls being a \"compassionate samurai.\" He shares how he decided to become a chiropractor in fifth grade, how shadowing and an internship turned into owning the practice, why he had to stop trying to be his mentor and learn to be himself, why healthcare can also be hospitality, why every business is a family business, and why pain is the worst party guest.",
    episodeNumber: 24,
    publishedAt: "2026-11-13T12:00:00Z",
  },
];

/** Patient-facing episodes first. Falls back to the newest episodes. */
export function patientSpotlightEpisodes(limit = 3): SpotlightEpisode[] {
  const flagged = spotlightEpisodes.filter((episode) => episode.patientFacing);
  if (flagged.length >= limit) return flagged.slice(0, limit);
  const newest = [...spotlightEpisodes].reverse().filter((episode) => !episode.patientFacing);
  return [...flagged, ...newest].slice(0, limit);
}

export function getLatestEpisode(): SpotlightEpisode {
  return spotlightEpisodes[spotlightEpisodes.length - 1];
}

export function getEpisodeById(id: string): SpotlightEpisode | undefined {
  return spotlightEpisodes.find((ep) => ep.id === id);
}

/** "dr.-kara-zuleg", "dr-kara-zuleg", and "kara-zuleg" all become "kara-zuleg". */
export function normalizeDoctorSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/^dr[.\-]+/, "")
    .replace(/\./g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getEpisodeByDoctorSlug(slug: string): SpotlightEpisode | undefined {
  const target = normalizeDoctorSlug(slug);
  if (!target) return undefined;
  return spotlightEpisodes.find((ep) => normalizeDoctorSlug(ep.doctorSlug) === target);
}
