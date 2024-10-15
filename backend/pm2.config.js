module.exports = {
    apps: [
      {
        name: "api",
        script: "index.js",
        watch: true, 
        log_file: "./logs/api.log",
        error_file: "./logs/api-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        instances: 1,
        autorestart: true,
        env: {
          MODE: 'production',
          BREVO_API_KEY: process.env.BREVO_API_KEY
        }
      },
      {
        name: "crawler",
        watch: true, 
        script: "crawler.js",
        log_file: "./logs/crawler.log",
        error_file: "./logs/crawler-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        instances: 1,
        autorestart: true,
        env: {
          MODE: 'production',
          BREVO_API_KEY: process.env.BREVO_API_KEY
        }
      },
       
      {
        name: 'sentence-transformer',
        watch: true, 
        script: '/sites/noti5.us/monitoring/pycode/venv/bin/python',  // Path to Python in virtual environment
        args: '../pycode/sentence_transformer_service.py',  // Path to your Python file
        log_file: "./logs/sentence-transformer.log",
        error_file: "./logs/sentence-transformer-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
      }
    ]
  };
  