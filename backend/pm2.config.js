module.exports = {
    apps: [
      {
        name: "api",
        script: "index.js",
        log_file: "/usr/src/app/logs/api.log",
        error_file: "/usr/src/app/logs/api-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        instances: 1,
        autorestart: true
      },
      {
        name: "crawler",
        script: "crawler.js",
        log_file: "/usr/src/app/logs/crawler.log",
        error_file: "/usr/src/app/logs/crawler-error.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        instances: 1,
        autorestart: true
      }
    ]
  };
  