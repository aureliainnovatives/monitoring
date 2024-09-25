const axios = require('axios');
const Story = require('../models/Stories');
const Comment = require('../models/Comment');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class BaseService {
    constructor(sourceId, rateLimitDelay = 1000) {
        this.sourceId = sourceId;
        this.rateLimitDelay = rateLimitDelay;  // Default delay between API requests
    }

    async storePost(postData, storyId, sourceId) {
        try {
            const existingStory = await Story.findOne({ storyId });
            if (!existingStory) {
                
                const newStory = new Story(postData);
             
                await newStory.save();
                return newStory;
            }else{
                return null;
            }
        } catch (error) {
            console.error('Error storing post:', error.message);
        }
    }

    async storeComment(commentPayload) {
        try {
            const existingComment = await Comment.findOne({ commentId: commentPayload.commentId });
            if (!existingComment) {
                const newComment = new Comment(commentPayload);
                await newComment.save();                
                return newComment;
            }
        } catch (error) {
            console.error('Error storing comment:', error.message);
        }
    }

    // Helper function to enforce rate limiting
    async rateLimit() {
        console.log(`Waiting for ${this.rateLimitDelay}ms to respect rate limit...`);
        await delay(this.rateLimitDelay);
    }

    // Base API call helper (can be reused by child classes)
    async fetchData(url) {
        try {
          //  const response = await axios.get(url);
          //  return response.data;


            const response = await axios.get(url, {
                headers: {
                  'User-Agent': 'noti5/1.0 (https://noti5.us)'  // Use a valid User-Agent
                }
              });
              return response.data;

        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error.message);
        }
    }
}

module.exports = BaseService;
