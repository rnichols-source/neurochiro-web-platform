export interface FaqItem {
  question: string;
  answer: string;
}

/** Shown on the homepage and in FAQPage JSON-LD. */
export const homepageFaqs: FaqItem[] = [
  {
    question: "Is chiropractic safe for kids and during pregnancy?",
    answer:
      "Many NeuroChiro doctors use gentle techniques for children and during pregnancy. Care is specific to each person. The doctor's profile describes who they see, and you can ask the office what a visit looks like for a child or during pregnancy.",
  },
  {
    question: "What happens on the first visit?",
    answer:
      "The first visit varies by office. The doctor's profile lists what to expect, including how they look at your nervous system and how long the visit usually takes.",
  },
  {
    question: "How much does a visit cost?",
    answer:
      "Cost varies by office. The doctor's profile shows a price when the office has listed one. NeuroChiro does not charge patients to search or to request an appointment.",
  },
  {
    question: "Do I need a referral?",
    answer:
      "In most places you do not need a referral to see a chiropractor. Check the doctor's profile, or ask the office, if your situation is different.",
  },
  {
    question: "How do I request an appointment?",
    answer:
      "Search for a doctor near you, open their profile, and send a request. The office usually replies within 1 business day. NeuroChiro follows up if they don't.",
  },
];

/** Longer answers that already lived on /learn/faq. */
export const learnFaqs: FaqItem[] = [
  {
    question: "What does chiropractic actually do?",
    answer:
      "Chiropractic care focuses on the relationship between your spine and your nervous system. By making specific adjustments to the spine, we remove interference in your neural pathways, allowing your brain and body to communicate effectively and support your body's natural ability to heal.",
  },
  {
    question: "How long does it take to see results?",
    answer:
      "Every nervous system is different. Some patients feel immediate shifts in regulation, while others take several weeks of consistent care to notice changes in their physiology. Long-term, sustainable change is a process of repetition, not a single event.",
  },
  {
    question: "Why do chiropractors recommend multiple visits?",
    answer:
      "Think of it like training at the gym or learning a language. Your nervous system has 'learned' certain stressful patterns over years. Overriding those patterns and establishing new, regulated ones requires consistent input over time to ensure the changes stick.",
  },
  {
    question: "Is chiropractic safe?",
    answer:
      "Yes. Chiropractic is widely recognized as one of the safest drug-free, non-invasive therapies available for the treatment of neuromusculoskeletal complaints. Our doctors use precise, gentle techniques tailored to your specific clinical scans.",
  },
  {
    question: "How do I know if a chiropractor is right for me?",
    answer:
      "If you are looking for a doctor who focuses on the 'why' behind your health challenges and uses objective data to track your nervous system function, a NeuroChiro doctor is likely a great fit.",
  },
];

export const allFaqs: FaqItem[] = [...homepageFaqs, ...learnFaqs];
