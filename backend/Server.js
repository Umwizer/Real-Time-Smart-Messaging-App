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
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import session from "express-session";
import passport from "passport";
import pkg from "passport-google-oauth20";
import User from "./models/User.js";

const { Strategy: GoogleStrategy } = pkg;

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
app.set("io", io);

//Core Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
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
      message: "Too many requests, please try again later.",
    },
  })
);
//Session Middleware
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false, 
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
//passport initialization
app.use(passport.initialize());
app.use(passport.session());

//Passport Serialization 
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

//Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,       
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            username:
              profile.displayName.replace(/\s/g, "").toLowerCase() +
              Math.random().toString(36).slice(-4),
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-16),
            profilePicture: profile.photos?.[0]?.value || "",
            isVerified: true,
          });
          console.log("New user created via Google:", user.email);
        }

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

//Swagger Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

//Basic Routes
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AdaptiveChat API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      chats: "/api/chats",
      messages: "/api/messages",
      health: "/health",
      docs: "/api-docs",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

//Socket.IO Auth Middleware
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

//Socket.IO Event Handlers 
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id} (User: ${socket.userId})`);

  socket.join(`user_${socket.userId}`);

  socket.on("join_chat", (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
    socket.to(`chat_${chatId}`).emit("user_joined", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
    socket.to(`chat_${chatId}`).emit("user_left", {
      userId: socket.userId,
      chatId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("send_message", (data) => {
    const { chatId, message } = data;
    socket.to(`chat_${chatId}`).emit("new_message", {
      ...message,
      deliveredAt: new Date().toISOString(),
    });
    console.log(`Message sent in chat ${chatId} by ${socket.userId}`);
  });

  socket.on("typing_start", ({ chatId }) => {
    socket.to(`chat_${chatId}`).emit("user_typing", {
      userId: socket.userId,
      chatId,
      isTyping: true,
    });
  });

  socket.on("typing_stop", ({ chatId }) => {
    socket.to(`chat_${chatId}`).emit("user_typing", {
      userId: socket.userId,
      chatId,
      isTyping: false,
    });
  });

  socket.on("message_read", ({ chatId, messageIds }) => {
    socket.to(`chat_${chatId}`).emit("messages_read", {
      messageIds,
      readBy: socket.userId,
      readAt: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id} (User: ${socket.userId})`);
    socket.broadcast.emit("user_offline", {
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("error", (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });
});
//db connection
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`🌐 HTTP:    http://localhost:${PORT}`);
      console.log(`📡 WS:      ws://localhost:${PORT}`);
      console.log(`📖 Docs:    http://localhost:${PORT}/api-docs`);
      console.log(`\n📌 Endpoints:`);
      console.log(`   Auth:     /api/auth/*`);
      console.log(`   Chats:    /api/chats/*`);
      console.log(`   Messages: /api/messages/*`);
      console.log(`   Health:   /health`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err.message);
    console.log("\n Troubleshooting:");
    console.log("1. Check if MongoDB URI is correct in .env");
    console.log("2. Make sure network allows MongoDB connection");
    console.log("3. Verify credentials if using MongoDB Atlas");
    console.log("4. Current URI:", process.env.MONGODB_URI);
    process.exit(1);
  });


process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  io.close(() => console.log(" Socket.IO closed"));
  await mongoose.connection.close();
  console.log(" MongoDB connection closed");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  io.close();
  await mongoose.connection.close();
  process.exit(0);
});

console.log("\n" + "=".repeat(60));
console.log("  AdaptiveChat Backend");
console.log("=".repeat(60));
console.log(`  Environment : ${process.env.NODE_ENV || "development"}`);
console.log(`  CORS Origin : ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
console.log(`  JWT Secret  : ${process.env.JWT_SECRET ? "Set" : " Not set"}`);
console.log(`  MongoDB URI : ${process.env.MONGODB_URI ? "Configured" : "Not configured"}`);
console.log("=".repeat(60) + "\n");

export { app, server, io };