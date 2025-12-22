const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        msg: 'Database connection not available. Please try again later.' 
      });
    }
    
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password
    });
    
    // Save user to database
    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser.email);
    
    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { user: { id: savedUser.id } },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    // Send user data and token (without password)
    res.json({
      msg: 'User registered successfully',
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email
      }
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue
    });
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }
    
    if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
      return res.status(503).json({ 
        msg: 'Database error. Please check your MongoDB connection.' 
      });
    }
    
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { user: { id: user.id } },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    // Send user data and token (without password)
    res.json({
      msg: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
