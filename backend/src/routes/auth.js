import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// --- Google OAuth ---
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || `http://localhost:5000/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || `http://localhost:5000/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) throw new Error('No email from Google');

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId: googleUser.id }, { email: googleUser.email }] });
    if (!user) {
      user = await User.create({
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        googleId: googleUser.id,
        picture: googleUser.picture || '',
        password: Math.random().toString(36) + Math.random().toString(36), // dummy, not used
        role: 'admin',
      });
    } else if (!user.googleId) {
      user.googleId = googleUser.id;
      user.picture = googleUser.picture || '';
      await user.save();
    }

    // Issue JWT
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Redirect to frontend callback with token
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
});

export default router;
