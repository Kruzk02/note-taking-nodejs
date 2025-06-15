import jsonwebtoken from "jsonwebtoken";

export function verifyJwt(req, res, next) {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.writeHead(401, { "Content-Type": "Application/json" });
    return res.end(JSON.stringify({ error: "missing or invalid authorization header" }));
  }

  const token = authHeader.split(' ')[1];
  jsonwebtoken.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      res.writeHead(403, { "Content-Type": "Application/json" });
      return res.end(JSON.stringify({ error: "invalid or expired token" }));
    }

    req.user = decoded;
    next();
  });
}
