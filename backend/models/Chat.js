// models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  name: String,  // For group chats
  isGroup: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For groups
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);