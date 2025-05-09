import { login, register, getUserDetails, getUserProfilePicture, update } from '../controllers/userController.js';
import { saveNote, updateNote, findNoteById, deleteNoteById, findNoteByUser } from "../controllers/noteController.js";
import { saveSection, getSections, deleteBySectionId } from "../controllers/sectionController.js";
import { savePage, updatePage, findAllPageBySectionId, findPageById, deletePageById } from "../controllers/pageController.js";

const routes = [
  { method: "GET", path: ["api", "v1", "users", "details"], handler: getUserDetails },
  { method: "GET", path: ["api", "v1", "users", "photo"], handler: getUserProfilePicture },
  { method: "POST", path: ["api", "v1", "users", "register"], handler: register },
  { method: "POST", path: ["api", "v1", "users", "login"], handler: login },
  { method: "PUT", path: ["api", "v1", "users"], handler: update },
  { method: "GET", path: ["api", "v1", "notes"], handler: findNoteByUser },
  { method: "GET", path: ["api", "v1", "notes", ":id"], handler: findNoteById },
  { method: "POST", path: ["api", "v1", "notes"], handler: saveNote },
  { method: "PUT", path: ["api", "v1", "notes", ":id"], handler: updateNote },
  { method: "DELETE", path: ["api", "v1", "notes", ":id"], handler: deleteNoteById },
  { method: "GET", path: ["api", "v1", "notes", ":noteId", "sections"], handler: getSections },
  { method: "POST", path: ["api", "v1", "notes", ":noteId", "sections"], handler: saveSection },
  { method: "DELETE", path: ["api", "v1", "sections", ":id"], handler: deleteBySectionId },
  { method: "GET", path: ["api", "v1", "sections", ":sectionId", "pages"], handler: findAllPageBySectionId },
  { method: "GET", path: ["api", "v1", "pages", ":id"], handler: findPageById },
  { method: "POST", path: ["api", "v1", "sections", ":sectionId", "pages"], handler: savePage },
  { method: "PUT", path: ["api", "v1", "pages", ":id"], handler: updatePage },
  { method: "DELETE", path: ["api", "v1", "pages", ":id"], handler: deletePageById }
]

function mathRoute(method, pathSegments) {
  for (const route of routes) {
    if (route.method !== method) continue;
    if (route.path.length !== pathSegments.length) continue;

    const params = {};
    const isMatch = route.path.every((seg, i) => {
      if (seg.startsWith(":")) {
        params[seg.slice(1)] = pathSegments[i];
        return true;
      }
      return seg == pathSegments[i];
    })

    if (isMatch) {
      return { handler: route.handler, params }
    }
  }
  return null;
}

export default function router(req, res) {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

  const match = mathRoute(method, pathSegments);

  if (match) {
    req.params = match.params;
    return match.handler(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
}

