// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Sib = require("sib-api-v3-sdk");
const config = require('../config/config');
const bcrypt = require('bcrypt');

// Send magic link function
async function sendMagicLinkEmail(userEmailId, token) {
  const client = Sib.ApiClient.instance;
  const apiKey = client.authentications["api-key"];
  apiKey.apiKey = config.email.apiKey;

  const tranEmailApi = new Sib.TransactionalEmailsApi();
  const sender = {
    email: config.email.senderEmail,
    name: config.email.senderName,
  };

  const receivers = [{ email: userEmailId }];
  const magicLink = `${config.email.baseUrl}/api/auth/magic-link-login?token=${token}`;

  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Login: Your Magic Link",
    htmlContent: `
      Hi,<br><br>

      I’m Mayur Patil, the creator of Noti5, and I wanted to personally thank you for signing up. We’re excited to help you track the conversations that matter most to you.<br><br>

      Please click the link below to verify your email and access your dashboard:<br><br>
      <a href="${magicLink}">${magicLink}</a><br><br>

      If you have any questions, feel free to reply to this email.<br><br>

      Regards,<br>
      Mayur Patil<br>
      Noti5
    `,
  });
}

// Request Magic Link API
router.post('/request-magic-link', asyncHandler(async (req, res) => {
  console.log('Request Headers:', req.headers); // Add this to see the incoming headers

  const { email } = req.body;

  let user = await User.findOne({ email });
  if (!user) {
    // Create new user if not exists
    user = new User({ email });
    await user.save();
    console.log('User created:', user);
  }else
   {
    return res.status(400).json({ message: 'User already exists. Please login instead.' });
  }

  const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: config.jwt.magicLinkExpiresIn });
  user.verificationToken = token;
  await user.save();
  console.log('Token:', token);
  await sendMagicLinkEmail(user.email, token);
  console.log('Email sent');
  res.status(200).json({ message: 'Magic link sent to your email' });
}));

// Magic Link Login API
// Handle Magic Link login and redirect
router.get('/magic-link-login', asyncHandler(async (req, res) => {
    const { token } = req.query;
  
    try {
      // Verify the magic link token
      const decoded = jwt.verify(token, config.jwt.secret);
      console.log(decoded);
      const user = await User.findOne({ _id: decoded.id, verificationToken: token });
      console.log(user);
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      // Mark email as verified and clear the magic link token
      user.isVerified = true;
      user.magicLinkToken = null;
      await user.save();
  
       // Check if the user has set a password
       if (!user.password) {
        // Redirect to password setup if no password is set
        const passwordSetupUrl = `${config.angular.baseUrl}/password-setup?token=${token}`;
        return res.redirect(passwordSetupUrl);
      }

      // Generate a new JWT for authenticated session
      const authToken = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: '1h' });
  
      const angularDashboardUrl = `${config.angular.baseUrl}/magic-link?token=${authToken}`;
      res.redirect(angularDashboardUrl);

      // Redirect to the Angular dashboard or send the token in the response
      //res.status(200).json({ token: authToken, message: 'Login successful' });
    } catch (error) {
      console.error('Magic Link Login Error:', error.message);
      res.status(400).json({ message: 'Invalid or expired token' });
    }
  }));
  
// Password setup route (for first-time password creation)
router.post('/setup-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, config.jwt.secret);
    let user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or user not found' });
    }

    user.password = password;

    // Save the user record with the new password
    await user.save();

    const authToken = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: '1h' });

    // Send the new token back to the frontend
    res.status(200).json({ token: authToken, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error setting up password:', error.message);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
}));



 // Login API (to verify user credentials and return a token)
 router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });
  console.log('User found:', user);

  if (!user || !user.isVerified) {
    return res.status(400).json({ message: 'Invalid credentials or unverified account' });
  }

  // Compare the entered password with the hashed password stored in the database
  const isMatch = await bcrypt.compare(password, user.password);  // Dynamically compare entered password
  console.log('Password match status:', isMatch);
  console.log('Entered password:', password);
  console.log('Hashed password in DB:', user.password);

  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Generate a JWT token for the user
  const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: '1h' });

  res.status(200).json({ token });
}));

 


module.exports = router;
