import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js"

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("combined"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AdaptiveChat API",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(" MongoDB connected");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(` http://localhost:${PORT}`);
      console.log(`ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB error:", err.message);
  });

console.log("\nAdaptiveChat Backend");
console.log("-------------------");
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(
  `CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`,
);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? "Set" : "Not set"}`);
console.log(
  `MongoDB: ${process.env.MONGODB_URI ? "Configured" : "Not configured"}`,
);
console.log("");
