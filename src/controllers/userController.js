import User from '../models/userModel.js';
import getRequestBody from "../utils/requestBody.js";

export async function login(req, res) {
  try {
    const body = await getRequestBody(req);
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      res.writeHead(401);
      return res.end(JSON.stringify({ message: "Invalid email or password" }));
    }

    res.writeHead(200);
    res.end(JSON.stringify({ message: "Login successful", user }));
  } catch (err) {
    console.error('Error during login:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}

export async function register(req, res) {
  try {
    const body = await getRequestBody(req);
    const { username, email, password } = body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.writeHead(400);
      return res.end(JSON.stringify({ message: "Email already taken" }));
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.writeHead(201);
    res.end(JSON.stringify({ message: "User registered successfully", user: newUser }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ message: "Internal Server Error", error: err.message }));
  }
}
