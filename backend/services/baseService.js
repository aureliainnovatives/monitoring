 
const readline = require('readline');  // Add this line
const axios = require('axios');
const Story = require('../models/Stories');
const Comment = require('../models/Comment');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const config = require('../config/configLoader');
 
class BaseService {
    constructor(sourceId, rateLimitDelay = 1000) {
        this.sourceId = sourceId;
        this.rateLimitDelay = rateLimitDelay;  

    }

 // Function to call the Python service to generate embeddings
    async generateEmbedding(sentence) {
        try {
            console.log("**** Calling Python Service at :",config.common.sentenceTransformerUrl);
            // Update the URL to use port 4000
            const response = await axios.post(config.common.sentenceTransformerUrl, {
                sentence: sentence
            });
            return response.data.embedding;
        } catch (error) {
            console.error('Error generating embedding:', error.message);
            return null;
        }
    }

    async storePost(postData, storyId, sourceId) {
        try {
            const existingStory = await Story.findOne({ storyId });
            if (!existingStory) {
             
                const postWithPrompt = `This post is about: ${postData.title}. ${postData.content}`;
                 const postVector = await this.generateEmbedding(postWithPrompt);
 
                 // Add embedding to post data
                 postData.vector = postVector;
 
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
                    'User-Agent': 'noti5/1.0 ('+config.common.baseUrl+')',  // Set a valid User-Agent
                    'Accept': 'application/json',
                                  }
              });
              console.log("URL: ",url);
              console.log("Response Count: ",response.data.length);
              console.log("Response: ",response.data.hits);
              return response.data;

        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error.message);
        }
    }
 
}

module.exports = BaseService;
