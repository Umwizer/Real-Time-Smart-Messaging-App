import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
  createChat, 
  getUserChats, 
  getChatById, 
  deleteChat 
} from "../controllers/chat.controller.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         isGroup:
 *           type: boolean
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         lastMessage:
 *           type: string
 *         admin:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Create a new chat (DM or group)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs
 *               isGroup:
 *                 type: boolean
 *                 default: false
 *               name:
 *                 type: string
 *                 description: Required if isGroup is true
 *     responses:
 *       201:
 *         description: Chat created successfully
 *       200:
 *         description: Existing chat returned
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get all chats for current user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/chats/{id}:
 *   get:
 *     summary: Get single chat by ID
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat details
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/chats/{id}:
 *   delete:
 *     summary: Delete a chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       403:
 *         description: Only admin can delete group chat
 *       404:
 *         description: Chat not found
 */

router.use(protect);

router.post("/", createChat);
router.get("/", getUserChats);
router.get("/:id", getChatById);
router.delete("/:id", deleteChat);

export default router;