const config = require('../config/config');
const Keyword = require('../models/Keyword');
const Story = require('../models/Stories');
const Comment = require('../models/Comment');

class KeywordAssignmentService {
    constructor() {
        this.batchSize = config.assignmentService.batchSize;
    }

    // Fetch unassigned stories and assign keywords
    async assignKeywordsToStories() {
        const keywords = await Keyword.find();
        const unassignedStories = await Story.find({ matchedKeywords: { $size: 0 } }).limit(this.batchSize);

        for (let story of unassignedStories) {
            let matchedKeywords = [];
            for (let keyword of keywords) {
                if (this.matchKeyword(keyword, story.title, story.content)) {
                    matchedKeywords.push(keyword.keyword);  // Store the keyword string
                }
            }

            if (matchedKeywords.length > 0) {
                story.matchedKeywords = matchedKeywords;
                await story.save();
                console.log(`Assigned keywords to story: ${story.title}`);
            }
        }
    }

    // Fetch unassigned comments and assign keywords
    async assignKeywordsToComments() {
        const keywords = await Keyword.find();
        const unassignedComments = await Comment.find({ matchedKeywords: { $size: 0 } }).limit(this.batchSize);

        for (let comment of unassignedComments) {
            let matchedKeywords = [];
            for (let keyword of keywords) {
                if (this.matchKeyword(keyword, comment.content)) {
                    matchedKeywords.push(keyword.keyword);  // Store the keyword string
                }
            }

            if (matchedKeywords.length > 0) {
                comment.matchedKeywords = matchedKeywords;
                await comment.save();
                console.log(`Assigned keywords to comment: ${comment.content.substring(0, 50)}`);
            }
        }
    }

       // Helper method to match keywords (for exact, contains, and regex)
        matchKeyword(keyword, title = '', content = '') {
            if (keyword.expressionType === 'exact') {
                // Exact match: Both title and content must contain the full keyword phrase
                const exactMatch = new RegExp(`\\b${keyword.keyword}\\b`, 'i');  // Ensures exact phrase match with word boundaries
                return exactMatch.test(title) || exactMatch.test(content);

            } else if (keyword.expressionType === 'contains') {
                // Contains match: At least one part of the phrase should appear
                const containsMatch = new RegExp(`${keyword.keyword.split(' ').join('|')}`, 'i');  // Matches any word from the keyword phrase
                return containsMatch.test(title) || containsMatch.test(content);

            } else if (keyword.expressionType === 'regex') {
                // Regex match: Use the provided regex pattern
                const regex = new RegExp(keyword.keyword);
                return regex.test(title) || regex.test(content);
            }

            return false;
        }

}

module.exports = new KeywordAssignmentService();
