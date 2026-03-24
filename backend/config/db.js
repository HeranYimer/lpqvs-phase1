import mysql from"mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "lpqvs_user",
  password: "lpqvs_user123",
  database: "lpqvs_db"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

export default db;