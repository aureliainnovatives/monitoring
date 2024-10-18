wconst BaseService = require('./baseService');
const config = require('../config/configLoader');
const axios = require('axios');
const Keyword = require('../models/Keyword');

class RedditService extends BaseService {
    constructor(sourceId, keywords) {
        super(sourceId, 1500);  // 1.5 second rate limit delay
        this.baseUrl = config.reddit.baseUrl;  // Reddit search endpoint
        this.keywords = keywords;  // List of keywords to monitor
        this.token = null;  // OAuth token
        this.tokenExpiry = null;  // Token expiration time
    }

    // Function to fetch Reddit OAuth Token
    async fetchRedditToken() {
        // Check if token is still valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            console.log('Using cached Reddit OAuth token');
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');

            // Basic authentication header for Reddit OAuth
            const basicAuth = Buffer.from(`${config.reddit.clientId}:${config.reddit.clientSecret}`).toString('base64');

            const response = await axios.post(config.reddit.authUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${basicAuth}`,
                    'User-Agent': config.reddit.userAgent
                }
            });

            this.token = response.data.access_token;  // Store the OAuth token
            const expiresIn = response.data.expires_in || 3600;  // Tokens typically expire in 1 hour
            this.tokenExpiry = Date.now() + expiresIn * 1000;  // Calculate expiry time

            console.log('Fetched new Reddit OAuth token:', this.token);
        } catch (error) {
            console.error('Error fetching Reddit OAuth token:', error.message);
        }
    }

    // Entry point for the crawler - this function initiates both post and comment fetching
    async fetchPosts() {
        try {
            // Step 1: Fetch the OAuth token
            await this.fetchRedditToken();  // Fetch or refresh the OAuth token

            // Step 2: Fetch the keywords that haven't been crawled in the last 12 hours
            const batchSize = config.reddit.keywordsPerBatch; // Example: 10 per batch
            const timeThreshold = Date.now() - config.reddit.delayForKeyword; // 12 hours ago

            const keywordsToCrawl = await Keyword.find({
                $or: [
                    { lastCrawled: { $eq: null } },  // If never crawled before
                    { lastCrawled: { $lt: new Date(timeThreshold) } }  // Crawled more than 'delayForKeyword' ago
                ]
            });

            if (keywordsToCrawl.length === 0) {
                console.log("No keywords to crawl at this time.");
                return;
            }

            const keywordBatch = keywordsToCrawl.map(k => k.keyword).join(' OR '); // Form the OR condition

            // Step 3: Fetch posts based on a batch of keywords
            await this.fetchPostsByKeyword(keywordBatch);

            // Step 4: Fetch comments that match the batch of keywords
            await this.fetchCommentsByKeyword(keywordBatch);

            // Step 5: Update the lastCrawled timestamp for each keyword
            for (let keyword of keywordsToCrawl) {
                keyword.lastCrawled = new Date(); // Update to the current time
                await keyword.save();
            }
        } catch (error) {
            console.error('Error running Reddit crawler:', error.message);
        }
    }

    // Fetch posts related to a batch of keywords
    async fetchPostsByKeyword(keywordBatch) {
        const url = `${this.baseUrl}?q=${encodeURIComponent(keywordBatch)}&limit=${config.reddit.hitsPerPage}&restrict_sr=off&sort=new&type=link`;
        console.log("*** Fetching posts with URL --> ", url);

        const data = await this.fetchData(url);
        if (!data || !data.data) {
            console.error('Error fetching posts, skipping this batch.');
            return;
        }

        const posts = data.data.children || [];
        for (let postWrapper of posts) {
            const postData = postWrapper.data;

            // Prepare post payload
            const timestamp = new Date(postData.created_utc * 1000);  // Convert to milliseconds
            const postPayload = {
                storyId: postData.id,
                source: this.sourceId,
                title: postData.title || 'Untitled',
                content: postData.selftext || '',
                url: `https://www.reddit.com${postData.permalink}`,
                author: postData.author || 'Unknown',
                timestamp
            };

            const postObject = await this.storePost(postPayload, postData.id, this.sourceId);
            if (postObject) {
                console.log("*** New Story created from Reddit --> ", postObject.title, " : ", postObject._id);
            }

            // Rate limit after each API request
            await this.rateLimit();
        }
    }

    // Fetch comments based on a batch of keywords
    async fetchCommentsByKeyword(keywordBatch) {
        const url = `${this.baseUrl}?q=${encodeURIComponent(keywordBatch)}&limit=${config.reddit.hitsPerPage}&restrict_sr=off&sort=new&type=comment`;
        console.log("*** Fetching comments with keyword URL --> ", url);

        const data = await this.fetchData(url);
        if (!data || !data.data) {
            console.error('Error fetching comments, skipping this batch.');
            return;
        }

        const comments = data.data.children || [];
        let commentCount = 0;

        for (let commentWrapper of comments) {
            const commentData = commentWrapper.data;

            // Filter comments based on the number of upvotes
            if (commentData.ups >= config.reddit.minUpvotes) {
                // Prepare comment payload
                const timestamp = new Date(commentData.created_utc * 1000);  // Convert to milliseconds
                const commentUrl = `https://www.reddit.com${commentData.permalink}${commentData.id}/`;

                const commentPayload = {
                    commentId: commentData.id,
                    parentId: commentData.parent_id || null,  // Handle parent comments if needed
                    content: commentData.body || '',  // The actual comment text
                    author: commentData.author || 'Unknown',
                    timestamp,
                    source: this.sourceId,
                    sourceType: 'keyword-comment',
                    url: commentUrl || ''  // Add the comment URL to the payload
                };

                await this.storeComment(commentPayload);
                commentCount++;
                console.log("*** New Comment created from Reddit --> ", commentPayload.commentId);
            }

            // Stop after reading max comments based on config
            if (commentCount >= config.reddit.maxComments) {
                break;
            }

            // Rate limit after each API request
            await this.rateLimit();
        }
    }

    // Helper method to fetch data from Reddit API
    async fetchData(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'User-Agent': config.reddit.userAgent
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching data from Reddit:', error.message);
        }
    }
}

module.exports = RedditService;
