import { createServer } from "http";
import { connectDb } from './configs/DatabaseConfig.js';

connectDb();

const server = createServer(function (req,res) {
  res.writeHead(200, {"Content-Type" : "text/plain"});
  res.end("Hello World")
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
