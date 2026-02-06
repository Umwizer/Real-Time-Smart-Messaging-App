const dotenv = require("dotenv");
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  },
});

app.set("io", io);
//Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(helmet());
app.use(morgan("combined"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

//Routes
app.use("/api/auth", authRoutes);

//MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    // Start the server after successful DB connection
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

console.log("Adaptive Chat Backend ");
console.log("CORS-ORIGIN:", process.env["CORS-ORIGIN"]);
console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? "Set ✓" : "Not set ✗"}`);
console.log(
  `MongoDB URI: ${process.env.MONGODB_URI ? "Configured ✓" : "Not configured ✗"}`,
);
console.log("");
