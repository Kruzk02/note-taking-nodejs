import { createServer } from "http";

const server = createServer(function (req,res) {
  res.writeHead(200, {"Content-Type" : "text/plain"});
  res.end("Hello World")
});

server.listen(8080, () => {
  console.log("Server listen at port 8080");
})
