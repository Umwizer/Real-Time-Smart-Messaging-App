import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
  createChat, 
  getUserChats, 
  getChatById, 
  deleteChat 
} from "../controllers/chat.controller.js";

const router = express.Router();

router.use(protect); // All chat routes are protected

router.post("/", createChat);
router.get("/", getUserChats);
router.get("/:id", getChatById);
router.delete("/:id", deleteChat);

export default router;