import User from "../models/userModel.js";
import Note from "../models/noteModel.js";
import Section from "../models/sectionModel.js";
import Page from "../models/pageModel.js";
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import getRequestBody from "../utils/requestBody.js";
import { getRedisClient } from "../configs/RedisConfig.js";

const redisClient = await getRedisClient();

export async function savePage(req, res) {
  try {

    const { title, content } = await getRequestBody(req);
    if (!title) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Page title is required" }));
    }

    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    if (!req.sectionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Section ID is required" }));
    }

    const existingSection = await Section.findById(req.sectionId);
    if (!existingSection) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Section not found" }));
    }

    const existingNote = await Note.findOne({ sections: existingSection._id });
    if (!existingNote) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }

    if (existingNote.user.toString() !== user._id.toString()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Authenticated user does not own the note" }));
    }

    const page = new Page({ title: title, content: content });
    existingSection.pages.push(page);
    await page.save();
    await existingSection.save();

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Page added successfully", section: existingSection }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Internal Server Error ", error: err.message
    }));
  }
}

export async function updatePage(req, res) {
  try {
    const { title, content } = await getRequestBody(req);

    // Check if either title or content is provided
    if (!title && !content) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "At least title or content must not be empty" }));
    }

    // Extract token and validate
    const decoded = extractTokenFromHeader(req);
    if (!decoded || !decoded.username) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized, invalid token" }));
    }

    const { username } = decoded;

    // Find the user
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    // Validate Page ID
    if (!req.pageId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Page ID is required" }));
    }

    const existingPage = await Page.findById(req.pageId);
    if (!existingPage) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Page not found" }));
    }

    // Validate Section
    const existingSection = await Section.findOne({ pages: existingPage._id });
    if (!existingSection) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Section not found" }));
    }

    // Validate Note
    const existingNote = await Note.findOne({ sections: existingSection._id });
    if (!existingNote) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }

    // Check if the user is the owner of the note
    if (existingNote.user.toString() !== user._id.toString()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Authenticated user does not own the note" }));
    }

    // Update Page title and content if provided
    if (title) existingPage.title = title;
    if (content) existingPage.content = content;

    // Save the updated page
    await existingPage.save();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Page updated successfully", section: existingSection }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Internal Server Error", error: err.message
    }));
  }
}

export async function findAllPageBySectionId(req, res) {
  try {
    const redisKey = `section:${req.sectionId}:pages`;
    const cachedPage = await redisClient.lRange(redisKey, 0, -1);
    if (cachedPage.length > 0) {
      const pages = cachedPage.map(page => JSON.parse(page));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(pages));
    }

    const section = await Section.findById(req.sectionId).populate("pages");
    if (!section) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Section not found" }));
    }

    const note = await Note.findOne({ sections: section._id }).select("user");
    if (!note) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }

    const decoded = extractTokenFromHeader(req);
    if (!decoded || !decoded.username) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized, invalid token" }));
    }

    const { username } = decoded;
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    if (note.user.toString() !== user._id.toString()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Authenticated user does not own the note" }));
    }

    for (const page of section.pages) {
      await redisClient.rPush(redisKey, JSON.stringify(page));
    }

    await redisClient.expire(redisKey, 3600);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ pages: section.pages }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Internal Server Error ", error: err.message
    }));
  }
}

export async function findPageById(req, res) {
  try {

    const page = await Page.findById(req.pageId);
    if (!page) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Page not found" }));
    }

    const section = await Section.findOne({ pages: page._id }).select("_id");
    if (!section) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ mesage: "Section not found" }));
    }

    const note = await Note.findOne({ sections: section._id }).select("user");
    if (!note) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ mesage: "Note not found" }));
    }

    const decoded = extractTokenFromHeader(req);
    if (!decoded || !decoded.username) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized, invalid token" }));
    }

    const { username } = decoded;
    const user = await User.findOne({ username }).select("_id");
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    if (note.user.toString() !== user._id.toString()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Authenticated user does not own the note" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ page: page }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Internal Server Error ", error: err.message
    }));
  }
}

export async function deletePageById(req, res) {
  try {
    const page = await Page.findById(req.pageId);
    if (!page) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Page not found" }));
    }

    await Page.deleteOne(page);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Page deleted successfully" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "Internal Server Error ", error: err.message
    }));
  }
}
