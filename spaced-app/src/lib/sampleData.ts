import { createCard, type StudyCard } from "./spacedRepetition";

const DAY_IN_MS = 86_400_000;

const SAMPLE_CONTENT = [
  {
    prompt: "What is the core benefit of spaced repetition?",
    answer: "Spaced repetition combats the forgetting curve by refreshing memories right before they fade.",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=960&q=80",
  },
  {
    prompt: "Which algorithm popularized modern spaced repetition apps?",
    answer: "The SM-2 algorithm, created for SuperMemo in the late 1980s, inspired most modern SRS implementations.",
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=960&q=80",
  },
  {
    prompt: "Name one scenario where image-based flashcards excel.",
    answer: "They are great for visual subjects like geography, anatomy, or language learning with pictorial cues.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=80",
  },
  {
    prompt: "What does the ease factor track in SM-2 style systems?",
    answer: "It measures how easily you recall a card and scales future review intervals accordingly.",
  },
  {
    prompt: "How should you grade cards that you cannot recall at all?",
    answer: "Choose the 'Again' response so the card reappears quickly for another attempt.",
  },
  {
    prompt: "Why are brief daily review sessions effective?",
    answer: "Short, consistent reviews maintain momentum without overwhelming your working memory.",
  },
] as const;

type ScheduleBlueprint = {
  offsetMs: number;
  interval: number;
  repetitions: number;
  ease: number;
};

const SCHEDULE_BLUEPRINT: ScheduleBlueprint[] = [
  { offsetMs: -15 * 60 * 1000, interval: 0, repetitions: 0, ease: 2.5 },
  { offsetMs: -5 * 60 * 1000, interval: 1, repetitions: 1, ease: 2.4 },
  { offsetMs: -60 * 1000, interval: 3, repetitions: 2, ease: 2.55 },
  { offsetMs: 6 * 60 * 60 * 1000, interval: 4, repetitions: 3, ease: 2.5 },
  { offsetMs: 2 * DAY_IN_MS, interval: 7, repetitions: 4, ease: 2.65 },
  { offsetMs: 5 * DAY_IN_MS, interval: 14, repetitions: 5, ease: 2.75 },
];

export const buildSampleDeck = (): StudyCard[] => {
  const now = Date.now();

  return SAMPLE_CONTENT.map((card, index) => {
    const base = createCard(card);
    const schedule = SCHEDULE_BLUEPRINT[index];

    const lastReview = schedule.repetitions
      ? now - schedule.interval * DAY_IN_MS
      : undefined;

    return {
      ...base,
      dueAt: now + schedule.offsetMs,
      intervalDays: schedule.interval,
      repetitions: schedule.repetitions,
      easeFactor: schedule.ease,
      lastReview,
    };
  });
};
