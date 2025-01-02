import User from '../models/userModel.js';
import getRequestBody from "../utils/requestBody.js";
import jsonwebtoken from 'jsonwebtoken';

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
    if (!process.env.JWT_SECRET_KEY) {
      process.env.JWT_SECRET_KEY = "VERYSECRETKEY";
    }

    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    if (!jwtSecretKey) {
      res.writeHead(500, {"Content-Type" : "application/json"});
      return res.end(JSON.stringify({ message: "JWT_SECRET_KEY is not defined" }));
    }

    let data = {
      time: Date(),
      userId: safeUser.id,
      username: safeUser.username
    }

    const token = jsonwebtoken.sign(data, jwtSecretKey);

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
