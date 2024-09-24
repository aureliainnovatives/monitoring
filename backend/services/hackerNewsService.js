const BaseService = require('./baseService');
const Source = require('../models/Source');
const moment = require('moment');
const config = require('../config/config');
const Story = require('../models/Stories');

class HackerNewsService extends BaseService {
    constructor(sourceId, keywords) {
        super(sourceId, 1000);  // 1 second rate limit delay
        this.baseUrl = 'https://hn.algolia.com/api/v1';
        this.postsToRecheck = [];  // Store posts to recheck for comments
    }

    // Fetch new stories from Hacker News
    async fetchPosts() {
        const url = `${this.baseUrl}/search_by_date?tags=story&hitsPerPage=${config.hackerNews.hitsPerPage}`;

        const data = await this.fetchData(url);
        const stories = data.hits;

        for (let i = 0; i < stories.length; i++) {
            const story = stories[i];

            let timestamp = new Date(story.created_at);
            if (isNaN(timestamp)) {
               timestamp = new Date();
            }

            const storyPayload = {
                storyId: story.objectID,
                source: this.sourceId,
                title: story.title || 'Untitled',
                content: story.story_text || '',
                url: story.url || '',
                author: story.author || 'Unknown',
                timestamp 
            }
            const storyObject = await this.storePost(storyPayload, storyPayload.storyId, this.sourceId);
            if (storyObject) {
                console.log("*** New Story created from Hacker News --> ",storyObject.title," : ",storyObject._id);
                await this.fetchCommentsForStory(storyObject);
                // Recheck if story is within recheck window (e.g., 72 hours old)
                if (moment().diff(moment(story.created_at), 'hours') < config.hackerNews.maxRecheckDuration) {
                    this.postsToRecheck.push({
                        storyId: story.objectID,
                        lastChecked: moment(),
                        createdAt: moment(story.created_at)
                    });
                }
            }

            // Rate limit after each API request
            await this.rateLimit();
        }
    }

    // Fetch comments for a specific story
    async fetchCommentsForStory(story) {
        const url = `${this.baseUrl}/items/${story.storyId}`;
        const data = await this.fetchData(url);
        const comments = data.children || [];

        for (let comment of comments) {
            let commentPayload = {
                storyId: story._id,
                commentId: comment.id,
                parentId: comment.parent_id,
                content: comment.text || '',
                author: comment.author || 'Unknown',
                timestamp: new Date(comment.created_at),
                source: this.sourceId,
                sourceType: 'post-relevant'
            }

            await this.storeComment(commentPayload);
            console.log("*** New Comment created from Hacker News --> ",commentPayload.commentId," : ",commentPayload._id);
            // Handle nested comments if present
            if (comment.children && comment.children.length > 0) {
                for (let childComment of comment.children) {

                    let commentPayload = {
                        storyId: story._id,
                        commentId: childComment.id,
                        parentId: childComment.parent_id,
                        content: childComment.text || '',
                        author: childComment.author || 'Unknown',
                        timestamp: new Date(childComment.created_at),
                        source: this.sourceId,
                        sourceType: 'post-relevant'
                    }

                    await this.storeComment(commentPayload);
                }
            }

            // Rate limit after each API request
            await this.rateLimit();
        }
    }

    // Recheck past posts for new comments within maxRecheckDuration (e.g., 72 hours)
    async recheckCommentsForPastPosts() {
        try {
            const hackerNewsSource = await Source.findOne({ name: 'HackerNews' });
            const recheckWindowStart = moment().subtract(config.hackerNews.maxRecheckDuration, 'hours').toDate();
            const postsToRecheck = await Story.find({ source: hackerNewsSource._id, timestamp: { $gte: recheckWindowStart } });

            for (let post of postsToRecheck) {
                // Skip posts that are older than the max recheck duration
                if (moment().diff(post.createdAt, 'hours') > config.hackerNews.maxRecheckDuration) {
                    console.log(`Skipping post ${post.storyId}, older than ${config.hackerNews.maxRecheckDuration} hours`);
                    continue;
                }

                // Recheck posts for new comments every 'commentRecheckInterval' hours
                if (moment().diff(post.lastChecked, 'hours') < config.hackerNews.commentRecheckInterval) {
                    continue;
                }

                // Fetch comments for this post
                await this.fetchCommentsForStory(post);
                post.lastChecked = moment();  // Update last checked time

                // Implement rate limiting after every 10 rechecked posts
                if (postsToRecheck.indexOf(post) % 10 === 0) {
                    console.log('Waiting to respect rate limits during recheck...');
                    await this.rateLimit();
                }
            }
        } catch (err) {
            console.error('Error rechecking past posts for comments:', err.message);
        }
    }
}

module.exports = HackerNewsService;
