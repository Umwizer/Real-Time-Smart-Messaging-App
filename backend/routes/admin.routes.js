import express from "express";
import { 
  getAllUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser 
} from "../controllers/admin.controller.js";
import { protect, restrictToAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected and admin only
router.use(protect, restrictToAdmin);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;