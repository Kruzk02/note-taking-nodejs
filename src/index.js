import { createServer } from "http";
import { connectDb } from './configs/DatabaseConfig.js';
import userRoute from "./routes/userRoutes.js";
import dotenv from 'dotenv'
dotenv.config()

connectDb();

const server = createServer(function (req,res) {
  userRoute(req, res);
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
