// PM2 Ecosystem Config — Evently
// Both production (evently-prod) and development (evently-dev) apps on same VPS.
// Production:  https://evently.swiss   → port 3000
// Development: https://dev.evently.swiss → port 3001

module.exports = {
  apps: [
    {
      name: 'evently-prod',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/evently',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_file: '/var/log/pm2/evently-prod.log',
      out_file: '/var/log/pm2/evently-prod-out.log',
      error_file: '/var/log/pm2/evently-prod-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
    },
    {
      name: 'evently-dev',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/evently',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_file: '/var/log/pm2/evently-dev.log',
      out_file: '/var/log/pm2/evently-dev-out.log',
      error_file: '/var/log/pm2/evently-dev-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
    },
  ],
};
