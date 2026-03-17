import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // SMART FEATURE: Message Priority
  priority: {
    type: String,
    enum: ["normal", "important", "urgent"],
    default: "normal"
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  // For offline sync
  offlineId: String,
  deliveredAt: Date,
  readAt: Date,
  // For message expiry
  expiresAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);