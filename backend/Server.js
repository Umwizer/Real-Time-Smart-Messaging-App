import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with authentication
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
app.set("io", io);

// MIDDLEWARE
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev")); 
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      status: "error",
      message: "Too many requests, please try again later."
    }
  })
);
// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// BASIC ROUTES
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AdaptiveChat API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      chats: "/api/chats",
      messages: "/api/messages",
      health: "/health"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});
// SOCKET.IO HANDLERS (Real-time messaging)

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id} (User: ${socket.userId})`);

  // Join user's personal room
  socket.join(`user_${socket.userId}`);
  
  // Join chat rooms
  socket.on("join_chat", (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
    
    // Notify others in chat
    socket.to(`chat_${chatId}`).emit("user_joined", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString()
    });
  });

  // Leave chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
    
    socket.to(`chat_${chatId}`).emit("user_left", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString()
    });
  });

  // Send message (real-time)
  socket.on("send_message", (data) => {
    const { chatId, message } = data;
    
    // Broadcast to all in chat except sender
    socket.to(`chat_${chatId}`).emit("new_message", {
      ...message,
      deliveredAt: new Date().toISOString()
    });
    
    console.log(`Message sent in chat ${chatId} by ${socket.userId}`);
  });

  // Typing indicators
  socket.on("typing_start", ({ chatId }) => {
    socket.to(`chat_${chatId}`).emit("user_typing", {
      userId: socket.userId,
      chatId,
      isTyping: true
    });
  });

  socket.on("typing_stop", ({ chatId }) => {
    socket.to(`chat_${chatId}`).emit("user_typing", {
      userId: socket.userId,
      chatId,
      isTyping: false
    });
  });

  // Message status updates
  socket.on("message_read", ({ chatId, messageIds }) => {
    socket.to(`chat_${chatId}`).emit("messages_read", {
      messageIds,
      readBy: socket.userId,
      readAt: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id} (User: ${socket.userId})`);
    
    // Update user status to offline
    socket.broadcast.emit("user_offline", {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(` Socket error for user ${socket.userId}:`, error);
  });
});
// DATABASE CONNECTION
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`\n Server running on port ${PORT}`);
      console.log(`HTTP:  http://localhost:${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}`);
      console.log(`API Docs: http://localhost:${PORT}/`);
      console.log(`\n Available Endpoints:`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/profile`);
      console.log(`   PUT    /api/auth/profile`);
      console.log(`   POST   /api/chats`);
      console.log(`   GET    /api/chats`);
      console.log(`   GET    /api/chats/:id`);
      console.log(`   POST   /api/messages/:chatId`);
      console.log(`   GET    /api/messages/:chatId`);
      console.log(`   PUT    /api/messages/:id/status`);
      console.log(`   DELETE /api/messages/:id`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err.message);
    console.log("\n Troubleshooting:");
    console.log("1. Check if MongoDB URI is correct in .env");
    console.log("2. Make sure network allows MongoDB connection");
    console.log("3. Verify credentials if using MongoDB Atlas");
    process.exit(1);
  });

// ======================
// GRACEFUL SHUTDOWN
// ======================
process.on("SIGINT", async () => {
  console.log("\n Received SIGINT. Shutting down gracefully...");
  
  // Close Socket.IO connections
  io.close(() => {
    console.log(" Socket.IO closed");
  });
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log(" MongoDB connection closed");
  
  // Exit
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n Received SIGTERM. Shutting down gracefully...");
  io.close();
  await mongoose.connection.close();
  process.exit(0);
});

console.log("\n" + "=".repeat(50));
console.log("AdaptiveChat Backend");
console.log("=".repeat(50));
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(` CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? " Set" : " Not set"}`);
console.log(` MongoDB URI: ${process.env.MONGODB_URI ? " Configured" : " Not configured"}`);
console.log("=".repeat(50) + "\n");

export { app, server, io };