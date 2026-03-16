import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Protect routes - user must be logged in
export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized, no token provided"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated"
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Not authorized, token failed"
    });
  }
};

// Restrict to admin
export const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Admin only."
    });
  }
  next();
};