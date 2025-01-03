import jsonwebtoken from "jsonwebtoken";

export function extractTokenFromHeader(req) {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    const error = new Error("Authorization header missing");
    error.statusCode = 400;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    const error = new Error("Token missing");
    error.statusCode = 400;
    throw error;
  }
  console.log("Received Token:", token);
  try {
    return jsonwebtoken.verify(token, jwtSecretKey);
  } catch (err) {
    err.statusCode = 401;
    err.details = "Invalid or expired token";
    throw err;
  }
}
