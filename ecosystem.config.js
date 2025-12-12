module.exports = {
  apps: [
    {
      name: 'bot-mou-admin',
      script: 'nicola.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Cron restart (optional - restart every day at 3 AM)
      cron_restart: '0 3 * * *',
      // Kill timeout
      kill_timeout: 5000,
      // Listen timeout
      listen_timeout: 10000,
      // Shutdown timeout
      shutdown_with_message: false,
    },
  ],
}
