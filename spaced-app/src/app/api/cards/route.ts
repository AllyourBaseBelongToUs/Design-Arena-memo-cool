import { NextRequest, NextResponse } from 'next/server';
import { readCardsFromFile, writeCardsToFile } from '@/lib/storage';
import type { StudyCard } from '@/lib/spacedRepetition';

/**
 * GET /api/cards - Retrieve all cards from file storage
 */
export async function GET() {
  try {
    const cards = await readCardsFromFile();
    return NextResponse.json({ cards });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to read cards:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to read cards from storage' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards - Save cards to file storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.cards)) {
      return NextResponse.json(
        { error: 'Request body must contain a cards array' },
        { status: 400 }
      );
    }

    // Validate each card structure
    const cards = body.cards as StudyCard[];
    for (const card of cards) {
      if (!card.id || !card.prompt || !card.answer || typeof card.createdAt !== 'number') {
        return NextResponse.json(
          { error: 'Invalid card structure' },
          { status: 400 }
        );
      }
    }

    // Save to file
    await writeCardsToFile(cards);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save cards:', errorMessage);

    // Handle specific error types
    if (error instanceof Error && (errorMessage.includes('permission') || ('code' in error && error.code === 'EACCES'))) {
      return NextResponse.json(
        { error: 'Permission denied: cannot write to storage' },
        { status: 403 }
      );
    }

    if (error instanceof Error && errorMessage.includes('Invalid card structure')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save cards to storage' },
      { status: 500 }
    );
  }
}
