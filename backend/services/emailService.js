// services/emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const config = require('../config/configLoader');
const User = require('../models/User');
const Story = require('../models/Stories');
const Comment = require('../models/Comment');
const Keyword = require('../models/Keyword');

class EmailService {
  constructor() {
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    this.emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  // Method to send individual email
  async sendEmail(toEmail, subject, content) {
    try {
      const sendSmtpEmail = {
        sender: { email: config.email.senderEmail, name: config.email.senderName },
        to: [{ email: toEmail }],
        subject: subject,
        textContent: content,
      };

      const response = await this.emailApi.sendTransacEmail(sendSmtpEmail);
      console.log(`Email sent to ${toEmail}:`, response);
    } catch (error) {
      console.error(`Failed to send email to ${toEmail}:`, error);
    }
  }

  async sendUserNotifications() {
    try {
      const keywords = await Keyword.find().populate('user');

      if (keywords.length === 0) {
        console.log('No keywords found.');
        return;
      }

      console.log(`Found ${keywords.length} keywords.`);

      const userKeywordMap = new Map();

      keywords.forEach(keyword => {
        const userId = keyword.user._id.toString();
        if (!userKeywordMap.has(userId)) {
          userKeywordMap.set(userId, {
            user: keyword.user,
            keywords: [],
          });
        }
        userKeywordMap.get(userId).keywords.push(keyword.keyword);
      });

      for (const [userId, { user, keywords: userKeywords }] of userKeywordMap.entries()) {
        if (!user) {
          console.log(`User with ID ${userId} not found.`);
          continue;
        }

        console.log(`Processing user: ${user.email}`);

        // Handle the case where lastNotifiedAt is not set
        const lastNotifiedAt = user.lastNotifiedAt || new Date(0); // Default to the Unix epoch (1970-01-01) if not set
        console.log(userKeywords)
        console.log(lastNotifiedAt)
        console.log(`Last notified at: ${lastNotifiedAt} and Keyword is ${userKeywords}`);

        // Fetch new stories with relevance score and sort by it
        let newStories = await Story.aggregate([
          {
            $match: {
              matchedKeywords: {
                $elemMatch: {
                  keyword: { $in: userKeywords.map(kw => new RegExp(`^${kw}$`, 'i')) },
                  score: { $exists: true } // Only consider keywords with a relevance score
                }
              },
              createdAt: { $gt: lastNotifiedAt }
            }
          },
          {
            $addFields: {
              highestRelevanceScore: { $max: "$matchedKeywords.score" }
            }
          },
          {
            $sort: { highestRelevanceScore: -1 }
          }
        ]);

        // Manually populate 'source' since aggregation won't populate it
        newStories = await Story.populate(newStories, { path: 'source' });
        console.log(`New stories: ${newStories}`);

        // Fetch new comments similarly and include the highest relevance score
        const newComments = await Comment.aggregate([
          {
            $match: {
              matchedKeywords: {
                $elemMatch: {
                  keyword: { $in: userKeywords.map(kw => new RegExp(`^${kw}$`, 'i')) },
                  score: { $exists: true }
                }
              },
              createdAt: { $gt: lastNotifiedAt }
            }
          },
          {
            $addFields: {
              highestRelevanceScore: { $max: "$matchedKeywords.score" }
            }
          },
          {
            $sort: { highestRelevanceScore: -1 }
          }
        ]);
        console.log(`New comments: ${newComments}`);

        if (newStories.length === 0 && newComments.length === 0) {
          console.log(`No new stories or comments for user: ${user.email}`);
          continue;
        }

        let emailContent = `
        Hello, Here are the latest stories and comments for you -

        `;

        // Add stories to the email content
        newStories.forEach(story => {
          // Truncate description to 2 lines (100 characters max)
          const description = story.content
            ? (story.content.length > 100
              ? `${story.content.substring(0, 100)}...`
              : story.content)
            : null; // No description

          // Adding story details (source, title, relevance score, timestamp, and link)
          emailContent += `${story.title} (${story.source.name || 'Unknown Source'}) \n`;

          if (description) {
          //  emailContent += `${description}\n`;
          }

          emailContent += `${story.url}\n${'by ' + story.author} - ${story.timestamp.toDateString()} ${story.timestamp.toTimeString()}\n\n`;
        });

        // Add comments to the email content
        newComments.forEach(comment => {
          // Truncate comment content to 2 lines (100 characters max)
          const commentContent = comment.content
            ? (comment.content.length > 100
              ? `${comment.content.substring(0, 100)}...`
              : comment.content)
            : null; // No content

          // Adding comment details (content, relevance score, timestamp, and link)
          emailContent += `Comment: ${commentContent ? commentContent : 'No content available'}  `;
          emailContent += `${comment.timestamp.toDateString()} ${comment.timestamp.toTimeString()}\n${comment.url || 'No link available'}\nby ${comment.author}\n\n`;
        });

        // Send the email using the sendEmail function
        await this.sendEmail(user.email, 'noti5.us - Your Notifications', emailContent);
        console.log(`Notification email sent to: ${user.email}`);

        // Update user's lastNotifiedAt to the current time
        user.lastNotifiedAt = new Date();
        await user.save();
      }

    } catch (error) {
      console.error('Error fetching users or sending notifications:', error);
    }
  }

}

module.exports = EmailService;
