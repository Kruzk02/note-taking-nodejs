import { login, register, getUserDetails, getUserProfilePicture, update } from '../controllers/userController.js';
import { saveNote, updateNote, findNoteById, deleteNoteById, findNoteByUser } from "../controllers/noteController.js";
import { saveSection, getSections, deleteBySectionId } from "../controllers/sectionController.js";

export default function router(req, res) {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

  if (method === 'GET' && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "users" && pathSegments[3] === "details") {
    return getUserDetails(req, res);
  }

  if (method === "GET" && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "users" && pathSegments[3] === "photo") {
    return getUserProfilePicture(req, res);
  }

  if (method === "POST" && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "users" && pathSegments[3] === "register") {
    return register(req, res);
  }

  if (method === 'POST' && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "users" && pathSegments[3] === "login") {
    return login(req, res);
  }

  if (method === "PUT" && pathSegments.length === 3 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "users") {
    return update(req, res);
  }
  if (method === "GET" && pathSegments.length === 3 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes") {
    return findNoteByUser(req, res);
  }

  if (method === "GET" && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes") {
    const id = pathSegments[3];
    req.id = id;
    return findNoteById(req, res);
  }

  if (method === "POST" && pathSegments.length === 3 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes") {
    return saveNote(req, res);
  }

  if (method === "PUT" && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes") {
    const id = pathSegments[3];
    req.id = id;
    return updateNote(req, res);
  }

  if (method === "DELETE" && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes") {
    const id = pathSegments[3];
    req.id = id;
    return deleteNoteById(req, res);
  }

  if (method === "GET" && pathSegments.length === 5 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes" && pathSegments[4] === "sections") {
    const noteId = pathSegments[3];
    req.noteId = noteId;
    return getSections(req, res);
  }

  if (method === "POST" && pathSegments.length === 5 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "notes" && pathSegments[4] === "sections") {
    const noteId = pathSegments[3];
    req.noteId = noteId;
    return saveSection(req, res);
  }

  if (method === "DELETE" && pathSegments.length === 4 &&
    pathSegments[0] === "api" && pathSegments[1] === "v1" &&
    pathSegments[2] === "sections") {
    const sectionId = pathSegments[3];
    req.id = sectionId;
    return deleteBySectionId(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
}

