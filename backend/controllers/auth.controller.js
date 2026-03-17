import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register User
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        status: "error",
        message: "User already exists"
      });
    }
    
    // Create user
    const user = await User.create({ username, email, password });
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    res.status(201).json({
      status: "success",
      message: "Registered successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials"
      });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials"
      });
    }
    
    const token = generateToken(user._id, user.role);
    
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// Logout User
export const logout = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out"
  });
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    res.status(200).json({
      status: "success",
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { username, email, profilePicture } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, profilePicture },
      { new: true }
    ).select("-password");
    
    res.status(200).json({
      status: "success",
      message: "Profile updated",
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};