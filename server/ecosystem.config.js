/**
 * PM2 Ecosystem Configuration for Production Deployment
 * Run with: pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'gema-backend',
      script: './server.js',

      // Instances
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing

      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 5050
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5050
      },

      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced Options
      watch: false, // Disable watch in production
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      autorestart: true, // Auto-restart on crash
      restart_delay: 4000, // Wait 4s before restart
      max_restarts: 10, // Max restart attempts
      min_uptime: '10s', // Min uptime before considered started

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,

      // Source map support
      source_map_support: false,

      // Environment-specific settings
      node_args: '--max-old-space-size=2048',

      // Cron restart (optional - restart every day at 3 AM)
      cron_restart: '0 3 * * *',

      // Monitoring
      instance_var: 'INSTANCE_ID'
    }
  ],

  /**
   * Deployment Configuration (optional)
   */
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-vps-ip'],
      ref: 'origin/master',
      repo: 'git@github.com:your-org/bulk-registration.git',
      path: '/var/www/bulk-registration',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production server..."',
      ssh_options: 'StrictHostKeyChecking=no'
    }
  }
};
