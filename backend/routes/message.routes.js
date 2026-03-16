import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
  sendMessage, 
  getMessages, 
  updateMessageStatus,
  deleteMessage 
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(protect); // All message routes are protected

router.get("/:chatId", getMessages);
router.post("/:chatId", sendMessage);
router.put("/:id/status", updateMessageStatus);
router.delete("/:id", deleteMessage);

export default router;