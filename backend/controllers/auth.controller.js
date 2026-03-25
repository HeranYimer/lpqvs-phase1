import { findUserByUsername } from "../services/user.service.js";
import { comparePassword } from "../utils/password.utils.js";

export const login = async (req, res) => {

  const { username, password } = req.body;

  try {

    const user = await findUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "ተጠቃሚ አልተገኘም" });
    }

    const validPassword = await comparePassword(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ message: "የይለፍ ቃል ትክክል አይደለም" });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      message: "በተሳካ ሁኔታ ገብተዋል",
      role: user.role
    });

  } catch (error) {

    res.status(500).json(error);

  }

};

export const logout = (req, res) => {

  req.session.destroy();

  res.json({
    message: "Logged out"
  });

};