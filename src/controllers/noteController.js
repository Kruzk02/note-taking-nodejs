import User from '../models/userModel.js';
import Note from '../models/noteModel.js'
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import jsonwebtoken from 'jsonwebtoken';
import formidable from "formidable";
import path from "path";
import fs from 'fs';
import { stat, readFile } from 'fs/promises'

const form = formidable({
  uploadDIr: path.join(process.cwd(), "uploads"),
  keepExtensions: true,
  filename: (name, ext, part, form) => {
    return `${name}-${Date.now()}${ext}`;
  },
});

function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function save(req, res) {
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error parsing form data" }));
      }

      const { title, content, tags } = fields;

      const cleanTitle = Array.isArray(title) ? title[0] : title;
      const cleanContent = Array.isArray(content) ? content[0] : content;
      const cleanTags = Array.isArray(tags) ? tags : [tags];

      const uniqueTags = [...new Set(cleanTags)];

      if (!cleanTitle || !cleanContent) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Missing required fields: title or content" }));
      }

      let icon = null;

      const decoded = extractTokenFromHeader(req);
      const { username } = decoded;

      const user = await User.findOne({ username });
      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User not found" }));
      }

      if (files.icon && files.icon[0]) {
        const tempPath = files.icon[0].filepath;
        const originFilename = files.icon[0].originalFilename || "";

        if (!originFilename) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "No valid file uploaded" }));
        }

        const stats = await stat(tempPath);

        if (stats.size > 2000000) {
          fs.unlink(tempPath, (unlinkErr) => {
            if (unlinkErr) console.error(`Error deleting file: ${unlinkErr.message}`);
          });
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "File larger than 2MB" }));
        }

        const ext = path.extname(originFilename).toLowerCase();
        if (![".jpg", ".png", ".jpeg", ".gif"].includes(ext)) {
          fs.unlink(tempPath, (unlinkErr) => {
            if (unlinkErr) console.error(`Error deleting file: ${unlinkErr.message}`);
          });
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "File type not supported" }));
        }

        const uniqueName = generateRandomString(24);
        icon = `note-icon/${uniqueName}-${Date.now()}${ext}`;

        const dirPath = path.join(process.cwd(), "uploads", "note-icon");
        fs.mkdirSync(dirPath, { recursive: true });

        const permanentPath = path.join(process.cwd(), "uploads", icon);
        await fs.promises.copyFile(tempPath, permanentPath);
        await fs.promises.unlink(tempPath);
      }

      const note = new Note({
        title: cleanTitle,
        content: cleanContent,
        tags: uniqueTags,
        icon,
        user: user._id,
      });
      const savedNote = await note.save();

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(savedNote));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
    }
  });
}

export async function update(req, res) {
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        res.writeHead(400, {"Content-Type": "application/json"});
        return res.end(JSON.stringify({ message: "Error reading form data"}));
      } 

      const { title, content, tags } = fields;

      const cleanTitle = Array.isArray(title) ? title[0] : title;
      const cleanContent = Array.isArray(content) ? content[0] : content;
      const cleanTags = Array.isArray(tags) ? tags : [tags];

      const uniqueTags = [...new Set(cleanTags)];

      if (!cleanTitle || !cleanContent) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Missing required fields: title or content" }));
      }
      let newIcon = null;

      const existingNote = await Note.findById(req.id);
      if (!existingNote) {
        res.writeHead(404, {"Content-Type": "application/json"});
        return res.end(JSON.stringify({ message: "Note not found"}));
      }

      const decoded = extractTokenFromHeader(req);
      const { username } = decoded;
      const user = await User.findOne({username});
      if (!user) {
        res.writeHead(404, {"Content-Type": "application/json"});
        return res.end(JSON.stringify({ message: "User not found"}));
      }
      if (existingNote.user.toString() !== user.id) {
        res.writeHead(400, {"Content-Type": "application/json"});
        return res.end(JSON.stringify({ message: "User not matching with a note owner"}));
      }

      if (files.icon && files.icon[0]) {
        const tempPath = files.icon[0].filepath;
        const originFilename = files.icon[0].originalFilename || "";
        
        if (!originFilename) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "No valid file uploaded" }));
        }

        const stats = await stat(tempPath);

        if (stats.size > 2000000) {
          await fs.promises.unlink(tempPath); 
          res.writeHead(400, {"Content-Type" : "application/json"});
          return res.end(JSON.stringify({ message: "File larger than 2MB"}));
        }

        const ext = path.extname(originFilename).toLowerCase();
        if (![".jpg", ".png", ".jpeg", ".gif"].includes(ext)) {
          await fs.promises.unlink(tempPath);
          res.writeHead(400, {"Content-Type" : "application/json"});
          return res.end(JSON.stringify({ message: "File type not supported"}));
        }
        
        const uniqueName = generateRandomString(24);
        newIcon = `note-icon/${uniqueName}-${Date.now()}${ext}`;
        
        const dirPath = path.join(process.cwd(), "uploads", "note-icon");
        await fs.promises.mkdir(dirPath, { recursive: true });
        const permanentPath = path.join(process.cwd(), "uploads", newIcon);
        
        await fs.promises.copyFile(tempPath, permanentPath);
        await fs.promises.unlink(tempPath);

        if (existingNote.icon) {
          const oldPath = path.join(process.cwd(), "uploads", existingNote.icon);
          await fs.promises.copyFile(oldPath, permanentPath);
          await fs.promises.unlink(oldPath);
        }

        if (cleanTitle) existingNote.title = cleanTitle;
        if (cleanContent) existingNote.content = cleanContent;
        if (uniqueTags) existingNote.tags = uniqueTags;
        if (newIcon) existingNote.icon = newIcon;
        
        existingNote.updatedAt = Date.now();
        const updatedNote = await existingNote.save();

        res.writeHead(202, {"Content-Type": "application/json"});
        return res.end(JSON.stringify(updatedNote));
      }

    } catch (err) {
      res.writeHead(500, {"Content-Type": "application/json"});
      return res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
    }
  });
}


export async function findById(req, res) {
  try {
    const note = await Note.findById(req.id);
    if (!note) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(note));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function deleteById(req, res) {
  try {
    const note = await Note.findByIdAndDelete(req.id);
    if (!note) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Note successfully deleted" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}
