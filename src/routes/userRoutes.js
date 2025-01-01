import { login, register} from '../controllers/userController.js'

export default function userRoute(req, res) {
  if (req.method === "POST" && req.url === "/api/v1/login") {
    login(req, res);
  } else if (req.method === "POST" && req.url === "/api/v1/register") {
    register(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  }
}
