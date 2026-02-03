module.exports = {
  apps: [
    {
      name: 'bpi-production',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/bpi',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'bpi-cron',
      script: 'npx',
      args: 'tsx server/cron-server.ts',
      cwd: '/var/www/bpi',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/cron-error.log',
      out_file: './logs/cron-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
