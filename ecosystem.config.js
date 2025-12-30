module.exports = {
  apps: [
    {
      name: 'my-next-app',
      script: 'node .next/standalone/server.js',
      cwd: '/home/chapiz-tag/htdocs/tag.chapiz.co.il',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      error_file: '/home/chapiz-tag/.pm2/logs/my-next-app-error.log',
      out_file: '/home/chapiz-tag/.pm2/logs/my-next-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};

