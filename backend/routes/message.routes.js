import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { 
  sendMessage, 
  getMessages, 
  updateMessageStatus,
  deleteMessage 
} from "../controllers/message.controller.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         chat:
 *           type: string
 *         sender:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *         content:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [normal, important, urgent]
 *         status:
 *           type: string
 *           enum: [sent, delivered, read]
 *         offlineId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *         readAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/messages/{chatId}:
 *   post:
 *     summary: Send a message in a chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello world!
 *               priority:
 *                 type: string
 *                 enum: [normal, important, urgent]
 *                 default: normal
 *               offlineId:
 *                 type: string
 *                 description: Client-generated ID for offline sync
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not a participant of this chat
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/messages/{chatId}:
 *   get:
 *     summary: Get messages from a chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 */

/**
 * @swagger
 * /api/messages/{id}/status:
 *   put:
 *     summary: Update message status (delivered/read)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [delivered, read]
 *     responses:
 *       200:
 *         description: Message status updated
 *       404:
 *         description: Message not found
 */

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Delete a message (soft delete)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       403:
 *         description: Can only delete your own messages
 *       404:
 *         description: Message not found
 */

router.use(protect);

router.get("/:chatId", getMessages);
router.post("/:chatId", sendMessage);
router.put("/:id/status", updateMessageStatus);
router.delete("/:id", deleteMessage);

export default router;