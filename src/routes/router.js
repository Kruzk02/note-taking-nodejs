import { saveSection, getSections, deleteBySectionId } from "../controllers/sectionController.js";

export default function router(req, res) {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

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

