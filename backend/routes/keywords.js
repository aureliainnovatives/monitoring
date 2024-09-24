const express = require('express');
const router = express.Router();
const Keyword = require('../models/Keyword');
const Source = require('../models/Source');
const auth = require('../middleware/auth');  // JWT Authentication middleware

// @route   POST /api/keywords
// @desc    Add a new keyword
// @access  Private (Authenticated User)
router.post('/', auth, async (req, res) => {
  const { keyword, sources, expressionType, mentionFormat } = req.body;

  if (!keyword) {
    return res.status(400).json({ message: 'Keyword is required.' });
  }

  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ message: 'At least one source is required.' });
  }

  try {
    // Validate sources
    const validSources = await Source.find({ _id: { $in: sources } });
    if (validSources.length !== sources.length) {
      return res.status(400).json({ message: 'One or more sources are invalid.' });
    }

    // Check if keyword already exists for this user
    let existingKeyword = await Keyword.findOne({ keyword: keyword.trim().toLowerCase(), user: req.user._id });
    if (existingKeyword) {
      return res.status(400).json({ message: 'Keyword already exists for this user.' });
    }

    // Create new keyword associated with the authenticated user
    const newKeyword = new Keyword({
      keyword: keyword.trim().toLowerCase(),
      sources,
      expressionType: expressionType || 'contains',
      mentionFormat: mentionFormat || 'none',
      user: req.user._id  // Attach the authenticated user to the keyword
    });

    await newKeyword.save();
    res.status(201).json(newKeyword);
  } catch (err) {
    console.error('Error adding keyword:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/keywords
// @desc    Get all keywords for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const keywords = await Keyword.find({ user: req.user._id }).populate('sources', '_id name').sort({ createdAt: -1 });
    res.json(keywords);
  } catch (err) {
    console.error('Error fetching keywords:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/keywords/:id
// @desc    Update a keyword
// @access  Private (Only the user who owns the keyword can update it)
router.put('/:id', auth, async (req, res) => {
  const { keyword, sources, expressionType, mentionFormat } = req.body;

  try {
    let keywordToUpdate = await Keyword.findOne({ _id: req.params.id, user: req.user._id });

    if (!keywordToUpdate) {
      return res.status(404).json({ message: 'Keyword not found or you are not authorized.' });
    }

    // Validate sources if provided
    if (sources && Array.isArray(sources)) {
      const validSources = await Source.find({ _id: { $in: sources } });
      if (validSources.length !== sources.length) {
        return res.status(400).json({ message: 'One or more sources are invalid.' });
      }
      keywordToUpdate.sources = sources;  // Update the sources
    }

    if (keyword) {
      keywordToUpdate.keyword = keyword.trim().toLowerCase();
    }

    if (expressionType) {
      keywordToUpdate.expressionType = expressionType;
    }

    if (mentionFormat) {
      keywordToUpdate.mentionFormat = mentionFormat;
    }

    await keywordToUpdate.save();
    res.json(keywordToUpdate);  // Return the updated keyword
  } catch (err) {
    console.error('Error updating keyword:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Keyword not found.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/keywords/:id
// @desc    Delete a keyword
// @access  Private (Only the user who owns the keyword can delete it)
router.delete('/:id', auth, async (req, res) => {
  try {
    const keyword = await Keyword.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found or you are not authorized.' });
    }

    res.json({ message: 'Keyword removed.' });
  } catch (err) {
    console.error('Error deleting keyword:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Keyword not found.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
