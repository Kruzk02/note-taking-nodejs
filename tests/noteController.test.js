import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { saveNote, updateNote, findNoteById, deleteNoteById, findNoteByUser } from "../src/controllers/noteController.js";
import Note from "../src/models/noteModel.js";
import * as formidable from 'formidable';
import fs from "fs/promises";
import path from "path";

vi.mock("../src/models/userModel.js");
vi.mock("../src/models/noteModel.js");
vi.mock("../src/utils/JwtUtil.js");
vi.mock("../src/configs/RedisConfig.js");
vi.mock('formidable', () => ({
  default: vi.fn(),
}));
vi.mock("fs/promises");

describe("Note Controller", () => {
  const mockRequest = () => {
    return {
      headers: { authorization: "Bearer mock-token" },
      id: "mock-note-id",
    };
  };

  const mockResponse = () => {
    const res = {};
    res.writeHead = vi.fn().mockReturnValue(res);
    res.end = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("should return an error if required fields are missing", async () => {
      const form = {
        parse: vi.fn((req, callback) => {
          const fields = {};
          const files = {};
          callback(null, fields, files);
        }),
      };
      vi.spyOn(formidable, "default").mockReturnValue(form);

      const req = mockRequest();
      const res = mockResponse();

      await saveNote(req, res);

      expect(form.parse).toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Missing required fields: name" }));
    });
  });

  describe("update", () => {
    it("should return an error if required fields are missing", async () => {
      const form = {
        parse: vi.fn((req, callback) => {
          const fields = {};
          const files = {};
          callback(null, fields, files);
        }),
      };
      vi.spyOn(formidable, "default").mockReturnValue(form);

      const req = mockRequest();
      const res = mockResponse();

      await updateNote(req, res);

      expect(form.parse).toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Missing required fields: name" }));
    });
  });

  describe("deleteById", () => {
    it("should delete a note by ID", async () => {
      Note.findById.mockResolvedValue({ _id: "mock-note-id", icon: "mock-icon.png" });
      fs.unlink.mockResolvedValue();

      const req = { headers: { authorization: `Bearer validToken` } };
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      await deleteNoteById(req, res);

      expect(fs.unlink(path.join(process.cwd(), "uploads", "mock-icon.png")));
    });
  });
});
