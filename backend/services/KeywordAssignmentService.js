const config = require('../config/configLoader');
const Keyword = require('../models/Keyword');
const Story = require('../models/Stories');
const Comment = require('../models/Comment');
const BaseService = require('./baseService');  // Assuming vector-related methods are available here

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
            console.log(`Post vector length for story "${story.title}": ${story.vector.length}`);

            for (let keyword of keywords) {
                if (keyword.expressionType === 'keyword') {
                    // Traditional exact keyword matching
                    if (this.matchKeyword(keyword, story.title, story.content)) {
                        matchedKeywords.push({
                            keyword: keyword.keyword,
                            score: 1  // Store the relevance score
                        });
                    }
                } else if (keyword.expressionType === 'ai') {
                    // AI relevance matching
//                    const isRelevant = await this.matchAIKeyword(keyword, story.vector, story.title);
                    const relevanceResult = await this.matchAIKeyword(keyword, story.vector, story.title);

                    if (relevanceResult.isRelevant) {
                        matchedKeywords.push({
                            keyword: keyword.keyword,
                            score: relevanceResult.score  // Store the relevance score
                        });
                    }
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
                if (keyword.expressionType === 'keyword') {
                    // Traditional exact keyword matching
                    if (this.matchKeyword(keyword, comment.content)) {
                        matchedKeywords.push({
                            keyword: keyword.keyword,
                            score: 1  // Store the relevance score
                        });
                    }
                } else if (keyword.expressionType === 'ai') {
                  

                    const relevanceResult = await this.matchAIKeyword(keyword, comment.vector, story.title);

                    if (relevanceResult.isRelevant) {
                        matchedKeywords.push({
                            keyword: keyword.keyword,
                            score: relevanceResult.score  // Store the relevance score
                        });
                    }


                }
            }

            if (matchedKeywords.length > 0) {
                comment.matchedKeywords = matchedKeywords;
                await comment.save();
                console.log(`Assigned keywords to comment: ${comment.content.substring(0, 50)}`);
            }
        }
    }

    // Helper method to match traditional exact keywords
    matchKeyword(keyword, title = '', content = '') {
        const exactMatch = new RegExp(`\\b${keyword.keyword}\\b`, 'i');
        return exactMatch.test(title) || exactMatch.test(content);
    }

    // Helper method to match AI-relevant keywords using vector similarity
    async matchAIKeyword(keyword, postVector, title) {
        // Generate embedding for the keyword using the Python service
        const keywordWithPrompt = `User is interested in topic: ${keyword.keyword}`;
        const keywordVector = await BaseService.prototype.generateEmbedding(keywordWithPrompt);
        if (!keywordVector) {
            console.error(`Failed to generate embedding for keyword: ${keyword.keyword}`);
            return { isRelevant: false, score: 0 }; // Return object with both relevance and score
        }
        console.log(`Keyword vector length for keyword "${keyword.keyword}": ${keywordVector.length}`);

        // Compute cosine similarity between the keyword and post vectors
        const similarity = this.computeCosineSimilarity(keywordVector, postVector);
        console.log("**** Post : ", title);
        console.log("**** Score :",similarity);
        console.log("**** Keyword :",keyword.keyword);
        console.log("**** isRelevant :",(similarity >= 0.3));
        console.log("********** END ********** \n\n\n\n /n/n/n");

        // Set a threshold for relevance (e.g., 0.7)
        const isRelevant = similarity > 0.3;
        return { isRelevant, score: similarity };

    }

    // Helper method to compute cosine similarity between two vectors
    computeCosineSimilarity(vectorA, vectorB) {
        const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
        const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

        if (magnitudeA === 0 || magnitudeB === 0) return 0;  // Avoid division by zero
        return dotProduct / (magnitudeA * magnitudeB);
    }
}

module.exports = new KeywordAssignmentService();
