import User from "../models/User.js";

// Get All Users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// Get Single User (Admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

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

// Update User Role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// Delete User (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};