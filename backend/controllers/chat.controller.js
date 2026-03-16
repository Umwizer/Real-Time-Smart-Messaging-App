
import Chat from "../models/Chat";

export const createChat = async (req, res) => {
  try {
    const { name, isGroup, participants } = req.body;       
    const chat = new Chat({
      name,
      isGroup,  
        participants: [...participants, req.user._id], // Add creator to participants
        admin: isGroup ? req.user._id : null // Set admin for group chats
    });
    await chat.save();

    res.status(201).json({  
        status: "success",
        message: "Chat created successfully",
        data: { chat }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",      
        message: error.message
    });
  }
};

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "username email profilePicture")
      .populate("lastMessage")
      .sort({ updatedAt: -1 }); 

    res.status(200).json({
      status: "success",
      data: { chats }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
        message: error.message
    });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.id, 
      participants: req.user._id 
    })
    .populate("participants", "username email profilePicture")
    .populate("lastMessage");
    
    if (!chat) {
      return res.status(404).json({
        status: "error",
        message: "Chat not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: { chat }
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
        message: error.message
    });
  }
};