import type { Response } from 'express';
import db from '../config/database.js';
import type { AuthRequest } from '../middleware/auth.js';

interface Story {
  id: number;
  title: string;
  text: string;
  video_url: string | null;
  difficulty: string;
  created_at: string;
}

export const getAllStories = async (req: AuthRequest, res: Response) => {
  try {
    const stories = db.prepare(
      'SELECT id, title, difficulty, created_at FROM stories ORDER BY created_at DESC'
    ).all() as Story[];

    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id) as Story | undefined;

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(story);
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { title, text, video_url, difficulty = 'beginner' } = req.body;

    const result = db.prepare(
      'INSERT INTO stories (title, text, video_url, difficulty) VALUES (?, ?, ?, ?)'
    ).run(title, text, video_url, difficulty);

    res.status(201).json({
      message: 'Story created successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, text, video_url, difficulty } = req.body;

    db.prepare(
      'UPDATE stories SET title = ?, text = ?, video_url = ?, difficulty = ? WHERE id = ?'
    ).run(title, text, video_url, difficulty, id);

    res.json({ message: 'Story updated successfully' });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM stories WHERE id = ?').run(id);
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
