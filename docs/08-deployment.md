# Deployment Guide

## Docker Compose (Infrastructure)

```yaml
# File: docker-compose.yml

version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: mbo-postgres
    environment:
      POSTGRES_DB: mbo_client1
      POSTGRES_USER: mbo_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mbo_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mbo-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: mbo-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: mbo
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-secure_password}
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

## PM2 Process Manager Config

```javascript
// File: ecosystem.config.js

module.exports = {
  apps: [
    // MCP Servers
    {
      name: 'mcp-google-ads',
      script: 'dist/index.js',
      cwd: './mbo-mcp-servers/google-ads-mcp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        MCP_GOOGLE_ADS_PORT: 3001
      },
      error_file: './logs/google-ads-error.log',
      out_file: './logs/google-ads-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'mcp-meta-ads',
      script: 'dist/index.js',
      cwd: './mbo-mcp-servers/meta-ads-mcp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        MCP_META_ADS_PORT: 3002
      }
    },
    {
      name: 'mcp-tiktok-ads',
      script: 'dist/index.js',
      cwd: './mbo-mcp-servers/tiktok-ads-mcp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        MCP_TIKTOK_ADS_PORT: 3003
      }
    },
    {
      name: 'mcp-linkedin-ads',
      script: 'dist/index.js',
      cwd: './mbo-mcp-servers/linkedin-ads-mcp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        MCP_LINKEDIN_ADS_PORT: 3004
      }
    },

    // Backend API
    {
      name: 'mbo-backend',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000 --workers 4',
      cwd: './mbo-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ENVIRONMENT: 'production',
        PYTHONPATH: './mbo-backend'
      }
    },

    // Celery Worker
    {
      name: 'mbo-celery-worker',
      script: 'venv/bin/celery',
      args: '-A app.celery worker --loglevel=info --concurrency=4',
      cwd: './mbo-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },

    // Celery Beat (scheduler)
    {
      name: 'mbo-celery-beat',
      script: 'venv/bin/celery',
      args: '-A app.celery beat --loglevel=info',
      cwd: './mbo-backend',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
```

## Startup Script

```bash
#!/bin/bash
# File: scripts/start-all.sh

set -e

echo "🚀 Starting Marketing Budget Optimizer..."
echo ""

# 1. Start infrastructure
echo "📦 Starting infrastructure (PostgreSQL, Redis, RabbitMQ)..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for infrastructure to be ready..."
sleep 15

# Check infrastructure health
echo "🏥 Checking infrastructure health..."
docker exec mbo-postgres pg_isready -U mbo_user || { echo "❌ PostgreSQL not ready"; exit 1; }
docker exec mbo-redis redis-cli ping || { echo "❌ Redis not ready"; exit 1; }
echo "✅ Infrastructure ready!"

# 2. Build MCP servers
echo ""
echo "🔨 Building MCP servers..."
for server in google-ads meta-ads tiktok-ads linkedin-ads; do
    echo "  Building ${server}-mcp..."
    cd "mbo-mcp-servers/${server}-mcp"
    npm install
    npm run build
    cd ../..
done
echo "✅ MCP servers built!"

# 3. Run database migrations
echo ""
echo "🗄️  Running database migrations..."
cd mbo-backend
source venv/bin/activate
alembic upgrade head
cd ..
echo "✅ Database migrated!"

# 4. Start all services with PM2
echo ""
echo "▶️  Starting all services with PM2..."
pm2 start ecosystem.config.js
pm2 save
echo "✅ All services started!"

# 5. Display status
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
echo "✅ Marketing Budget Optimizer is running!"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs"
echo "  - Stop all: pm2 stop all"
echo "  - Restart: pm2 restart all"
echo "  - Monitor: pm2 monit"
echo ""
echo "🌐 Access points:"
echo "  - Backend API: http://localhost:8000"
echo "  - RabbitMQ UI: http://localhost:15672 (mbo/secure_password)"
echo "  - Health check: ./scripts/healthcheck.sh"
```

## Health Check Script

```bash
#!/bin/bash
# File: scripts/healthcheck.sh

echo "🏥 MBO Health Check"
echo "==================="
echo ""

# Infrastructure
echo "📦 Infrastructure:"
echo -n "  PostgreSQL: "
docker exec mbo-postgres pg_isready -U mbo_user &>/dev/null && echo "✅ OK" || echo "❌ FAIL"

echo -n "  Redis: "
docker exec mbo-redis redis-cli ping &>/dev/null && echo "✅ OK" || echo "❌ FAIL"

echo -n "  RabbitMQ: "
curl -s -u mbo:secure_password http://localhost:15672/api/overview &>/dev/null && echo "✅ OK" || echo "❌ FAIL"

# MCP Servers
echo ""
echo "🔌 MCP Servers:"
for port in 3001 3002 3003 3004; do
    echo -n "  Port $port: "
    nc -z localhost $port &>/dev/null && echo "✅ OK" || echo "❌ FAIL"
done

# Backend
echo ""
echo "🖥️  Backend:"
echo -n "  API (port 8000): "
curl -s http://localhost:8000/health &>/dev/null && echo "✅ OK" || echo "❌ FAIL"

# PM2 processes
echo ""
echo "⚙️  PM2 Processes:"
pm2 jlist | jq -r '.[] | "  \(.name): \(.pm2_env.status)"' 2>/dev/null || echo "  PM2 not running"

echo ""
```

## Stop Script

```bash
#!/bin/bash
# File: scripts/stop-all.sh

echo "🛑 Stopping Marketing Budget Optimizer..."

# Stop PM2 processes
echo "Stopping PM2 processes..."
pm2 stop all

# Stop Docker containers
echo "Stopping Docker containers..."
docker-compose down

echo "✅ All services stopped!"
```

## Initial Testing Checklist

Po uruchomieniu systemu, wykonaj te testy:

```bash
# 1. Test PostgreSQL connection
psql -h localhost -U mbo_user -d mbo_client1 -c "SELECT version();"

# 2. Test Redis
redis-cli ping

# 3. Test RabbitMQ
curl -u mbo:secure_password http://localhost:15672/api/overview

# 4. Test MCP Server - List Tools
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 5. Test MCP Server - Get Performance
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"get_campaign_performance",
      "arguments":{
        "date_range":{
          "start_date":"2026-01-01",
          "end_date":"2026-01-07"
        }
      }
    }
  }'

# 6. Test Backend API Health
curl http://localhost:8000/health

# 7. View all logs
pm2 logs

# 8. Monitor processes
pm2 monit
```

## Troubleshooting

### Problem: MCP Server won't start

```bash
# Check credentials in .env
cat .env | grep GOOGLE_ADS

# Check logs
pm2 logs mcp-google-ads --lines 50

# Restart specific server
pm2 restart mcp-google-ads
```

### Problem: "Invalid credentials" from platform

```bash
# Verify token is still valid
# For Google Ads, test with:
curl -X POST https://oauth2.googleapis.com/tokeninfo \
  -d "access_token=YOUR_TOKEN"

# Regenerate refresh token if needed (see platform setup docs)
```

### Problem: Database connection failed

```bash
# Check if PostgreSQL is running
docker ps | grep mbo-postgres

# Check logs
docker logs mbo-postgres

# Restart container
docker-compose restart postgres
```

### Problem: PM2 process crashed

```bash
# View crash logs
pm2 logs --err

# Restart process
pm2 restart <process-name>

# Or restart all
pm2 restart all
```

## Related Documents

- [Platform Setup](./07-platform-setup.md) - Credentials configuration
- [Architecture](./02-architecture.md) - System components
