import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getSections, deleteBySectionId } from '../src/controllers/sectionController.js';
import Note from '../src/models/noteModel.js';
import Section from '../src/models/sectionModel.js';

vi.mock('../src/models/noteModel.js');
vi.mock('../src/models/sectionModel.js');

describe('getSections', () => {
  let req, res;
  beforeEach(() => {
    req = { noteId: 'note123' };
    res = { writeHead: vi.fn(), end: vi.fn() };
  });

  test('should return sections of the note', async () => {
    const mockNote = { sections: [{ _id: 'section1' }] };
    Note.findById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ sections: [{ _id: "section1" }] }),
    });


    await getSections(req, res);

    expect(res.end).toHaveBeenCalledWith(JSON.stringify(mockNote.sections));
  });

  test('should return 404 if note not found', async () => {
    Note.findById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });
    await getSections(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
  });
});

describe('deleteBySectionId', () => {
  let req, res;
  beforeEach(() => {
    req = { id: 'section123' };
    res = { writeHead: vi.fn(), end: vi.fn() };
  });

  test('should delete section and update notes', async () => {
    Section.findById.mockResolvedValue({ _id: 'section123' });
    Note.updateMany.mockResolvedValue({});
    Section.deleteOne.mockResolvedValue({});

    await deleteBySectionId(req, res);

    expect(Note.updateMany).toHaveBeenCalledWith({ sections: undefined }, { $pull: { sections: undefined } });
    expect(Section.deleteOne).toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
  });

  test('should return 404 if section not found', async () => {
    Section.findById.mockResolvedValue(null);

    await deleteBySectionId(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
  });
});
