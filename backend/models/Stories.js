const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    storyId: {  // Unique identifier from the source (e.g., Hacker News or Reddit)
        type: String,
        required: true,
        unique: true,
    },
    source: {
        type: mongoose.Schema.Types.ObjectId,  // Reference to Source collection
        ref: 'Source',
        required: true,  // Always required to track the source of the story
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        trim: true,
        default: '',  // Default to empty string if content is not provided
    },
    url: {
        type: String,
        required: false,
        default: '',  // Optional field, defaulting to an empty string
    },
    author: {
        type: String,
        required: true,
        trim: true,
        default: 'Unknown',  // Default to 'Unknown' if author is missing
    },
    timestamp: {
        type: Date,
        required: true,  // Ensure valid timestamp is always present
    },
    sentimentScore: {
        type: Number,  // Optional sentiment score
        default: 0,
    },
     // New vector field for storing the vector representation of the post
     vector: {
        type: [Number],  // This will be an array of numbers representing the vector
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
     
    matchedKeywords: [{
        keyword: { type: String },  // The matched keyword
        score: { type: Number }  // The relevance score of the keyword
    }]
});

module.exports = mongoose.model('Story', StorySchema);
