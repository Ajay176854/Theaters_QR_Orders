const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Theater = require('../models/Theater');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, role, theaterId } = req.body;

    if (!email || !password || !name || !theaterId) {
      return res.status(400).json({ error: 'Email, password, name, and theaterId are required.' });
    }

    // Validate theater exists
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ error: 'Theater not found.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'staff',
      theaterId,
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, theaterId: user.theaterId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        theaterId: user.theaterId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = null;
    try {
      user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    } catch {
      // In case MongoDB is offline or connecting
    }

    // Demo fallback if database is unseeded or offline
    if (!user) {
      if (
        (email.toLowerCase() === 'admin@theaterbites.in' && password === 'admin123') ||
        (email.toLowerCase() === 'admin' && password === 'admin')
      ) {
        const token = jwt.sign(
          { userId: 'demo-admin-id', role: 'admin', theaterId: 'demo-theater' },
          process.env.JWT_SECRET || 'dev_jwt_secret',
          { expiresIn: '7d' }
        );
        return res.json({
          message: 'Login successful (Demo Admin mode).',
          token,
          user: {
            id: 'demo-admin-id',
            email: 'admin@theaterbites.in',
            name: 'Cinema Admin (Demo)',
            role: 'admin',
            theaterId: 'demo-theater',
          },
        });
      }

      if (
        (email.toLowerCase() === 'staff@theaterbites.in' && password === 'staff123') ||
        (email.toLowerCase() === 'staff' && password === 'staff')
      ) {
        const token = jwt.sign(
          { userId: 'demo-staff-id', role: 'staff', theaterId: 'demo-theater' },
          process.env.JWT_SECRET || 'dev_jwt_secret',
          { expiresIn: '7d' }
        );
        return res.json({
          message: 'Login successful (Demo Staff mode).',
          token,
          user: {
            id: 'demo-staff-id',
            email: 'staff@theaterbites.in',
            name: 'Counter Staff (Demo)',
            role: 'staff',
            theaterId: 'demo-theater',
          },
        });
      }

      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, theaterId: user.theaterId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        theaterId: user.theaterId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('theaterId', 'name address screens');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };
