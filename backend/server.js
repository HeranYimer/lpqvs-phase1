import express from "express";
import path from "path";
import session from "express-session";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:5500",  // your frontend origin
  credentials: true
}));

app.use(
  session({
    secret: "lpqvs_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 8 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

app.use("/api", authRoutes);
app.use("/api", applicationRoutes);
app.use("/uploads", express.static("uploads"));
app.use((err, req, res, next) => {

if (err.code === "LIMIT_FILE_SIZE") {

return res.status(400).json({
message: "ፋይሉ ከ 5MB በላይ መሆን አይችልም"
});

}

res.status(500).json({
message: "File upload error"
});

});
app.listen(5000, () => {

  console.log("Server running on port 5000");

});