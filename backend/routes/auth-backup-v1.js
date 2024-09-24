// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Sib = require("sib-api-v3-sdk");
const config = require('../config/config');

 
// Email verification function
async function sendVerificationEmail(userEmailId, token) {
  const client = Sib.ApiClient.instance;
  const apiKey = client.authentications["api-key"];
  apiKey.apiKey = config.email.apiKey;  // Use API key from config

  const tranEmailApi = new Sib.TransactionalEmailsApi();
  const sender = {
      email: config.email.senderEmail,
      name: config.email.senderName,
  };

  const receivers = [
      {
          email: userEmailId,
      },
  ];

  const verificationLink = `${config.email.baseUrl}/api/auth/verify-email?token=${token}`;  // Use base URL from config

  await tranEmailApi
    .sendTransacEmail({
      sender,
      to: receivers,
      subject: "Signup: E-mail verification",
      htmlContent: `
        <div>
          <h5>Thank you for registering. Please click the link below to verify your email:</h5>
          <a href='${verificationLink}'>Activate Account</a>
        </div>
      `,
    });
}

// Sign-up API
router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create new user with verification token
  const newUser = new User({ email, password });
  const token = jwt.sign({ id: newUser._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  newUser.verificationToken = token;  // Store token in user record
  await newUser.save();

  // Send verification email
  await sendVerificationEmail(newUser.email, token);

  res.status(201).json({ message: 'User created, check your email for verification link' });
}));

// Verify Email API
router.get('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, config.jwt.secret);  // Verify token with secret
    const user = await User.findOne({ _id: decoded.id, verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Mark email as verified
    user.isVerified = true;
    user.verificationToken = null;  // Clear token after verification
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error.message);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
}));

 
// Login API
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) {
    return res.status(400).json({ message: 'Invalid credentials or unverified account' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: '1h' });

  res.status(200).json({ token });
}));


module.exports = router;
