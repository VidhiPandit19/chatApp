const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// @desc  Register user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({
        message: existing.email === email ? 'Email already in use' : 'Username already taken',
      });
    }
    const user = await User.create({ username, fullName, email, password });
    const token = generateToken(user.id);
    res.status(201).json({
      message: 'Account created successfully',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user.id);
    res.json({
      message: 'Logged in successfully',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
