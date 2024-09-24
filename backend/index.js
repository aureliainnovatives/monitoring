const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import Routes
const keywordsRoute = require('./routes/keywords');
//const mentionsRoute = require('./routes/mentions');
const sourcesRoute = require('./routes/sources'); // Ensure this path is correct
const auth = require('./routes/auth');
// Initialize Express app
const app = express();

const EmailService = require('./services/emailService');  // Import the refactored EmailService
const emailService = new EmailService();  // Instantiate the service


// Middleware
app.use(morgan('dev')); // Logging
//app.use(cors());

app.use(cors({
  origin: ['https://noti5.us', 'https://api.noti5.us', 'https://controlpanel.noti5.us'], // allow these origins
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));



app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

// Define a simple route
app.get('/', (req, res) => {
  res.send('Backend Server is Running');
});

// Start the server
const PORT = process.env.PORT || 3000; // Ensure you're using port 3000 as per your setup
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
