const config = {
  hackerNews: {
    hitsPerPage: 100,               // Number of posts to fetch in one request
    fetchInterval: '*/5 * * * *',   // Cron job interval for fetching new posts (every 5 minutes)
    commentRecheckInterval: 6,      // Time interval (in hours) to recheck posts for new comments
    maxRecheckDuration: 240,         // Maximum time (in hours) to keep rechecking comments
    rateLimitDelay: 60000,          // Delay in milliseconds after every 10 requests to respect rate limits (60 seconds)
    allowedPostAge: 72, // new variable to control allowed post age in hours
    baseUrl: "https://hn.algolia.com/api/v1",
  },
  reddit: {
    // Add configurations for Reddit or other services here
    hitsPerPage: 25,               // Number of posts to fetch in one request
    fetchInterval: '*/5 * * * *',   // Cron job interval for fetching new posts (every 5 minutes)
    commentRecheckInterval: 6,      // Time interval (in hours) to recheck posts for new comments
    maxRecheckDuration: 240,         // Maximum time (in hours) to keep rechecking comments
    rateLimitDelay: 60000,          // Delay in milliseconds after every 10 requests to respect rate limits (60 seconds)
    allowedPostAge: 72,
    maxComments: 25,
    minUpvotes: 10,
    maxDepth: 10,
    delayForKeyword: 12 * 60 * 60 * 1000, // 12 hours
    keywordsPerBatch: 10,
    baseUrl: "https://www.reddit.com/search.json",
    
  },
  assignmentService: {
    cronSchedule: '*/5 * * * *', // Cron job every 5 minutes
    batchSize: 1000 // Max stories/comments to process in one iteration
  },
  email: {
      apiKey: "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",  // Replace with your SendInBlue API key
      senderEmail: "mayur.patil@aurelia.tech",
      senderName: "Account Verification",
      
  },
  jwt: {
      secret: "myrandomsecretkey_abrakadabraght345#$%",  // Replace with your JWT secret key
      magicLinkExpiresIn: "1h"
  },
  auth: {
    magicLinkTokenExpiration: 60 * 60, // Token valid for 1 hour (3600 seconds)
    magicLinkFrequency: 5 * 60 * 1000,  // Allow 1 magic link request per 5 minutes
  },
  
  common:{
    baseUrl: "http://localhost:3000",
    apiUrl: "http://localhost:3000",
    controlPanelUrl: "http://localhost:4200",
    landingPageUrl: "http://localhost:8080",

  },
  system:{
    db: "mongodb://root:10gicwaves@4.240.81.251:27017/monitoring?authSource=admin",
    port:3000
  }
};

module.exports = config;
