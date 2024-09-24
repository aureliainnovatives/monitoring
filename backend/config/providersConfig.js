// config/providersConfig.js
module.exports = {
    providers: [
      {
        name: 'Reddit',
        service: 'redditService',
        type: 'batch',               // Can be 'batch' or 'single'
        frequency: '*/10 * * * *',   // Every 10 minutes
        rateLimit: 60,               // Free tier limit for Reddit (requests per minute)
      },
      {
        name: 'HackerNews',
        service: 'hackerNewsService',
        type: 'single',              // For single keyword queries
        frequency: '*/15 * * * *',   // Every 15 minutes
        rateLimit: 60,               // Free tier limit
      },
      // Add more providers here as needed
    ]
  };
  