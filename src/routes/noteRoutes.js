import {save, update, findById, deleteById, findByUser, findByTags} from "../controllers/noteController.js";
import url from 'url';

export default function noteRoutes(req, res) {
  const parseUrl = url.parse(req.url, true);

  if (req.method === "POST" && parseUrl.pathname === "/api/v1/notes") {
    save(req, res);
  } else if (req.method === "GET" && parseUrl.pathname.startsWith("/api/v1/notes") && parseUrl.pathname.endsWith("/")) {
    findByUser(req, res);
  } else if (req.method === "PUT" && parseUrl.pathname.startsWith("/api/v1/notes/")) {
    const id = parseUrl.pathname.split("/")[4];
    if (id) {
      req.id = id;
      update(req, res);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid ID" }));
    }
  } else if (req.method === "GET" && parseUrl.pathname.startsWith("/api/v1/notes/")) {
    const id = parseUrl.pathname.split("/")[4];
    if (id) {
      req.id = id;
      findById(req, res);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid ID" }));
    }
  } else if (req.method === "DELETE" && parseUrl.pathname.startsWith("/api/v1/notes/")) {
    const id = parseUrl.pathname.split("/")[4];
    if (id) {
      req.id = id;
      deleteById(req, res);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid ID" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found" }));
  }
}

