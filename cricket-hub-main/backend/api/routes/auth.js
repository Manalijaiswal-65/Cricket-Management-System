const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, Session } = require('../../models');
const { authenticate, generateToken } = require('../../middleware');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'spectator' } = req.body;

    const validRoles = ['admin', 'manager', 'spectator'];
    const userRole = validRoles.includes(role) ? role : 'spectator';

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const user_id = `user_${uuidv4().slice(0, 12)}`;
    const password_hash = await bcrypt.hash(password, 10);

    const user = new User({
      user_id,
      email,
      name,
      password_hash,
      role: userRole,
      created_at: new Date()
    });

    await user.save();
    const token = generateToken(user);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: { user_id, email, name, role: userRole, picture: null, team_id: null }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ detail: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
        team_id: user.team_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Login failed' });
  }
});

// Google OAuth Callback
router.post('/google/callback', async (req, res) => {
  try {
    const { id_token } = req.body;

    // Decode JWT and extract user info
    const decoded = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());

    const { email, name, picture } = decoded;

    let user = await User.findOne({ email });

    if (user) {
      if (picture && user.picture !== picture) {
        user.picture = picture;
        await user.save();
      }
    } else {
      const user_id = `user_${uuidv4().slice(0, 12)}`;
      user = new User({
        user_id,
        email,
        name,
        picture,
        role: 'spectator',
        created_at: new Date()
      });
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
        team_id: user.team_id
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401).json({ detail: 'Google OAuth failed' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({
    user_id: req.user.user_id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    picture: req.user.picture,
    team_id: req.user.team_id
  });
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const session_token = req.cookies?.session_token;
    if (session_token) {
      await Session.deleteOne({ session_token });
    }
    res.clearCookie('session_token', { path: '/', sameSite: 'none', secure: true });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Logout failed' });
  }
});

module.exports = router;
