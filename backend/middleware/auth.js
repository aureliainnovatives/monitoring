const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User'); // Make sure you have the User model

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    // Check if the Authorization header is provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is missing or invalid' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch the user based on the decoded token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Store the user information in the request object
    req.user = user;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authorization error:', error.message);
    res.status(401).json({ message: 'Authorization failed. Invalid or expired token.' });
  }
};

module.exports = auth;
