import { createServer } from "http";
import { connectDb } from './configs/DatabaseConfig.js';
import { getRedisClient } from './configs/RedisConfig.js';
import router from "./routes/router.js";
import dotenv from 'dotenv'

dotenv.config()

connectDb();
getRedisClient();

const server = createServer((req, res) => {
  router(req, res);
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
