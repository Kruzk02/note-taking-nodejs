import User from '../models/userModel.js';
import getRequestBody from "../utils/requestBody.js";
import { extractTokenFromHeader } from "../utils/JwtUtil.js";
import { getFile, getExtension, readFile } from '../utils/MediaUtils.js';
import jsonwebtoken from 'jsonwebtoken';
import formidable from "formidable";
import path from "path";
import fs from 'fs'

export async function login(req, res) {
  try {
    const body = await getRequestBody(req);
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.writeHead(401, {"Content-Type" : "application/json"});
      return res.end(JSON.stringify({ message: "Invalid email or password" }));
    }

    const { password: _, ...safeUser } = user.toObject();

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    let data = {
      time: Date(),
      username: safeUser.username
    }
    const token = jsonwebtoken.sign(data, jwtSecretKey, { expiresIn: '1h'});

    res.writeHead(200, {"Content-Type" : "application/json"});
    res.end(JSON.stringify({ message: "Login successful", token}));
  } catch (err) {
    res.writeHead(500, {"Content-Type" : "application/json"});
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function register(req, res) {
  try {
    const body = await getRequestBody(req);
    const { username, email, password } = body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.writeHead(400, {"Content-Type" : "application/json"});
      return res.end(JSON.stringify({ message: "Email already taken" }));
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.writeHead(201, {"Content-Type" : "application/json"});
    res.end(JSON.stringify({ message: "User registered successfully", user: newUser }));
  } catch (err) {
    res.writeHead(500, {"Content-Type" : "application/json"});
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function update(req, res) {
  const form = formidable({
    uploadDir: path.join(process.cwd(), "uploads"),
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

      const { newUsername, newEmail, newPassword } = fields;
      let newPicture = null;

      const decoded = extractTokenFromHeader(req);
      const { username } = decoded;

      const user = await User.findOne({ username });

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User not found" }));
      }

      if (files.picture && files.picture[0]) {

        const tempPath = files.picture[0].filepath;
        const ext = path.extname(files.picture[0].originalFilename.toLowerCase());
        
        if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg" && ext !== ".gif") {
          fs.unlink(tempPath, (err) => {
            if (err) {
              console.log(`${tempPath} was deleted`);
            }
          });
          res.writeHead(400, { "Content-Type" : "application/json"});
          return res.end(JSON.stringify({ message: "File not support"}));
        } 

        newPicture = `profile_picture/${Date.now()}${ext}`;
        
        const dirPath = path.join(process.cwd(), "uploads", "profile_picture");
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true});
        }
        
        const oldFilePath = path.join(process.cwd(), "uploads", user.picture);
        const permanentPath = path.join(process.cwd(), "uploads", newPicture);
        
        console.log(`Old file path: ${oldFilePath}`);
        console.log(`New file path: ${permanentPath}`)
        console.log(`temp path: ${tempPath}`)
        fs.rename(tempPath, permanentPath, (err) => {
          if (err) {
            console.error('Error replacing file:', err);
          }
        });
        fs.rename(oldFilePath, permanentPath, (err) => {
          if (err) {
            console.error('Error replacing file:', err);
          } 
        });
      }
      
      if (newUsername) user.username = newUsername;
      if (newEmail) user.email = newEmail;
      if (newPassword) user.password = newPassword;
      if (newPicture) user.picture = newPicture;

      const updatedUser = await user.save();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedUser));
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message, error: err.details || null }));
    }
  });
}

export async function getUserDetails(req, res) {
  try {
    const decoded = extractTokenFromHeader(req);
    const { username } = decoded;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ username }));
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message, error: err.details || null }));
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

    const filePath = getFile(user.picture);
    const extension = getExtension(user.picture);

    let contentType = "image/png";    
    if (extension === ".jpg" || extension === ".jpeg") {
      contentType = "image/jpeg";
    } else if (extension === ".gif") {
      contentType = "image/gif";
    }

    try {
      const content = await readFile(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Error reading file", error: err.message }));
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}
