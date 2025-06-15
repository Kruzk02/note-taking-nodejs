import { login, register, getUserDetails, getUserProfilePicture, update } from '../controllers/userController.js';
import { saveNote, updateNote, findNoteById, deleteNoteById, findNoteByUser } from "../controllers/noteController.js";
import { saveSection, getSections, deleteBySectionId } from "../controllers/sectionController.js";
import { savePage, updatePage, findAllPageBySectionId, findPageById, deletePageById } from "../controllers/pageController.js";
import { verifyJwt } from '../utils/JwtUtil.js';

const routes = [
  { method: "GET", path: ["api", "v1", "users", "details"], handler: getUserDetails, protected: true },
  { method: "GET", path: ["api", "v1", "users", "photo"], handler: getUserProfilePicture, protected: true },
  { method: "POST", path: ["api", "v1", "users", "register"], handler: register },
  { method: "POST", path: ["api", "v1", "users", "login"], handler: login },
  { method: "PUT", path: ["api", "v1", "users"], handler: update, protected: true },
  { method: "GET", path: ["api", "v1", "notes"], handler: findNoteByUser, protected: true },
  { method: "GET", path: ["api", "v1", "notes", ":id"], handler: findNoteById, protected: true },
  { method: "POST", path: ["api", "v1", "notes"], handler: saveNote, protected: true },
  { method: "PUT", path: ["api", "v1", "notes", ":id"], handler: updateNote, proteced: true },
  { method: "DELETE", path: ["api", "v1", "notes", ":id"], handler: deleteNoteById, proteced: true },
  { method: "GET", path: ["api", "v1", "notes", ":noteId", "sections"], handler: getSections, proteced: true },
  { method: "POST", path: ["api", "v1", "notes", ":noteId", "sections"], handler: saveSection, proteced: true },
  { method: "DELETE", path: ["api", "v1", "sections", ":id"], handler: deleteBySectionId, proteced: true },
  { method: "GET", path: ["api", "v1", "sections", ":sectionId", "pages"], handler: findAllPageBySectionId, proteced: true },
  { method: "GET", path: ["api", "v1", "pages", ":id"], handler: findPageById, proteced: true },
  { method: "POST", path: ["api", "v1", "sections", ":sectionId", "pages"], handler: savePage, proteced: true },
  { method: "PUT", path: ["api", "v1", "pages", ":id"], handler: updatePage, proteced: true },
  { method: "DELETE", path: ["api", "v1", "pages", ":id"], handler: deletePageById, proteced: true }
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
      return { handler: route.handler, params, protected: route.protected }
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

    const proceed = () => match.handler(req, res);

    if (match.protected) {
      return verifyJwt(req, res, proceed);
    }
    return proceed();
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
}

