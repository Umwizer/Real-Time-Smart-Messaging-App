import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// @desc    Send a message
// @route   POST /api/messages/:chatId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { content, priority = "normal", offlineId } = req.body;
    const chatId = req.params.chatId;
    
    // Check if user is in chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        status: "error",
        message: "Chat not found"
      });
    }
    
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({
        status: "error",
        message: "Not a participant of this chat"
      });
    }
    
    // Create message
    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
      priority,
      offlineId,
      status: "sent"
    });
    
    // Update chat's lastMessage
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });
    
    // Populate sender info
    await message.populate("sender", "username email profilePicture");
    
    // Emit via Socket.IO for real-time
    req.app.get("io").to(`chat_${chatId}`).emit("new_message", message);
    
    res.status(201).json({
      status: "success",
      data: message
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ 
      chat: req.params.chatId,
      isDeleted: false 
    })
    .populate("sender", "username email profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await Message.countDocuments({ chat: req.params.chatId });
    
    res.status(200).json({
      status: "success",
      results: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Update message status (delivered/read)
// @route   PUT /api/messages/:id/status
// @access  Private
export const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = {
      status,
      ...(status === "delivered" && { deliveredAt: Date.now() }),
      ...(status === "read" && { readAt: Date.now() })
    };
    
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({
        status: "error",
        message: "Message not found"
      });
    }
    
    // Emit status update
    req.app.get("io").to(`chat_${message.chat}`).emit("message_status_updated", {
      messageId: message._id,
      status,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      status: "success",
      data: message
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        status: "error",
        message: "Message not found"
      });
    }
    
    // Only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "Can only delete your own messages"
      });
    }
    
    // Soft delete
    message.isDeleted = true;
    await message.save();
    
    res.status(200).json({
      status: "success",
      message: "Message deleted"
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
};