import { describe, it, vi, expect } from "vitest";
import { findById, deleteById } from "../src/controllers/noteController.js";
import Note from "../src/models/noteModel.js";

vi.mock("../src/models/noteModel");

const createMockResponse = () => {
    const res = {};
    res.writeHead = vi.fn().mockReturnThis();
    res.end = vi.fn().mockReturnThis();
    return res;
};

describe("Controller methods", () => {
    describe("findById", () => {
        it("should return the note if found", async () => {
            const req = { id: "123" };
            const res = createMockResponse();
            const mockNote = { id: "123", title: "Test Note" };

            Note.findById.mockResolvedValue(mockNote);

            await findById(req, res);

            expect(Note.findById).toHaveBeenCalledWith("123");
            expect(res.writeHead).toHaveBeenCalledWith(200, { "Content-Type": "application/json" });
            expect(res.end).toHaveBeenCalledWith(JSON.stringify(mockNote));
        });

        it("should return 404 if note is not found", async () => {
            const req = { id: "123" };
            const res = createMockResponse();

            Note.findById.mockResolvedValue(null);

            await findById(req, res);

            expect(Note.findById).toHaveBeenCalledWith("123");
            expect(res.writeHead).toHaveBeenCalledWith(404, { "Content-Type": "application/json" });
            expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Note not found" }));
        });

        it("should return 500 on internal server error", async () => {
            const req = { id: "123" };
            const res = createMockResponse();

            Note.findById.mockRejectedValue(new Error("Database error"));

            await findById(req, res);

            expect(Note.findById).toHaveBeenCalledWith("123");
            expect(res.writeHead).toHaveBeenCalledWith(500, { "Content-Type": "application/json" });
            expect(res.end).toHaveBeenCalledWith(
                JSON.stringify({ message: "Internal Server Error", error: "Database error" })
            );
        });
    });

    describe("deleteById", () => {
        it("should delete the note if found", async () => {
            const req = { id: "123" };
            const res = createMockResponse();
            const mockNote = { id: "123", title: "Test Note" };

            Note.findByIdAndDelete.mockResolvedValue(mockNote);

            await deleteById(req, res);

            expect(Note.findByIdAndDelete).toHaveBeenCalledWith("123");
            expect(res.writeHead).toHaveBeenCalledWith(200, { "Content-Type": "application/json" });
            expect(res.end).toHaveBeenCalledWith(
                JSON.stringify({ message: "Note successfully deleted" })
            );
        });

        it("should return 404 if note is not found", async () => {
            const req = { id: "123" };
            const res = createMockResponse();

            Note.findByIdAndDelete.mockResolvedValue(null);

            await deleteById(req, res);

            expect(Note.findByIdAndDelete).toHaveBeenCalledWith("123");
            expect(res.writeHead).toHaveBeenCalledWith(404, { "Content-Type": "application/json" });
            expect(res.end).toHaveBeenCalledWith(JSON.stringify({ message: "Note not found" }));
        });

        it("should return 500 on internal server error", async () => {
            const req = { id: "123" };
            const res = createMockResponse();

            Note.findByIdAndDelete.mockRejectedValue(new Error("Database error"));

            await deleteById(req, res);

            expect(Note.findByIdAndDelete).toHaveBeenCalledWith("123");
            expect(res.writeHead).toHaveBeenCalledWith(500, { "Content-Type": "application/json" });
            expect(res.end).toHaveBeenCalledWith(
                JSON.stringify({ message: "Internal Server Error", error: "Database error" })
            );
        });
    });
});
