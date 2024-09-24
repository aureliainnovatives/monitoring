// const express = require('express');
// const router = express.Router();
// const Mention = require('../models/Mention');

// // @route   GET /api/mentions
// // @desc    Get all mentions
// // @access  Public
// router.get('/', async (req, res) => {
//   try {
//     const mentions = await Mention.find().sort({ timestamp: -1 }).limit(100);
//     res.json(mentions);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// // @route   GET /api/mentions/:keyword
// // @desc    Get mentions by keyword
// // @access  Public
// router.get('/:keyword', async (req, res) => {
//   try {
//     const mentions = await Mention.find({ keyword: req.params.keyword.toLowerCase() }).sort({ timestamp: -1 }).limit(100);
//     res.json(mentions);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// module.exports = router;
