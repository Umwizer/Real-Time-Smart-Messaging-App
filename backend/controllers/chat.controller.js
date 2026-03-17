import Chat from "../models/Chat.js";
import User from "../models/User.js";

// @desc    Create a new chat (DM or group)
// @route   POST /api/chats
// @access  Private
export const createChat = async (req, res) => {
  try {
    const { participants, isGroup, name } = req.body;
    
    // For DM, check if chat already exists
    if (!isGroup) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [req.user.id, participants[0]], $size: 2 }
      });
      
      if (existingChat) {
        return res.status(200).json({
          status: "success",
          data: existingChat
        });
      }
    }
    
    // Create new chat
    const chat = await Chat.create({
      name: isGroup ? name : null,
      isGroup: isGroup || false,
      participants: isGroup ? [...participants, req.user.id] : [req.user.id, participants[0]],
      admin: isGroup ? req.user.id : null
    });
    
    // Populate participant details
    await chat.populate("participants", "username email profilePicture");
    
    res.status(201).json({
      status: "success",
      data: chat
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get all chats for current user
// @route   GET /api/chats
// @access  Private
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate("participants", "username email profilePicture")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username" }
    })
    .sort({ updatedAt: -1 });
    
    res.status(200).json({
      status: "success",
      results: chats.length,
      data: chats
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get single chat by ID
// @route   GET /api/chats/:id
// @access  Private
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("participants", "username email profilePicture")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" }
      });
    
    if (!chat) {
      return res.status(404).json({
        status: "error",
        message: "Chat not found"
      });
    }
    
    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view this chat"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: chat
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:id
// @access  Private
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({
        status: "error",
        message: "Chat not found"
      });
    }
    
    // Only admin can delete group chats
    if (chat.isGroup && chat.admin.toString() !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "Only admin can delete group chat"
      });
    }
    
    await Chat.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: "success",
      message: "Chat deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};