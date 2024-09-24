const BaseService = require('./baseService');
const config = require('../config/config');
const Keyword = require('../models/Keyword');

class RedditService extends BaseService {
    constructor(sourceId, keywords) {
        super(sourceId, 1500);  // 1.5 second rate limit delay
        this.baseUrl = 'https://www.reddit.com/search.json';  // Reddit search endpoint for keyword-based search
        this.keywords = keywords;  // List of keywords to monitor
    }

        // Entry point for the crawler - this function initiates both post and comment fetching
        async fetchPosts() {
            // Fetch the keywords that haven't been crawled in the last 12 hours
            const batchSize = config.reddit.keywordsPerBatch; // Let's say 10 per batch
            const timeThreshold = Date.now() - config.reddit.delayForKeyword; // 12 hours ago

            const keywordsToCrawl = await Keyword.find({
                $or: [
                  { lastCrawled: { $eq: null } },  // If never crawled before
                  { lastCrawled: { $lt: new Date(Date.now() - config.reddit.delayForKeyword) } }  // Crawled more than 'delayForKeyword' ago
                ]
              });


            if (keywordsToCrawl.length === 0) {
                console.log("No keywords to crawl at this time.");
                return;
            }

            const keywordBatch = keywordsToCrawl.map(k => k.keyword).join(' OR '); // Form the OR condition

            // Step 1: Fetch posts based on a batch of keywords
            await this.fetchPostsByKeyword(keywordBatch);

            // Step 2: Fetch comments that match the batch of keywords (independent of posts)
            await this.fetchCommentsByKeyword(keywordBatch);

            // Update the lastCrawled timestamp for each keyword
            for (let keyword of keywordsToCrawl) {
                keyword.lastCrawled = new Date(); // Update to the current time
                await keyword.save();
            }
        }

   // Fetch posts related to a batch of keywords
    async fetchPostsByKeyword(keywordBatch) {
        const url = `${this.baseUrl}?q=${encodeURIComponent(keywordBatch)}&limit=${config.reddit.hitsPerPage}&restrict_sr=off&sort=new&type=link`;
        console.log("*** Fetching posts with URL --> ", url);
        
        const data = await this.fetchData(url);
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

                // Rate limit after each API request
                await this.rateLimit();
            }
        }
    }


  // Fetch comments based on a batch of keywords
    async fetchCommentsByKeyword(keywordBatch) {
        const url = `${this.baseUrl}?q=${encodeURIComponent(keywordBatch)}&limit=${config.reddit.hitsPerPage}&restrict_sr=off&sort=new&type=comment`;
        console.log("*** Fetching comments with keyword URL --> ", url);

        const data = await this.fetchData(url);
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


    // Fetch comments for a specific post (as per the current logic)
    async fetchCommentsForPost(post) {
        const url = `${post.url}.json`;
        console.log("*** Fetching comments for post with URL --> ", url);
        const data = await this.fetchData(url);
        const comments = data[1]?.data?.children || [];
        let commentCount = 0;

        for (let commentWrapper of comments) {
            const commentData = commentWrapper.data;

            // Filter comments based on the number of upvotes and depth
            if (commentData.ups >= config.reddit.minUpvotes && commentData.depth <= config.reddit.maxDepth) {
                
                // Prepare comment payload
                const timestamp = new Date(commentData.created_utc * 1000);  // Convert to milliseconds
                const commentPayload = {
                    storyId: post._id,  // Associate with the post
                    commentId: commentData.id,
                    parentId: commentData.parent_id || null,  // Handle parent comments
                    content: commentData.body || '',  // The actual comment text
                    author: commentData.author || 'Unknown',  // Comment author
                    timestamp,  // Comment creation time
                    source: this.sourceId,  // Source ID for Reddit
                    sourceType: 'post-relevant'
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
}

module.exports = RedditService;
