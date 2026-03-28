import express from "express";
import { 
  register, 
  login, 
  logout, 
  getProfile, 
  updateProfile 
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import passport from "passport";
import User from "../models/User.js";
import jwt from 'jsonwebtoken';
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID
 *         username:
 *           type: string
 *           description: User's username
 *         email:
 *           type: string
 *           description: User's email
 *         password:
 *           type: string
 *           description: User's password (hashed)
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         profilePicture:
 *           type: string
 *           description: URL to profile picture
 *     LoginResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Login successful
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT token
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error or user already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_updated
 *               profilePicture:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Google OAuth - initiates login
router.get('/goole',passport.authenticate('google',{
  scope:['profile','email'],
  prompt:'select_account'
}));
// Google OAuth - callback URL
router.get('/google/callback',
  passport.authenticate('google',{
    failureRedirect:`${process.env.FRONTEND_URL}/login`,
    session:true
  }),
  (req,res)=>{
    //Generate JWT Token
    const token = jwt.sign(
      {id:req.user._id,role:req.user.role},
      process.env.JWIT_SECRET,
      {expiresIn:'7d'}
    );
    //Redirect to frontend with token 
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
//google token verification (for client-side flow)
router.post('/google/verify',async(req,res)=>{
  try{
    const {token:googleToken} = req.body
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{
      headers:{Authorization:`Bearer ${googleToken}`}
    });
    const profile = await response.json();
    if(!profile || !profile.email){
      return res.status(400).json({status:'error',message:'Invalid Google token'});
    }
    let user = await User.findOne({email:profile.email});
    if(!user){
      user = await User.create({
        username:profile.name.replace(/\s/g,'').toLowerCase()+Math.random().toString(36).slice(-4),
        email:profile.email,
        password:Math.random().toString(36).slice(-16),
        profilePicture:profile.picture || '',
        isVerified:true
      });
    }
    const token = jwt.sign(
      {id:user._id,role:user.role},
      process.env.JWIT_SECRET,
      {expiresIn:'7d'}
    );
    res.json({
      status:'success',
      data:{
        user:{
          id:user._id,
          username:user.username,
          email:user.email,
          role:user.role,
          profilePicture:user.profilePicture
        },token
      }
    });
  }catch(error){
    console.error('Google verify error:',error);
    res.status(500).json({status:'error',message:'Google authentication failed'});
  }
});
export default router;