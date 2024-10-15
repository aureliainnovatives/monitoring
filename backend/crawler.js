const cron = require('node-cron');
const mongoose = require('mongoose');
const Keyword = require('./models/Keyword');
const Source = require('./models/Source');  // Import the updated Source model
const config = require('./config/configLoader');
const keywordAssignmentService = require('./services/KeywordAssignmentService');
const EmailService = require('./services/emailService');  // Import the refactored EmailService
const emailService = new EmailService();  // Instantiate the service
 
// Connect to MongoDB
mongoose.connect(config.system.db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected for crawler'))
  .catch(err => console.log('MongoDB connection error:', err.message));

// Dynamically load the provider service
const loadService = (source, keywords) => {
  try {
    const ServiceClass = require(`./services/${source.service}`);
    return new ServiceClass(source, keywords);
  } catch (error) {
    console.error(`Error loading service ${source.service}:`, error.message);
    return null;
  }
};



const runCrawler = async (source) => {
  try {
    console.log(`Running crawler for: ${source.name}, using service: ${source.service}`);

    const keywords = await Keyword.find();  // Get all active keywords
    if (keywords.length === 0) {
      console.log('No active keywords to search for.');
      return;
    }

    const serviceInstance = loadService(source, keywords);
    if (!serviceInstance) {
      console.error(`Service ${source.service} could not be loaded.`);
      return;
    }

    // Handle different types of crawling
    if (source.type === 'batch') {
      await serviceInstance.fetchPosts();  // For batch processing
    } else if (source.type === 'single') {
      for (let keyword of keywords) {
        await serviceInstance.fetchPosts(keyword);  // For single keyword processing
      }
    } else if (source.type === 'recheck') {
      await serviceInstance.recheckCommentsForPastPosts();  // Recheck comments
    }
  } catch (err) {
    console.error(`Error running ${source.name} crawler:`, err.message);
  }
};


// Dynamically schedule crawlers based on provider frequency from the Source collection
const scheduleProviders = async () => {
  try {
    const sources = await Source.find();  // Fetch all active sources

    sources.forEach(async (source) => {
      console.log(`Running ${source.name} crawler immediately...`);
      await runCrawler(source);  // Immediately run the crawler on startup

      cron.schedule(source.frequency, () => {  // Use frequency from the Source model
        console.log(`Running ${source.name} crawler as per schedule...${source.frequency}`);
        runCrawler(source);  // Pass the source to the runCrawler function
      });
    });
  } catch (err) {
    console.error('Error scheduling providers:', err.message);
  }
};



// Keyword assignment cron job (runs every 5 minutes based on config)
cron.schedule(config.assignmentService.cronSchedule, async () => {
  console.log('Keyword assignment job started.');

  // Assign keywords to stories and comments in parallel
  await Promise.all([
      keywordAssignmentService.assignKeywordsToStories(),
      keywordAssignmentService.assignKeywordsToComments()
  ]);

  console.log('Keyword assignment job completed.');
});

   keywordAssignmentService.assignKeywordsToStories(),
   

console.log('Keyword assignment job completed.');
 

// Cron job for sending user notifications at 10 AM daily
cron.schedule('0 10 * * *', async () => {
  console.log('Running the notification cron job at 10 AM every day...');
  await emailService.sendUserNotifications();  // Call the email sending function

});

// You can also manually run it for testing
/*emailService.sendUserNotifications()
  .then(() => console.log('Manual execution of sendUserNotifications completed.'))
  .catch(err => console.error('Error during manual execution:', err));
*/

// Initial run to schedule all providers
scheduleProviders();
