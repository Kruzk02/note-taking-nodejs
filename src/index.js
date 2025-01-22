import { createServer } from "http";
import { connectDb } from './configs/DatabaseConfig.js';
import userRoute from "./routes/userRoutes.js";
import noteRoute from "./routes/noteRoutes.js";
import dotenv from 'dotenv'
dotenv.config()

connectDb();

const server = createServer((req, res) => {
  const { url, method } = req;

  if (url.startsWith("/api/v1/users")) {
    userRoute(req, res);
  } else if (url.startsWith("/api/v1/notes")) {
    noteRoute(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
