import { describe, test, expect, vi, beforeEach } from 'vitest';
import { deleteBySectionId } from '../src/controllers/sectionController.js';
import Note from '../src/models/noteModel.js';
import Section from '../src/models/sectionModel.js';
import { getRedisClient } from '../src/configs/RedisConfig.js';

vi.mock('../src/models/noteModel.js');
vi.mock('../src/models/sectionModel.js');
vi.mock('../src/configs/RedisConfig.js');

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
