// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    // Backend API
    {
      name: 'mbo-backend',
      cwd: './backend',
      script: 'uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: './venv/bin/python',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },

    // Celery Worker
    {
      name: 'mbo-celery-worker',
      cwd: './backend',
      script: 'celery',
      args: '-A app.tasks worker --loglevel=info --concurrency=4',
      interpreter: './venv/bin/python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },

    // Celery Beat (Scheduler)
    {
      name: 'mbo-celery-beat',
      cwd: './backend',
      script: 'celery',
      args: '-A app.tasks beat --loglevel=info',
      interpreter: './venv/bin/python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },

    // Google Ads MCP Server
    {
      name: 'mcp-google-ads',
      cwd: './mcp-servers/google-ads-mcp',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        MCP_GOOGLE_ADS_PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },

    // Meta Ads MCP Server
    {
      name: 'mcp-meta-ads',
      cwd: './mcp-servers/meta-ads-mcp',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        MCP_META_ADS_PORT: 3002,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },

    // TikTok Ads MCP Server
    {
      name: 'mcp-tiktok-ads',
      cwd: './mcp-servers/tiktok-ads-mcp',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        MCP_TIKTOK_ADS_PORT: 3003,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },

    // LinkedIn Ads MCP Server
    {
      name: 'mcp-linkedin-ads',
      cwd: './mcp-servers/linkedin-ads-mcp',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        MCP_LINKEDIN_ADS_PORT: 3004,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },
  ],
};
