const mongoose = require('mongoose');

const KeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  sources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true,
  }],
  expressionType: {
    type: String,
    enum: ['exact', 'contains', 'regex'],
    default: 'contains',
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,  // Associate keyword with a specific user
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastCrawled: { type: Date, default: null }  // Store the last crawled timestamp

});


module.exports = mongoose.model('Keyword', KeywordSchema);
