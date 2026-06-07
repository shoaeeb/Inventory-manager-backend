import sql from "../db.js";
import { hashPassword, isPasswordCorrect, issueJWT } from "../utils/lib.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await sql`
    
        SELECT id from users
        WHERE username = ${username} or email = ${email}
        LIMIT 1
    `;
    if (existing.length > 0) {
      return res.status(409).json({
        error: "Username or email already taken",
      });
    }

    //Hash the password

    const hashedPassword = await hashPassword(password);

    //Insert new user

    const [newUser] = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email, created_at
    `;
    //ISSUE JWT
    const token = issueJWT(newUser.id, username);

    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.log("Register error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [user] = await sql`
        SELECT id, username,email,password
        FROM users
        WHERE username = ${username}
        LIMIT 1
    `;

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    //compare passwords
    const isMatch = await isPasswordCorrect(user.password, password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    //issueJWT

    const token = issueJWT(user.id, user.username);
    const { password: _, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  await sql`INSERT INTO token_blacklist (token) values (${token})`;
  res.json({ message: "Logged Out Successfully" });
};
