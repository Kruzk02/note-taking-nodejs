import User from "../models/userModel.js";
import Note from "../models/noteModel.js";
import Section from "../models/sectionModel.js";
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import getRequestBody from "../utils/requestBody.js";

export async function saveSection(req, res) {
  try {
    // Get data from request body
    const body = await getRequestBody(req);

    const { name } = body;
    if (!name) {
      return res.writeHead(400, { "Content-Type": "application/json" }).end(
        JSON.stringify({ message: "Section name is required" })
      );
    }

    // Fetch Note from database
    const existingNote = await Note.findById(req.noteId);
    if (!existingNote) {
      res.writeHead(404, { "Content-Type": "application/json" })
      return res.end(
        JSON.stringify({ message: "Note not found" })
      );
    }

    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    // Fetch User from database
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" })
      return res.end(
        JSON.stringify({ message: "User not found" })
      );
    }

    const section = new Section({ name });
    await section.save();

    existingNote.sections.push(section._id);
    await existingNote.save(); // Save the updated note

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Section added successfully", note: existingNote }));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function getSections(req, res) {
  try {
    // Fetch Note from database
    const note = await Note.findById(req.noteId).populate("sections");
    if (!note) {
      return res.writeHead(404, { "Content-Type": "application/json" }).end(
        JSON.stringify({ message: "Note not found" })
      );
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(note.sections))
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function deleteBySectionId(req, res) {
  try {
    const section = await Section.findById(req.id);
    if (!section) {
      return res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Section not found" }));
    }

    await Note.updateMany({ sections: section.id }, { $pull: { sections: section.id } });
    await Section.deleteOne(section);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Section deleted successfully" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}
