const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  
  storyId: {  // Reference to the Story (post)
    type: mongoose.Types.ObjectId,
    required: false,
  },
  commentId: {  // External Comment ID from Reddit or Hacker News
    type: String,
    required: true,
    unique: true,  // Ensure no duplicate comments based on commentId
  },
  content: {
    type: String,
    trim: true,
    required: false,  // Content may be missing, e.g., in Hacker News 'Ask HN' cases
    default: '',  // Default to empty string if content is not available
  },
  author: {
    type: String,
    required: true,
    trim: true,
    default: 'Unknown',  // Default to 'Unknown' if author is not present
  },
  timestamp: {
    type: Date,
    required: true,  // Both Reddit and Hacker News provide a timestamp
  },
  sentimentScore: {
    type: Number,
    default: 0,  // Placeholder for sentiment analysis
  },
  source: {  // Reference to the Source (Reddit, Hacker News, etc.)
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Source'
  },
  parentId: {  // For handling nested comments (can be null for top-level comments)
    type: String,
    default: 0  // Default to null if no parent comment exists
  },
  sourceType: {  // 'post-relevant' or 'comment-relevant'
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: false,
    default: ''
  },
  matchedKeywords: [{
      type: String       
  }]

}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
