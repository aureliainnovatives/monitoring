const express = require('express');
const router = express.Router();
const Source = require('../models/Source');

// @route   POST /api/sources
// @desc    Add a new source
// @access  Public
router.post('/', async (req, res) => {
  const { name, service, type, frequency, rateLimit, apiKey } = req.body;

  // Validate required fields
  if (!name || !service || !type || !frequency) {
    return res.status(400).json({ message: 'Please provide all required fields: name, service, type, frequency.' });
  }

  try {
    // Check if source already exists
    let existingSource = await Source.findOne({ name: name.trim().toLowerCase() });
    if (existingSource) {
      return res.status(400).json({ message: 'Source already exists.' });
    }

    // Create new source with all fields
    const newSource = new Source({
      name: name.trim(),
      service,
      type,
      frequency,
      rateLimit: rateLimit || 60,  // Default rateLimit is 60 if not provided
      apiKey: apiKey ? apiKey.trim() : '',
    });

    await newSource.save();
    res.status(201).json(newSource);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/sources
// @desc    Get all sources
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sources = await Source.find().sort({ createdAt: -1 });
    res.json(sources);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/sources/:id
// @desc    Get a single source by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ message: 'Source not found.' });
    }
    res.json(source);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Source not found.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/sources/:id
// @desc    Update a source by ID
// @access  Public
router.put('/:id', async (req, res) => {
  const { name, service, type, frequency, rateLimit, apiKey } = req.body;

  // Validate required fields
  if (!name || !service || !type || !frequency) {
    return res.status(400).json({ message: 'Please provide all required fields: name, service, type, frequency.' });
  }

  try {
    // Find the source by ID and update it
    const updatedSource = await Source.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        service,
        type,
        frequency,
        rateLimit: rateLimit || 60,
        apiKey: apiKey ? apiKey.trim() : '',
      },
      { new: true }  // Return the updated document
    );

    if (!updatedSource) {
      return res.status(404).json({ message: 'Source not found.' });
    }

    res.json(updatedSource);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/sources/:id
// @desc    Delete a source by ID
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const source = await Source.findByIdAndDelete(req.params.id);

    if (!source) {
      return res.status(404).json({ message: 'Source not found.' });
    }

    res.json({ message: 'Source removed.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Source not found.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
