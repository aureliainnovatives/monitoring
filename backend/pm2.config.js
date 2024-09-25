module.exports = {
    apps: [
      {
        name: "api",
        script: "index.js",
        log_file: "./logs/api.log",
        error_file: "./logs/api-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        instances: 1,
        autorestart: true
      },
      {
        name: "crawler",
        script: "crawler.js",
        log_file: "./logs/crawler.log",
        error_file: "./logs/crawler-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        instances: 1,
        autorestart: true
      }
    ]
  };
  