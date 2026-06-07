import sql from "../db.js";
import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const blacklisted = await sql`
    SELECT token FROM token_blacklist WHERE token=${token}
    `;

  if (blacklisted.length > 0) {
    return res.status(401).json({
      error: "Token has been invalidated",
    });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid Token" });
  }
};
