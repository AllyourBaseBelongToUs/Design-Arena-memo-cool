import { NextRequest, NextResponse } from 'next/server';
import { readPrefsFromFile, writePrefsToFile } from '@/lib/storage';
import type { UserPreferences } from '@/lib/storage';

/**
 * GET /api/prefs - Retrieve user preferences from file storage
 */
export async function GET() {
  try {
    const preferences = await readPrefsFromFile();
    return NextResponse.json({ preferences });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to read preferences:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to read preferences from storage' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prefs - Save user preferences to file storage
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

    if (!body.preferences || typeof body.preferences !== 'object') {
      return NextResponse.json(
        { error: 'Request body must contain a preferences object' },
        { status: 400 }
      );
    }

    const prefs = body.preferences as UserPreferences;

    // Validate preference structure
    if (typeof prefs.showAnswers !== 'boolean') {
      return NextResponse.json(
        { error: 'showAnswers must be a boolean' },
        { status: 400 }
      );
    }

    if (!Array.isArray(prefs.revealedOnce)) {
      return NextResponse.json(
        { error: 'revealedOnce must be an array' },
        { status: 400 }
      );
    }

    // Validate that revealedOnce contains only strings
    for (const item of prefs.revealedOnce) {
      if (typeof item !== 'string') {
        return NextResponse.json(
          { error: 'revealedOnce must contain only strings' },
          { status: 400 }
        );
      }
    }

    // Save to file
    await writePrefsToFile(prefs);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save preferences:', errorMessage);

    // Handle specific error types
    if (error instanceof Error && (errorMessage.includes('permission') || ('code' in error && error.code === 'EACCES'))) {
      return NextResponse.json(
        { error: 'Permission denied: cannot write to storage' },
        { status: 403 }
      );
    }

    if (error instanceof Error && errorMessage.includes('must be')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save preferences to storage' },
      { status: 500 }
    );
  }
}
