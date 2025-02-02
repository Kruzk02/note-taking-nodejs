import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { save, update, findById, deleteById } from "../src/controllers/noteController.js";
import Note from "../src/models/noteModel.js";
import * as formidable from 'formidable';
import fs from "fs/promises";
import path from "path";
import jsonwebtoken from "jsonwebtoken";
import User from "../src/models/userModel.js";

vi.mock("../src/models/userModel.js");
vi.mock("../src/models/noteModel.js");
vi.mock("../src/utils/JwtUtil.js");
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

      await save(req, res);

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

      await update(req, res);

      expect(form.parse).toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Missing required fields: name" }));
    });
  });

  describe("findById", () => {
    it("should return a note by ID", async () => {
      Note.findById.mockResolvedValue({ _id: "mock-note-id", title: "Mock Note" });

      const req = mockRequest();
      const res = mockResponse();

      await findById(req, res);

      expect(Note.findById).toHaveBeenCalledWith("mock-note-id");
      expect(res.writeHead).toHaveBeenCalledWith(200, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ _id: "mock-note-id", title: "Mock Note" }));
    });

    it("should return 404 if note is not found", async () => {
      Note.findById.mockResolvedValue(null);

      const req = mockRequest();
      const res = mockResponse();

      await findById(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404, { "Content-Type": "application/json" });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Note not found" }));
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

      await deleteById(req, res);

      expect(fs.unlink(path.join(process.cwd(), "uploads", "mock-icon.png")));
    });
  });
});
