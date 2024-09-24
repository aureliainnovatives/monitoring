const mongoose = require('mongoose');

const SourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  service: {
    type: String,
    required: true,  // Service class name (e.g., 'redditService')
  },
  type: {
    type: String,
    enum: ['batch', 'single'],
    required: true,  // 'batch' or 'single' keyword crawling
  },
  frequency: {
    type: String,
    required: true,  // Cron-style frequency (e.g., '*/10 * * * *')
  },
  rateLimit: {
    type: Number,
    default: 60,  // Requests per minute
  },
  apiKey: {
    type: String,
    trim: true,
    default: '', // Placeholder for future API keys
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Source', SourceSchema);
