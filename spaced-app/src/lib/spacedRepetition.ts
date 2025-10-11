export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type StudyCard = {
  id: string;
  prompt: string;
  answer: string;
  image?: string;
  createdAt: number;
  dueAt: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lastReview?: number;
};

const DAY_IN_MS = 86_400_000;
const MIN_EASE_FACTOR = 1.3;

export type CreateCardOptions = {
  prompt: string;
  answer: string;
  image?: string;
};

const generateId = (): string => {
  const cryptoApi = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `card-${random}-${Date.now().toString(36)}`;
};

export const createCard = ({ prompt, answer, image }: CreateCardOptions): StudyCard => {
  const now = Date.now();
  return {
    id: generateId(),
    prompt: prompt.trim(),
    answer: answer.trim(),
    image: image?.trim() || undefined,
    createdAt: now,
    dueAt: now,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
  };
};

const calculateInterval = (card: StudyCard, grade: ReviewGrade): { interval: number; ease: number; repetitions: number } => {
  let ease = card.easeFactor;
  let interval = card.intervalDays;
  let repetitions = card.repetitions;

  switch (grade) {
    case "again": {
      ease = Math.max(MIN_EASE_FACTOR, ease - 0.2);
      interval = 0;
      repetitions = 0;
      break;
    }
    case "hard": {
      ease = Math.max(MIN_EASE_FACTOR, ease - 0.15);
      interval = interval > 0 ? Math.max(1, Math.round(interval * 1.2)) : 1;
      repetitions = Math.max(1, repetitions);
      break;
    }
    case "good": {
      ease = Math.max(MIN_EASE_FACTOR, ease);
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.max(1, Math.round(interval * ease));
      }
      repetitions += 1;
      break;
    }
    case "easy": {
      ease = Math.max(MIN_EASE_FACTOR, ease + 0.15);
      if (repetitions === 0) {
        interval = 4;
      } else if (repetitions === 1) {
        interval = Math.max(4, Math.round(interval * (ease + 1)));
      } else {
        interval = Math.max(4, Math.round(interval * ease * 1.4));
      }
      repetitions += 1;
      break;
    }
  }

  return { interval, ease, repetitions };
};

export const scheduleCard = (
  card: StudyCard,
  grade: ReviewGrade,
  reviewedAt: number,
): StudyCard => {
  const { interval, ease, repetitions } = calculateInterval(card, grade);

  let dueAt = reviewedAt + interval * DAY_IN_MS;
  if (grade === "again") {
    // Immediate relearning interval (~10 minutes) keeps the card in the queue.
    dueAt = reviewedAt + 10 * 60 * 1000;
  }

  return {
    ...card,
    easeFactor: Number(ease.toFixed(2)),
    intervalDays: interval,
    repetitions,
    lastReview: reviewedAt,
    dueAt,
  };
};

export const getDueCards = (cards: StudyCard[], now: number): StudyCard[] =>
  [...cards]
    .filter((card) => card.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || a.createdAt - b.createdAt);

export const getUpcomingCards = (cards: StudyCard[], now: number): StudyCard[] =>
  [...cards]
    .filter((card) => card.dueAt > now)
    .sort((a, b) => a.dueAt - b.dueAt || a.createdAt - b.createdAt);

const buildDurationString = (duration: number): string => {
  const absolute = Math.max(0, duration);
  const days = Math.floor(absolute / DAY_IN_MS);
  const hours = Math.floor((absolute % DAY_IN_MS) / 3_600_000);
  const minutes = Math.floor((absolute % 3_600_000) / 60_000);

  const parts: string[] = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hours && parts.length < 2) {
    parts.push(`${hours}h`);
  }
  if (!parts.length && minutes) {
    parts.push(`${minutes}m`);
  }

  if (!parts.length) {
    return "1m";
  }

  return parts.join(" ");
};

export const nextDueIn = (card: StudyCard, now: number): string => {
  const delta = card.dueAt - now;
  if (delta <= 0) {
    return "Due now";
  }
  if (delta < 60_000) {
    return "Less than a minute";
  }
  return buildDurationString(delta);
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatReviewDate = (timestamp: number): string => {
  return dateTimeFormatter.format(new Date(timestamp));
};
