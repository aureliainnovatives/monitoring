const dotenv = require('dotenv');
dotenv.config();

const mode = process.env.MODE || 'development';

let config;
if (mode === 'production') {
    config = require('./config');
} else {
    config = require('./config-dev');
}

module.exports = config;