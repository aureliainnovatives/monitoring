const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
 const config = require('./config/configLoader');
// Import Routes
const keywordsRoute = require('./routes/keywords');
//const mentionsRoute = require('./routes/mentions');
const sourcesRoute = require('./routes/sources'); // Ensure this path is correct
const auth = require('./routes/auth');
// Initialize Express app
const app = express();

const EmailService = require('./services/emailService');  // Import the refactored EmailService
const emailService = new EmailService();  // Instantiate the service
const keywordAssignmentService = require('./services/KeywordAssignmentService');


require('dotenv').config();


// Middleware
app.use(morgan('dev')); // Logging
//app.use(cors());

app.use(cors({
  origin: ['https://noti5.us', 'https://api.noti5.us', 'https://controlpanel.noti5.us', 'http://localhost:8080', 'http://localhost:3000', 'http://localhost:4200'], // allow these origins
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));



app.use(express.json());


// Connect to MongoDB
mongoose.connect(config.system.db, {
//  useNewUrlParser: true,
//  useUnifiedTopology: true,
  // useFindAndModify: false, // Removed as it's no longer supported
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

app.use('/api/auth', auth); // Ensure this path is correct

// Define Routes
app.use('/api/keywords', keywordsRoute);
//app.use('/api/mentions', mentionsRoute);
app.use('/api/sources', sourcesRoute); // Ensure this path is correct

app.get('/send', (req, res) => {
  emailService.sendUserNotifications()
  .then(() => console.log('Manual execution of sendUserNotifications completed.'))
  .catch(err => console.error('Error during manual execution:', err));

  res.send('Notification Sent');
});

app.get('/assign', async(req, res) => {
 // Assign keywords to stories and comments in parallel
  await Promise.all([
    keywordAssignmentService.assignKeywordsToStories(),
    keywordAssignmentService.assignKeywordsToComments()
  ]);

  res.send('Assignment started');
});

const BaseService = require('./services/baseService');
app.get('/reddittest', async(req, res) => {
  const baseService = new BaseService();
  const response = await baseService.fetchData('https://www.reddit.com/search.json?q=blockchain&limit=25&restrict_sr=off&sort=new&type=link');
  res.send(response);
});

// Define a simple route
app.get('/', (req, res) => {
  res.send('Backend Server is Running');
});

// Start the server
const PORT = config.system.port || 3000; // Ensure you're using port 3000 as per your setup
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


console.log("****** DB Connection --> ", config.system.db, " PORT", PORT);
