import User from '../models/userModel.js';
import Note from '../models/noteModel.js'
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import formidable from "formidable";
import path from "path";
import fs from 'fs';
import { stat } from 'fs/promises'

function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function save(req, res) {
  const form = formidable({
    uploadDIr: path.join(process.cwd(), "uploads"),
    keepExtensions: true,
    filename: (name, ext, part, form) => {
      return `${name}-${Date.now()}${ext}`;
    },
  });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error parsing form data" }));
      }

      const { name } = fields;

      const cleanName = Array.isArray(name) ? name[0] : name;


      if (!cleanName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Missing required fields: name" }));
      }

      let icon = null;

      const decoded = extractTokenFromHeader(req);
      const { username } = decoded;

      const user = await User.findOne({ username }).select("_id");
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
        name: cleanName,
        icon,
        user: user.id,
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
  const form = formidable({
    uploadDIr: path.join(process.cwd(), "uploads"),
    keepExtensions: true,
    filename: (name, ext, part, form) => {
      return `${name}-${Date.now()}${ext}`;
    },
  });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error reading form data" }));
      }

      const { name } = fields;

      const cleanName = Array.isArray(name) ? name[0] : name;

      if (!cleanName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Missing required fields: name" }));
      }
      let newIcon = null;

      const existingNote = await Note.findById(req.id);
      if (!existingNote) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Note not found" }));
      }

      const decoded = extractTokenFromHeader(req);
      const { username } = decoded;
      const user = await User.findOne({ username }).select("_id");
      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User not found" }));
      }

      if (existingNote.user.toString() !== user.id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Authenticated user not own note" }));
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
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "File larger than 2MB" }));
        }

        const ext = path.extname(originFilename).toLowerCase();
        if (![".jpg", ".png", ".jpeg", ".gif"].includes(ext)) {
          await fs.promises.unlink(tempPath);
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "File type not supported" }));
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

        if (cleanName) existingNote.name = cleanName;
        if (newIcon) existingNote.icon = newIcon;

        existingNote.updatedAt = Date.now();
        const updatedNote = await existingNote.save();

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(updatedNote));
      }

    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
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

export async function findByUser(req, res) {
  try {
    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    const notes = await Note.find().populate({
      path: 'user',
      match: { username },
      select: '_id',
    })
      .select('title content tags icon createdAt updatedAt')
      .exec();
    if (!notes) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }

    const filteredNotes = notes.filter(note => note.user !== null);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(filteredNotes));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function deleteById(req, res) {
  try {
    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;
    const user = await User.findOne({ username }).select('_id');

    const note = await Note.findById(req.id);
    if (!note) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Note not found" }));
    }

    if (note.user.toString() !== user.id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Authenticated user not own the note" }));
    }

    await Note.deleteOne(note);
    await fs.promises.unlink(path.join(process.cwd(), "uploads", note.icon));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Note successfully deleted" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}
