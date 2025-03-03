import User from '../models/userModel.js';
import getRequestBody from "../utils/requestBody.js";
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import sendResponse from '../utils/responseBody.js';
import jsonwebtoken from 'jsonwebtoken';
import formidable from "formidable";
import path from "path";
import fs from 'fs'
import { stat, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

export async function login(req, res) {
  try {
    const body = await getRequestBody(req);
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return sendResponse(res, 401, "application/json", { message : "Invalid email or password" });
    }

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    let data = {
      time: Date(),
      username: user.username
    }
    const token = jsonwebtoken.sign(data, jwtSecretKey, { expiresIn: '1h' });

    return sendResponse(res, 200, "application/json", { message: "Login successful", token });
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}


export async function register(req, res) {
  try {
    const body = await getRequestBody(req);
    const { username, email, password } = body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, "application/json", { message: "Email already taken" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    return sendResponse(res, 201, "application/json", { message: "User registered successfully", user: newUser })
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message });
  }
}

export async function update(req, res) {
  const form = formidable({
    uploadDir: path.join(process.cwd(), "uploads"),
    keepExtensions: true,
    filename: (name, ext) => {
      return `${name}-${Date.now()}${ext}`;
    },
  });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        return sendResponse(res, 400, "application/json", { message: "Error parsing form data" });
      }

      const { newUsername, newEmail, newPassword } = fields;
      let newPicture = null;

      const decoded = extractTokenFromHeader(req);
      const { username } = decoded;

      const user = await User.findOne({ username });

      if (!user) {
        return sendResponse(res, 404, "application/json", { message: "User not found" }); 
      }

      if (files.picture && files.picture[0]) {
        const tempPath = files.picture[0].filepath;
        const stats = await stat(tempPath);

        if (stats.size > 2147483648) {
          await fs.promises.unlink(tempPath);
          return sendResponse(res, 400, "application/json", { message: "File larger than 2GB" });
        }

        const ext = path.extname(files.picture[0].originalFilename.toLowerCase());
        if (![".jpg", ".png", ".jpeg", ".gif"].includes(ext)) {
          await fs.promises.unlink(tempPath);
          return sendResponse(res, 400, "application/json", { message: "File not supported" });
        }

        newPicture = `profile_picture/${Date.now()}${ext}`;
        const dirPath = path.join(process.cwd(), "uploads", "profile_picture");

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const oldFilePath = path.join(process.cwd(), "uploads", user.picture);
        const permanentPath = path.join(process.cwd(), "uploads", newPicture);

        await fs.promises.rename(tempPath, permanentPath);
        if (fs.existsSync(oldFilePath)) {
          await fs.promises.unlink(oldFilePath);
        }
      }

      if (newUsername) user.username = newUsername[0];
      if (newEmail) user.email = newEmail[0];
      if (newPassword) user.password = newPassword[0];
      if (newPicture) user.picture = newPicture;

      const updatedUser = await user.save();
      return sendResponse(res, 200, "application/json", updatedUser);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      return sendResponse(res, statusCode, "application/json", { message, error: err.details || null });
    }
  });
}

export async function getUserDetails(req, res) {
  try {
    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    const user = await User.findOne({ username });
    const { password: _, ...safeUser } = user.toObject();

    return sendResponse(res, 200, "application/json", { user: safeUser });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return sendResponse(res, statusCode, "application/json", { message, error: err.details || null });
  }
}

export async function getUserProfilePicture(req, res) {
  try {
    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    const user = await User.findOne({ username }).select("picture");
    if (!user) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "User not found" }));
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, "../../uploads/", user.picture);
    const extension = path.extname(user.picture).toLowerCase();

    let contentType = "image/png";
    if (extension === ".jpg" || extension === ".jpeg") {
      contentType = "image/jpeg";
    } else if (extension === ".gif") {
      contentType = "image/gif";
    }

    try {
      const content = await readFile(filePath);
      return sendResponse(res, 200, contentType, content);
    } catch (err) {
      return sendResponse(res, 500, "application/json", { message: "Error reading file", error: err.message })
    }
  } catch (err) {
    return sendResponse(res, 500, "application/json", { message: "Internal Server Error", error: err.message })
  }
}
