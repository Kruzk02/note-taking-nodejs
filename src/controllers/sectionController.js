import User from "../models/userModel.js";
import Note from "../models/noteModel.js";
import Section from "../models/sectionModel.js";
import sendResponse from '../utils/responseBody.js';
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
      return sendResponse(res, 400, "application/json", { message: "Section name is required" })
    }

    // Fetch Note from database
    const existingNote = await Note.findById(req.noteId);
    if (!existingNote) {
      return sendResponse(res, 404, "application/json", { message: "Note not found" });
    }

    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    // Fetch User from database
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      return sendResponse(res, 404, "application/json", { message: "User not found" });
    }

    const section = new Section({ name });
    await section.save();

    existingNote.sections.push(section._id);
    await existingNote.save(); // Save the updated note

    return sendResponse(res, 201, "application/json", { message: "Section added successfully", note: existingNote });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}

export async function getSections(req, res) {
  try {
    const redisKey = `section:note:${req.noteId}`;

    const cachedSections = await redisClient.lRange(redisKey, 0, -1);
    if (cachedSections.length > 0) {
      const sections = cachedSections.map(section => JSON.parse(section));
      return sendResponse(res, 200, "application/json", sections);
    }

    const note = await Note.findById(req.noteId).populate("sections");
    if (!note) {
      return sendResponse(res, 404, "application/json", { message: "Note not found" });
    }

    for (const section of note.sections) {
      await redisClient.rPush(redisKey, JSON.stringify(section));
    }

    await redisClient.expire(redisKey, 3600);
    return sendResponse(res, 200, "application/json", note.sections);
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}

export async function deleteBySectionId(req, res) {
  try {
    const section = await Section.findById(req.id);
    if (!section) {
      return sendResponse(res, 404, "application/json", { message: "Section not found" });
    }

    await Note.updateMany({ sections: section.id }, { $pull: { sections: section.id } });
    await Section.deleteOne(section);

    return sendResponse(res, 200, "application/json", { message: "Section deleted successfully" });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}
