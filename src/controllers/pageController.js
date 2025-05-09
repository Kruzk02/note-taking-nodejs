import User from "../models/userModel.js";
import Note from "../models/noteModel.js";
import Section from "../models/sectionModel.js";
import Page from "../models/pageModel.js";
import sendResponse from '../utils/responseBody.js';
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import getRequestBody from "../utils/requestBody.js";
import { getRedisClient } from "../configs/RedisConfig.js";

const redisClient = await getRedisClient();

export async function savePage(req, res) {
  try {

    const { title, content } = await getRequestBody(req);
    if (!title) {
      return sendResponse(res, 400, "application/json", { message: "Page title is required" });
    }

    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      return sendResponse(res, 404, "application/json", { message: "User not found" });
    }

    if (!req.params.sectionId) {
      return sendResponse(res, 400, "application/json", { message: "Section ID is required" });
    }

    const existingSection = await Section.findById(req.params.sectionId);
    if (!existingSection) {
      return sendResponse(res, 404, "application/json", { message: "Section not found" });
    }

    const existingNote = await Note.findOne({ sections: existingSection._id });
    if (!existingNote) {
      return sendResponse(res, 404, "application/json", { message: "Note not found" });
    }

    if (existingNote.user.toString() !== user._id.toString()) {
      return sendResponse(res, 403, "application/json", { message: "Authenticated user does not own the note" });
    }

    const page = new Page({ title: title, content: content });
    existingSection.pages.push(page);
    await page.save();
    await existingSection.save();

    return sendResponse(res, 201, "application/json", { message: "Page added successfully", section: existingSection });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error ", error: err.message });
  }
}

export async function updatePage(req, res) {
  try {
    const { title, content } = await getRequestBody(req);

    if (!title && !content) {
      return sendResponse(res, 400, "application/json", { message: "At least title or content must not be empty" });
    }

    const decoded = extractTokenFromHeader(req);
    if (!decoded || !decoded.username) {
      return sendResponse(res, 401, "application/json", { message: "Unauthorized, invalid token" });
    }

    const { username } = decoded;

    // Find the user
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      return sendResponse(res, 404, "application/json", { message: "User not found" });
    }

    // Validate Page ID
    if (!req.params.id) {
      return sendResponse(res, 400, "application/json", { message: "Page ID is required" });
    }

    const existingPage = await Page.findById(req.params.pageId);
    if (!existingPage) {
      return sendResponse(res, 404, "application/json", { message: "Page not found" });
    }

    // Validate Section
    const existingSection = await Section.findOne({ pages: existingPage._id });
    if (!existingSection) {
      return sendResponse(res, 404, "application/json", { message: "Section not found" });
    }

    // Validate Note
    const existingNote = await Note.findOne({ sections: existingSection._id });
    if (!existingNote) {
      return sendResponse(res, 404, "application/json", { message: "Note not found" });
    }

    // Check if the user is the owner of the note
    if (existingNote.user.toString() !== user._id.toString()) {
      return sendResponse(res, 403, "application/json", { message: "Authenticated user does not own the note" });
    }

    // Update Page title and content if provided
    if (title) existingPage.title = title;
    if (content) existingPage.content = content;

    // Save the updated page
    await existingPage.save();

    return sendResponse(res, 200, "application/json", { message: "Page updated successfully", section: existingSection });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}

export async function findAllPageBySectionId(req, res) {
  try {
    const redisKey = `section:${req.params.sectionId}:pages`;
    const cachedPage = await redisClient.lRange(redisKey, 0, -1);
    if (cachedPage.length > 0) {
      const pages = cachedPage.map(page => JSON.parse(page));
      return sendResponse(res, 200, "application/json", pages);
    }

    const section = await Section.findById(req.params.sectionId).populate("pages");
    if (!section) {
      return sendResponse(res, 404, "application/json", { message: "Section not found" });
    }

    const note = await Note.findOne({ sections: section._id }).select("user");
    if (!note) {
      return sendResponse(res, 404, "application/json", { message: "Note not found" });
    }

    const decoded = extractTokenFromHeader(req);
    if (!decoded || !decoded.username) {
      return sendResponse(res, 401, "application/json", { message: "Unauthorized, invalid token" });
    }

    const { username } = decoded;
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      return sendResponse(res, 404, "application/json", { message: "User not found" });
    }

    if (note.user.toString() !== user._id.toString()) {
      return sendResponse(res, 403, "application/json", { message: "Authenticated user does not own the note" });
    }

    for (const page of section.pages) {
      await redisClient.rPush(redisKey, JSON.stringify(page));
    }

    await redisClient.expire(redisKey, 3600);
    return sendResponse(res, 200, "application/json", { pages: section.pages });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}

export async function findPageById(req, res) {
  try {

    const page = await Page.findById(req.params.id);
    if (!page) {
      return sendResponse(res, 404, "application/json", { message: "Page not found" });
    }

    const section = await Section.findOne({ pages: page._id }).select("_id");
    if (!section) {
      return sendResponse(res, 404, "application/json", { mesage: "Section not found" });
    }

    const note = await Note.findOne({ sections: section._id }).select("user");
    if (!note) {
      return sendResponse(res, 404, "application/json", { mesage: "Note not found" });
    }

    const decoded = extractTokenFromHeader(req);
    if (!decoded || !decoded.username) {
      return sendResponse(res, 401, "application/json", { message: "Unauthorized, invalid token" });
    }

    const { username } = decoded;
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      return sendResponse(res, 404, "application/json", { message: "User not found" });
    }

    if (note.user.toString() !== user._id.toString()) {
      return sendResponse(res, 403, "application/json", { message: "Authenticated user does not own the note" });
    }

    return sendResponse(res, 200, "application/json", { page: page });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}

export async function deletePageById(req, res) {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return sendResponse(res, 404, "application/json", { message: "Page not found" });
    }

    await Page.deleteOne(page);

    return sendResponse(res, 404, "application/json", { message: "Page deleted successfully" });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}
