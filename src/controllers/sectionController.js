import User from "../models/userModel.js";
import Note from "../models/noteModel.js";
import Section from "../models/sectionModel.js";
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import getRequestBody from "../utils/requestBody.js";
import { getRedisClient } from "../configs/RedisConfig.js";

const redisClient = await getRedisClient();

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

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Section added successfully", note: existingNote }));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function getSections(req, res) {
  try {
    const redisKey = `section:note:${req.noteId}`;

    const cachedSections = await redisClient.lRange(redisKey, 0, -1);
    if (cachedSections.length > 0) {
      const sections = cachedSections.map(section => JSON.parse(section));
      res.writeHead(200, { "Content-Type": "application/json"});
      return res.end(JSON.stringify(sections));
    }

    const note = await Note.findById(req.noteId).populate("sections");
    if (!note) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }

    for (const section of note.sections) {
      await redisClient.rPush(redisKey, JSON.stringify(section));
    }

    await redisClient.expire(redisKey, 3600);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(note.sections));
  } catch (err) {
    console.error("Error in getSections:", err); // Add this for debugging
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
