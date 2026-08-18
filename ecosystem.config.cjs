/**
 * PM2 Application Ecosystem Configuration
 * Sankara Eye Bank & Donation Emergency Response System
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --env production
 *   pm2 stop ecosystem.config.cjs
 *   pm2 logs sankara-eyebank-api
 */

module.exports = {
  apps: [
    {
      name: "sankara-eyebank-api",
      script: "artifacts/api-server/dist/index.mjs",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      kill_timeout: 10000,
      listen_timeout: 10000,
      restart_delay: 2000,
      max_restarts: 15,
      min_uptime: "5s",

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,

      // Default Environment (Development)
      env: {
        NODE_ENV: "development",
        PORT: 8080,
      },

      // Production Environment (`pm2 start ecosystem.config.cjs --env production`)
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
    },
  ],
};
