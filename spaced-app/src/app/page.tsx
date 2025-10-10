'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  StudyCard,
  ReviewGrade,
  createCard,
  formatReviewDate,
  getDueCards,
  getUpcomingCards,
  nextDueIn,
  scheduleCard,
} from '@/lib/spacedRepetition';
import { buildSampleDeck } from '@/lib/sampleData';

type SessionStats = {
  reviews: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
};

const STORAGE_KEY = 'agentic-spaced-repetition-v1';
const INITIAL_SESSION: SessionStats = {
  reviews: 0,
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

export default function Home() {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>(INITIAL_SESSION);
  const [formState, setFormState] = useState({
    prompt: '',
    answer: '',
    imageUrl: '',
    imageData: '',
  });
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudyCard[];
        setCards(parsed);
      } else {
        setCards(buildSampleDeck());
      }
    } catch (error) {
      console.error('Unable to load saved deck', error);
      setCards(buildSampleDeck());
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards, hydrated]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dueCards = useMemo(() => getDueCards(cards, now), [cards, now]);
  const upcomingCards = useMemo(() => getUpcomingCards(cards, now), [cards, now]);
  const currentCard = dueCards[0] ?? null;

  const handleReveal = useCallback(() => {
    setShowAnswer(true);
  }, []);

  const handleGrade = useCallback(
    (card: StudyCard, grade: ReviewGrade) => {
      const reviewedAt = Date.now();
      setCards((prev) =>
        prev.map((existing) =>
          existing.id === card.id ? scheduleCard(existing, grade, reviewedAt) : existing,
        ),
      );
      setSessionStats((prev) => ({
        ...prev,
        reviews: prev.reviews + 1,
        [grade]: prev[grade] + 1,
      }));
      setShowAnswer(false);
    },
    [],
  );

  const handleDelete = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  }, []);

  const resetToSampleDeck = useCallback(() => {
    const sample = buildSampleDeck();
    setCards(sample);
    setSessionStats(INITIAL_SESSION);
    setShowAnswer(false);
  }, []);

  const clearProgress = useCallback(() => {
    const resetAt = Date.now();
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        intervalDays: 0,
        easeFactor: 2.5,
        dueAt: resetAt,
        repetitions: 0,
        lastReview: undefined,
      })),
    );
    setSessionStats(INITIAL_SESSION);
    setShowAnswer(false);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof typeof formState, value: string) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        ...(field === 'imageUrl' ? { imageData: '' } : {}),
      }));
      if (field === 'imageUrl') {
        setImageError(null);
      }
    },
    [],
  );

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError('Please choose an image smaller than 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormState((prev) => ({
        ...prev,
        imageData: result,
        imageUrl: '',
      }));
      setImageError(null);
    };
    reader.onerror = () => {
      setImageError('We could not read that file. Try a different image.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddCard = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formState.prompt.trim() || !formState.answer.trim()) {
        return;
      }
      const image = formState.imageData || formState.imageUrl || undefined;
      const newCard = createCard({
        prompt: formState.prompt,
        answer: formState.answer,
        image,
      });
      setCards((prev) => [...prev, newCard]);
      setFormState({
        prompt: '',
        answer: '',
        imageUrl: '',
        imageData: '',
      });
      setImageError(null);
    },
    [formState],
  );

  const totalDue = dueCards.length;
  const totalCards = cards.length;
  const nextDueCard = upcomingCards[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 lg:px-8">
        <header className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Spaced Repetition Trainer
              </h1>
              <p className="mt-1 max-w-2xl text-slate-400">
                Build durable memory by reviewing bite-sized facts on an adaptive schedule.
                Upload images or use sample decks to get started instantly.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={resetToSampleDeck}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-slate-500 hover:bg-slate-800"
              >
                Load Sample Deck
              </button>
              <button
                type="button"
                onClick={clearProgress}
                className="rounded-full border border-red-500/60 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-400 hover:bg-red-500/10"
              >
                Reset Scheduling
              </button>
            </div>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm uppercase tracking-wide text-slate-500">Cards</dt>
              <dd className="mt-1 text-3xl font-semibold text-white">{totalCards}</dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm uppercase tracking-wide text-slate-500">Due Now</dt>
              <dd className="mt-1 text-3xl font-semibold text-emerald-400">{totalDue}</dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm uppercase tracking-wide text-slate-500">Session Reviews</dt>
              <dd className="mt-1 text-3xl font-semibold text-white">{sessionStats.reviews}</dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <dt className="text-sm uppercase tracking-wide text-slate-500">Next Due</dt>
              <dd className="mt-1 text-lg font-medium text-slate-200">
                {nextDueCard ? nextDueIn(nextDueCard, now) : 'All caught up'}
              </dd>
            </div>
          </dl>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.6fr_1fr] xl:gap-10">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
              <header className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Review Queue</h2>
                  <p className="text-sm text-slate-400">
                    Press reveal to see the answer, then grade your recall to update the schedule.
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 px-4 py-1 text-sm font-medium text-slate-300">
                  {totalDue} due
                </span>
              </header>

              {currentCard ? (
                <div className="flex flex-col gap-6">
                  <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm shadow-black/40">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Prompt
                        </p>
                        <p className="mt-2 text-lg font-medium text-slate-100">
                          {currentCard.prompt}
                        </p>
                      </div>
                      {currentCard.image ? (
                        <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40">
                          <Image
                            src={currentCard.image}
                            alt={currentCard.prompt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 640px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : null}
                      {showAnswer ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Answer
                          </p>
                          <p className="mt-2 whitespace-pre-line text-base text-slate-100">
                            {currentCard.answer}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReveal}
                          className="mt-2 self-start rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Reveal Answer
                        </button>
                      )}
                    </div>
                  </article>

                  {showAnswer ? (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => handleGrade(currentCard, 'again')}
                        className="rounded-full border border-red-500/60 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
                      >
                        Again
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrade(currentCard, 'hard')}
                        className="rounded-full border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/30"
                      >
                        Hard
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrade(currentCard, 'good')}
                        className="rounded-full border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrade(currentCard, 'easy')}
                        className="rounded-full border border-sky-500/60 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/30"
                      >
                        Easy
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
                  <p className="text-xl font-medium text-slate-200">You&apos;re all caught up 🎉</p>
                  <p className="max-w-md text-sm text-slate-400">
                    Add new cards or revisit upcoming reviews when they&apos;re due. Consistency is key
                    to long-term retention.
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Session Stats
                  </p>
                  <dl className="mt-3 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <dt>Total Reviews</dt>
                      <dd className="font-medium text-slate-100">{sessionStats.reviews}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Again</dt>
                      <dd className="font-medium text-red-300">{sessionStats.again}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Hard</dt>
                      <dd className="font-medium text-amber-300">{sessionStats.hard}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Good</dt>
                      <dd className="font-medium text-emerald-300">{sessionStats.good}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Easy</dt>
                      <dd className="font-medium text-sky-300">{sessionStats.easy}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Upcoming Reviews
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {upcomingCards.slice(0, 5).map((card) => (
                      <li
                        key={card.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2"
                      >
                        <span className="truncate pr-3">{card.prompt}</span>
                        <span className="text-xs font-medium text-slate-400">
                          {nextDueIn(card, now)}
                        </span>
                      </li>
                    ))}
                    {!upcomingCards.length && (
                      <li className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-slate-400">
                        No future reviews scheduled yet.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
              <h2 className="text-2xl font-semibold text-white">Add New Fact</h2>
              <p className="mt-1 text-sm text-slate-400">
                Capture a prompt, the answer you want to remember, and an optional supporting image.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleAddCard}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="prompt">
                    Prompt
                  </label>
                  <input
                    id="prompt"
                    name="prompt"
                    value={formState.prompt}
                    onChange={(event) => handleFormChange('prompt', event.target.value)}
                    placeholder="e.g. What is the capital of Iceland?"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="answer">
                    Answer
                  </label>
                  <textarea
                    id="answer"
                    name="answer"
                    rows={4}
                    value={formState.answer}
                    onChange={(event) => handleFormChange('answer', event.target.value)}
                    placeholder="Include the full answer you want to recall."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="image-url">
                    Image URL (optional)
                  </label>
                  <input
                    id="image-url"
                    name="imageUrl"
                    value={formState.imageUrl}
                    onChange={(event) => handleFormChange('imageUrl', event.target.value)}
                    placeholder="https://…"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="image-upload">
                    Upload Image (optional)
                  </label>
                  <input
                    id="image-upload"
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-emerald-400"
                  />
                  {imageError ? (
                    <p className="text-xs text-red-300">{imageError}</p>
                  ) : null}
                  {(formState.imageData || formState.imageUrl) && (
                    <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-800/80">
                      <Image
                        src={formState.imageData || formState.imageUrl}
                        alt="Selected preview"
                        fill
                        sizes="(max-width: 1024px) 100vw, 320px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  disabled={!formState.prompt.trim() || !formState.answer.trim()}
                >
                  Add Fact Card
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-white">Card Library</h2>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  {totalCards} saved
                </span>
              </div>
              <ul className="mt-5 space-y-4">
                {cards.length ? (
                  cards.map((card) => (
                    <li
                      key={card.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 shadow-sm shadow-black/20"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                        {card.image ? (
                          <div className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50 sm:w-24">
                            <Image
                              src={card.image}
                              alt={card.prompt}
                              fill
                              sizes="96px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : null}
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-semibold text-slate-100">{card.prompt}</p>
                          <p className="text-sm text-slate-400">{card.answer}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                            <span>
                              Due:{' '}
                              <span className="font-medium text-slate-200">
                                {nextDueIn(card, now)}
                              </span>
                            </span>
                            {card.lastReview ? (
                              <span>
                                Last review:{' '}
                                <span className="font-medium text-slate-200">
                                  {formatReviewDate(card.lastReview)}
                                </span>
                              </span>
                            ) : (
                              <span className="font-medium text-emerald-300">New</span>
                            )}
                            <span>
                              Ease:{' '}
                              <span className="font-medium text-slate-200">
                                {card.easeFactor.toFixed(2)}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start justify-end">
                          <button
                            type="button"
                            onClick={() => handleDelete(card.id)}
                            className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
                    No cards saved yet. Add a few facts to begin training.
                  </li>
                )}
              </ul>
            </div>
          </section>
        </main>

        <footer className="pb-6 text-center text-xs text-slate-500">
          Built with a spaced repetition algorithm inspired by SM-2 to prioritize the facts you
          struggle with and stretch the ones you master.
        </footer>
      </div>
    </div>
  );
}
