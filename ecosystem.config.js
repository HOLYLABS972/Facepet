module.exports = {
  apps: [
    {
      name: 'my-next-app',
      script: 'node .next/standalone/server.js',
      cwd: '/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0', // Listen on all interfaces
      },
      error_file: '/home/chapiz-tag/.pm2/logs/my-next-app-error.log',
      out_file: '/home/chapiz-tag/.pm2/logs/my-next-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s', // Minimum uptime to consider app stable
      max_restarts: 10, // Max restarts in 1 minute
      restart_delay: 4000, // Delay between restarts
    },
  ],
};

