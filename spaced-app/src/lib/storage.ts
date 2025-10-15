import { promises as fs } from 'fs';
import path from 'path';
import type { StudyCard } from './spacedRepetition';

// File paths
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const PREFS_FILE = path.join(DATA_DIR, 'prefs.json');

// User preferences type
export type UserPreferences = {
  showAnswers: boolean;
  revealedOnce: string[]; // array of card IDs
};

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  showAnswers: false,
  revealedOnce: [],
};

/**
 * Ensures the data directory structure exists
 */
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw new Error(`Failed to create storage directories: ${errorMessage}`);
    }
  }
}

/**
 * Creates a timestamped backup of a file
 */
async function createBackup(filePath: string): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = path.basename(filePath, '.json');
    const backupPath = path.join(BACKUPS_DIR, `${fileName}-${timestamp}.json`);

    // Check if file exists before backing up
    try {
      await fs.access(filePath);
      await fs.copyFile(filePath, backupPath);
    } catch {
      // File doesn't exist, no backup needed
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Failed to create backup: ${errorMessage}`);
    // Don't throw - backup failure shouldn't break the main operation
  }
}

/**
 * Reads cards from the cards.json file
 */
export async function readCardsFromFile(): Promise<StudyCard[]> {
  await ensureDirectories();

  try {
    const data = await fs.readFile(CARDS_FILE, 'utf-8');
    const cards = JSON.parse(data);

    // Basic validation
    if (!Array.isArray(cards)) {
      throw new Error('Cards data is not an array');
    }

    // Validate each card has required properties
    for (const card of cards) {
      if (!card.id || !card.prompt || !card.answer || typeof card.createdAt !== 'number') {
        throw new Error('Invalid card structure');
      }
    }

    return cards as StudyCard[];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw new Error(`Failed to read cards: ${errorMessage}`);
  }
}

/**
 * Writes cards to the cards.json file with backup
 */
export async function writeCardsToFile(cards: StudyCard[]): Promise<void> {
  await ensureDirectories();

  // Validate input
  if (!Array.isArray(cards)) {
    throw new Error('Cards must be an array');
  }

  // Validate each card
  for (const card of cards) {
    if (!card.id || !card.prompt || !card.answer || typeof card.createdAt !== 'number') {
      throw new Error('Invalid card structure');
    }
  }

  try {
    // Create backup before writing
    await createBackup(CARDS_FILE);

    // Write the new data
    const jsonData = JSON.stringify(cards, null, 2);
    await fs.writeFile(CARDS_FILE, jsonData, 'utf-8');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write cards: ${errorMessage}`);
  }
}

/**
 * Reads user preferences from the prefs.json file
 */
export async function readPrefsFromFile(): Promise<UserPreferences> {
  await ensureDirectories();

  try {
    const data = await fs.readFile(PREFS_FILE, 'utf-8');
    const prefs = JSON.parse(data);

    // Validate structure
    if (typeof prefs !== 'object' || prefs === null) {
      throw new Error('Preferences data is not an object');
    }

    // Merge with defaults for missing properties
    return {
      showAnswers: typeof prefs.showAnswers === 'boolean' ? prefs.showAnswers : DEFAULT_PREFERENCES.showAnswers,
      revealedOnce: Array.isArray(prefs.revealedOnce) ? prefs.revealedOnce : DEFAULT_PREFERENCES.revealedOnce,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, return defaults
      return { ...DEFAULT_PREFERENCES };
    }
    throw new Error(`Failed to read preferences: ${errorMessage}`);
  }
}

/**
 * Writes user preferences to the prefs.json file with backup
 */
export async function writePrefsToFile(prefs: UserPreferences): Promise<void> {
  await ensureDirectories();

  // Validate input
  if (typeof prefs !== 'object' || prefs === null) {
    throw new Error('Preferences must be an object');
  }

  if (typeof prefs.showAnswers !== 'boolean') {
    throw new Error('showAnswers must be a boolean');
  }

  if (!Array.isArray(prefs.revealedOnce)) {
    throw new Error('revealedOnce must be an array');
  }

  try {
    // Create backup before writing
    await createBackup(PREFS_FILE);

    // Write the new data
    const jsonData = JSON.stringify(prefs, null, 2);
    await fs.writeFile(PREFS_FILE, jsonData, 'utf-8');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write preferences: ${errorMessage}`);
  }
}
