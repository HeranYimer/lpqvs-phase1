import db from "../config/db.js";

export const findUserByUsername = (username) => {

  return new Promise((resolve, reject) => {

    db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, results) => {

        if (err) reject(err);
        else resolve(results[0]);

      }
    );

  });

};