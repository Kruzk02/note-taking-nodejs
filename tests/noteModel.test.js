import { describe, it, expect, vi } from 'vitest';
import Note from '../src/models/noteModel.js';

describe('Note Model', () => {
  it('should create a new note', async () => {
    const mockSave = vi.fn().mockResolvedValue({
      title: 'Test Note',
      content: 'This is the content of the test note.',
      tags: ['test', 'note'],
    });

    const noteData = {
      title: 'Test Note',
      content: 'This is the content of the test note.',
      tags: ['test', 'note'],
    };

    const note = new Note(noteData);
    note.save = mockSave;
    await note.save();

    expect(mockSave).toHaveBeenCalled();
    expect(note.title).toBe(noteData.title);
    expect(note.content).toBe(noteData.content);
    expect(note.tags).toEqual(noteData.tags);
  });
});
