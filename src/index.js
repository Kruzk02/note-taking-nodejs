import { createServer } from "http";
import { connectDb } from './configs/DatabaseConfig.js';
import { getRedisClient } from './configs/RedisConfig.js';
import router from "./routes/router.js";
import dotenv from 'dotenv'
import { stringify } from "querystring";
dotenv.config()

connectDb();
getRedisClient();

const server = createServer((req, res) => {
  const allowedOrigin = "http://localhost:4201";
  const allowedMethods = ['GET','POST', 'PUT', 'DELETE', 'OPTIONS'];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(','));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.headers.origin !== allowedOrigin) {
    res.writeHead(403, { "Content-Type" : "application/json"});
    return res.end(JSON.stringify({ message : 'Forbidden: Invalid origin'}));
  }

  if (!allowedMethods.includes(req.method)) {
    res.writeHead(405, { "Content-Type" : "application/json"});
    return res.end(JSON.stringify({ message : 'Method Not Allowed'}));
  }

  router(req, res);
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
