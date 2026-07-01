export type LoveMapCategory = 'current' | 'history' | 'future' | 'inner-world'

export interface LoveMapQuestion {
  id: string
  category: LoveMapCategory
  question: string
}

export const CATEGORY_INFO: Record<LoveMapCategory, { label: string; emoji: string }> = {
  'current': { label: 'Right Now', emoji: '📍' },
  'history': { label: 'Our Story', emoji: '📖' },
  'future': { label: 'Dreams', emoji: '🌅' },
  'inner-world': { label: 'Inner World', emoji: '🪞' },
}

export const LOVE_MAP_QUESTIONS: LoveMapQuestion[] = [
  // Current — what's happening in your partner's world right now
  { id: 'c1', category: 'current', question: "What is your partner's biggest stress right now?" },
  { id: 'c2', category: 'current', question: "Name your partner's top three worries this week." },
  { id: 'c3', category: 'current', question: "What is your partner most excited about right now?" },
  { id: 'c4', category: 'current', question: "Who has your partner been talking to or thinking about lately?" },
  { id: 'c5', category: 'current', question: "What would your partner say was the best part of their day?" },
  { id: 'c6', category: 'current', question: "What is your partner currently reading, watching, or listening to?" },
  { id: 'c7', category: 'current', question: "What does your partner need more of this week?" },
  { id: 'c8', category: 'current', question: "What has your partner been putting off?" },
  { id: 'c9', category: 'current', question: "What would make your partner's tomorrow better?" },
  { id: 'c10', category: 'current', question: "What is your partner proud of right now?" },
  { id: 'c11', category: 'current', question: "What is one thing weighing on your partner that they haven't said out loud?" },
  { id: 'c12', category: 'current', question: "What does your partner wish they had more time for?" },
  { id: 'c13', category: 'current', question: "Who is your partner's closest friend right now?" },
  { id: 'c14', category: 'current', question: "What is your partner's favorite meal this season?" },
  { id: 'c15', category: 'current', question: "If your partner had a free day tomorrow, what would they do?" },

  // History — knowing your partner's story
  { id: 'h1', category: 'history', question: "What was your partner's childhood dream job?" },
  { id: 'h2', category: 'history', question: "What is your partner's happiest childhood memory?" },
  { id: 'h3', category: 'history', question: "What was the hardest thing your partner went through growing up?" },
  { id: 'h4', category: 'history', question: "Who was your partner's first best friend?" },
  { id: 'h5', category: 'history', question: "What was your partner's most embarrassing moment?" },
  { id: 'h6', category: 'history', question: "What subject did your partner love in school?" },
  { id: 'h7', category: 'history', question: "What is your partner's favorite memory of us?" },
  { id: 'h8', category: 'history', question: "When did your partner first know they loved you?" },
  { id: 'h9', category: 'history', question: "What is the bravest thing your partner has ever done?" },
  { id: 'h10', category: 'history', question: "What loss or grief has shaped your partner the most?" },
  { id: 'h11', category: 'history', question: "What was your partner's relationship with their parents like growing up?" },
  { id: 'h12', category: 'history', question: "What was your partner's first job?" },
  { id: 'h13', category: 'history', question: "What song reminds your partner of their teenage years?" },
  { id: 'h14', category: 'history', question: "What is a turning point in your partner's life?" },
  { id: 'h15', category: 'history', question: "What did your partner learn from their biggest heartbreak before you?" },

  // Future — dreams, hopes, aspirations
  { id: 'f1', category: 'future', question: "What does your partner want to accomplish this year?" },
  { id: 'f2', category: 'future', question: "Where is your partner's dream vacation?" },
  { id: 'f3', category: 'future', question: "What kind of life does your partner want in 10 years?" },
  { id: 'f4', category: 'future', question: "What is a skill your partner wants to learn?" },
  { id: 'f5', category: 'future', question: "What would your partner do with an unexpected $50,000?" },
  { id: 'f6', category: 'future', question: "What kind of old person does your partner want to be?" },
  { id: 'f7', category: 'future', question: "What legacy does your partner want to leave?" },
  { id: 'f8', category: 'future', question: "If your partner could change careers tomorrow, what would they do?" },
  { id: 'f9', category: 'future', question: "What does your partner's ideal weekend look like five years from now?" },
  { id: 'f10', category: 'future', question: "What is one thing your partner wants to experience before they die?" },
  { id: 'f11', category: 'future', question: "Where does your partner dream of living someday?" },
  { id: 'f12', category: 'future', question: "What does your partner want your relationship to feel like in 5 years?" },
  { id: 'f13', category: 'future', question: "What adventure is on your partner's bucket list?" },
  { id: 'f14', category: 'future', question: "What is your partner's dream home like?" },
  { id: 'f15', category: 'future', question: "What would your partner's perfect birthday look like?" },

  // Inner World — values, fears, identity
  { id: 'i1', category: 'inner-world', question: "What is your partner's greatest fear?" },
  { id: 'i2', category: 'inner-world', question: "What makes your partner feel most alive?" },
  { id: 'i3', category: 'inner-world', question: "What does your partner need to feel safe?" },
  { id: 'i4', category: 'inner-world', question: "What is your partner's love language?" },
  { id: 'i5', category: 'inner-world', question: "What value matters most to your partner?" },
  { id: 'i6', category: 'inner-world', question: "When does your partner feel most misunderstood?" },
  { id: 'i7', category: 'inner-world', question: "What makes your partner cry?" },
  { id: 'i8', category: 'inner-world', question: "What is your partner most insecure about?" },
  { id: 'i9', category: 'inner-world', question: "How does your partner show love when they feel it the most?" },
  { id: 'i10', category: 'inner-world', question: "What kind of person does your partner aspire to be?" },
  { id: 'i11', category: 'inner-world', question: "What helps your partner calm down when they are overwhelmed?" },
  { id: 'i12', category: 'inner-world', question: "What does your partner believe about God or the universe?" },
  { id: 'i13', category: 'inner-world', question: "What is the compliment your partner most wants to hear?" },
  { id: 'i14', category: 'inner-world', question: "What childhood wound does your partner still carry?" },
  { id: 'i15', category: 'inner-world', question: "When does your partner feel most loved by you?" },
]

export function getQuestionsForCategory(category: LoveMapCategory): LoveMapQuestion[] {
  return LOVE_MAP_QUESTIONS.filter(q => q.category === category)
}

export function getRandomQuestion(category?: LoveMapCategory): LoveMapQuestion {
  const pool = category ? getQuestionsForCategory(category) : LOVE_MAP_QUESTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}
