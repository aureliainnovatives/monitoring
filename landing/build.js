const fs = require('fs');
const path = require('path');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

const inputFile = path.join(__dirname, 'index.html');
const outputFile = path.join(__dirname, 'dist', 'index.html');

let htmlContent = fs.readFileSync(inputFile, 'utf8');

Object.keys(envConfig).forEach(key => {
  const regex = new RegExp(`{{${key}}}`, 'g');
  htmlContent = htmlContent.replace(regex, envConfig[key]);
});

if (!fs.existsSync(path.dirname(outputFile))) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
}

fs.writeFileSync(outputFile, htmlContent);

console.log(`Built ${env} version of index.html`);