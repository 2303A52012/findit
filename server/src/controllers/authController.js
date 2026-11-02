const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Generate a signed JWT token for an authenticated user.
 */
function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/**
 * Filter out sensitive fields and return safe public user profile.
 */
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

/**
 * POST /api/auth/register
 * Register a new user with default role 'user' and hashed password.
 */
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: errors.array()[0].msg
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    // Hash password with bcrypt before saving
    const passwordHash = await bcrypt.hash(password, 12);

    // Save user in MongoDB with default role 'user'
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user'
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register-moderator
 * Register an administrator/moderator account using an authorized access key.
 */
async function registerModerator(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: errors.array()[0].msg
      });
    }

    const { name, email, password, adminSecretCode } = req.body;

    const expectedSecret = process.env.MODERATOR_SECRET_KEY;
    if (!expectedSecret) {
      return res.status(503).json({ message: 'Administrator registration is not configured.' });
    }

    if (!adminSecretCode || adminSecretCode.trim() !== expectedSecret) {
      return res.status(403).json({
        message: 'Invalid administrator access code. Authorization denied.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'moderator'
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user with email and password, returning JWT token.
 */
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: errors.array()[0].msg
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Return currently authenticated user profile from req.user.
 */
async function getMe(req, res, next) {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  registerModerator,
  login,
  getMe,
  signToken,
  publicUser
};
