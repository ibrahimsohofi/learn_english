import type { Response } from 'express';
import db from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';

// Levenshtein distance for fuzzy word matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const analyzeReading = async (req: AuthRequest, res: Response) => {
  try {
    const { story_id, spoken_text } = req.body;
    const user_id = req.user?.id;

    // Get the original story text
    const story = db.prepare('SELECT text FROM stories WHERE id = ?').get(story_id) as { text: string } | undefined;

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const originalText = normalizeText(story.text);
    const spokenTextNormalized = normalizeText(spoken_text);

    const originalWords = originalText.split(' ');
    const spokenWords = spokenTextNormalized.split(' ');

    let correctWords = 0;
    let mistakes = 0;
    const mistakesDetails: Array<{
      position: number;
      expected: string;
      spoken: string;
    }> = [];

    // Compare word by word
    const maxLength = Math.max(originalWords.length, spokenWords.length);

    for (let i = 0; i < maxLength; i++) {
      const originalWord = originalWords[i] || '';
      const spokenWord = spokenWords[i] || '';

      if (originalWord === spokenWord) {
        correctWords++;
      } else {
        // Use Levenshtein distance for fuzzy matching (allow small typos)
        const distance = levenshteinDistance(originalWord, spokenWord);
        const similarity = 1 - distance / Math.max(originalWord.length, spokenWord.length);

        if (similarity >= 0.7) {
          // Accept if 70% similar (pronunciation variations)
          correctWords++;
        } else {
          mistakes++;
          mistakesDetails.push({
            position: i,
            expected: originalWord,
            spoken: spokenWord
          });
        }
      }
    }

    const totalWords = originalWords.length;
    const accuracy = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;

    // Save reading session
    const sessionResult = db.prepare(
      `INSERT INTO reading_sessions (user_id, story_id, accuracy, correct_words, total_words, mistakes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(user_id, story_id, accuracy.toFixed(2), correctWords, totalWords, mistakes);

    const sessionId = sessionResult.lastInsertRowid;

    // Save mistakes details
    const insertMistake = db.prepare(
      'INSERT INTO mistakes_log (session_id, expected_word, spoken_word, position) VALUES (?, ?, ?, ?)'
    );

    for (const mistake of mistakesDetails) {
      insertMistake.run(sessionId, mistake.expected, mistake.spoken, mistake.position);
    }

    res.json({
      session_id: sessionId,
      accuracy: Number.parseFloat(accuracy.toFixed(2)),
      correct_words: correctWords,
      total_words: totalWords,
      mistakes: mistakes,
      mistakes_details: mistakesDetails
    });
  } catch (error) {
    console.error('Analyze reading error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserSessions = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.id;

    const sessions = db.prepare(
      `SELECT rs.*, s.title as story_title
       FROM reading_sessions rs
       JOIN stories s ON rs.story_id = s.id
       WHERE rs.user_id = ?
       ORDER BY rs.created_at DESC`
    ).all(user_id);

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSessionDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user?.id;

    const session = db.prepare(
      `SELECT rs.*, s.title as story_title, s.text as story_text
       FROM reading_sessions rs
       JOIN stories s ON rs.story_id = s.id
       WHERE rs.id = ? AND rs.user_id = ?`
    ).get(id, user_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const mistakes = db.prepare(
      'SELECT * FROM mistakes_log WHERE session_id = ? ORDER BY position'
    ).all(id);

    res.json({
      ...session,
      mistakes: mistakes
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.id;

    const stats = db.prepare(
      `SELECT
        COUNT(*) as total_sessions,
        AVG(accuracy) as average_accuracy,
        SUM(correct_words) as total_correct_words,
        SUM(mistakes) as total_mistakes
       FROM reading_sessions
       WHERE user_id = ?`
    ).get(user_id);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
