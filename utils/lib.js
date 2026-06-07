import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const issueJWT = (userId, username) => {
  return jwt.sign(
    {
      userId: userId,
      username: username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const isPasswordCorrect = async (hashedPassword, password) => {
  return await bcrypt.compare(password, hashedPassword);
};
