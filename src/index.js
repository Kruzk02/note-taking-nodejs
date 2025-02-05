import { createServer } from "http";
import { connectDb } from './configs/DatabaseConfig.js';
import router from "./routes/router.js";
import dotenv from 'dotenv'
dotenv.config()

connectDb();

const server = createServer((req, res) => {
  router(req, res);
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
