import { describe, it, expect, vi } from 'vitest';
import Note from '../src/models/noteModel.js';

describe('Note Model', () => {
  it('should create a new note', async () => {
    const mockSave = vi.fn().mockResolvedValue({
      name: 'Test Note',
    });

    const noteData = {
      name: 'Test Note',
    };

    const note = new Note(noteData);
    note.save = mockSave;
    await note.save();

    expect(mockSave).toHaveBeenCalled();
    expect(note.name).toBe(noteData.name);
  });
});
