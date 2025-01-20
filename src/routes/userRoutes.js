import { login, register, getUserDetails, getUserProfilePicture, update } from '../controllers/userController.js'

export default function userRoute(req, res) {
  if (req.method === "POST" && req.url === "/api/v1/users/login") {
    login(req, res);
  } else if (req.method === "POST" && req.url === "/api/v1/users/register") {
    register(req, res);
  } else if (req.method === "GET" && req.url === "/api/v1/users/details") {
    getUserDetails(req, res);
  } else if (req.method === "GET" && req.url === "/api/v1/users/photo") {
    getUserProfilePicture(req, res);
  } else if (req.method === "PUT" && req.url === "/api/v1/users") {
    update(req,res);
  } else {
    res.writeHead(404, { "Content-Type" : "appliction/json"});
    res.end(JSON.stringify({ message: "Not Found" }));
  }
}
