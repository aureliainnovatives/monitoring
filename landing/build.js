const fs = require('fs');
const path = require('path');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

const inputFiles = ['index.html', 'contact.html'];
const inputDir = __dirname;
const outputDir = path.join(__dirname, 'dist');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

inputFiles.forEach(filename => {
  const inputFile = path.join(inputDir, filename);
  const outputFile = path.join(outputDir, filename);

  let htmlContent = fs.readFileSync(inputFile, 'utf8');

  Object.keys(envConfig).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    htmlContent = htmlContent.replace(regex, envConfig[key]);
  });

  fs.writeFileSync(outputFile, htmlContent);
  console.log(`Built ${env} version of ${filename}`);
});
 

console.log(`Built ${env} version of index.html`);