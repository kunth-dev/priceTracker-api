# Deployment Guide

This guide explains how to deploy the Price Tracker API to a remote server using GitHub Actions.

## Prerequisites

- Remote server with:
  - Docker and Docker Compose installed
  - Nginx installed and configured
  - SSH access enabled
  - SSL certificates for `khdev.ru` domain (using Let's Encrypt)

## GitHub Repository Setup

### Required Secrets

Configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions > Secrets):

1. `SERVER_SSH_HOST` - The hostname or IP address of your remote server (e.g., `khdev.ru` or `192.168.1.100`)
2. `SERVER_SSH_LOGIN` - SSH username (e.g., `root` or `deploy`)
3. `SERVER_SSH_PASSWORD` - SSH password for authentication
4. `BEARER_TOKENS` - Comma-separated list of valid bearer tokens for API authentication

### Repository Variables

Configure these variables in your GitHub repository (Settings > Secrets and variables > Actions > Variables):

1. `ALLOWED_DOMAINS` - Comma-separated list of allowed CORS domains (e.g., `khdev.ru,api.khdev.ru`)
2. `LOG_SECURITY_EVENTS` - Set to `true` to log security events (default: `true`)
3. `NODE_ENV` - Environment mode (default: `production`)
4. `PORT` - API server port (default: `3002`)
5. `TRUST_PROXY` - Set to `true` when behind a reverse proxy (default: `true`)

## Deployment Process

### Manual Deployment via GitHub Actions

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "Deploy to Remote Server" workflow from the left sidebar
4. Click "Run workflow" button
5. Select the branch you want to deploy (default: `main`)
6. Click "Run workflow" to start the deployment

### What Happens During Deployment

The deployment workflow performs the following steps:

1. **Checkout Code**: Checks out the selected branch
2. **Create Directories**: Creates necessary directories on the remote server
3. **Copy Files**: Transfers application files to `/var/www/pricetracker-api`
4. **Create Environment File**: Generates `.env` file with configuration from GitHub secrets/variables
5. **Deploy with Docker**: Builds and starts Docker containers using `docker-compose.production.yml`
6. **Configure Nginx**: Sets up nginx reverse proxy for `api.khdev.ru` and `studio.khdev.ru`
7. **Verify Deployment**: Checks container status and logs

## Server Structure

After deployment, the following structure is created on the remote server:

```
/var/www/pricetracker-api/
├── .env                          # Environment variables (generated)
├── Dockerfile                    # Docker build configuration
├── docker-compose.production.yml # Production Docker Compose config
├── nginx.conf                    # Nginx configuration
├── start.sh                      # Container startup script
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── drizzle.config.ts            # Database ORM configuration
├── src/                         # Source code
├── drizzle/                     # Database migrations
└── logs/                        # Application logs
```

## Services

The deployment creates three Docker containers:

### 1. PostgreSQL Database (`price-tracker-postgres-prod`)
- Internal database service
- Data persisted in Docker volume `postgres_data`
- Not exposed externally

### 2. Backend API (`price-tracker-api-prod`)
- Runs the Price Tracker API
- Accessible at `http://127.0.0.1:3002` internally
- Public access via `https://api.khdev.ru` through nginx

### 3. Drizzle Studio (`price-tracker-drizzle-studio-prod`)
- Database management UI
- Accessible at `http://127.0.0.1:4983` internally
- Public access via `https://studio.khdev.ru` through nginx

## Domain Configuration

### API Endpoint
- **URL**: `https://api.khdev.ru`
- **Purpose**: Main API endpoint for the application
- **Example**: `https://api.khdev.ru/api/auth/register`

### Drizzle Studio
- **URL**: `https://studio.khdev.ru`
- **Purpose**: Database management interface
- **Security**: Consider enabling basic authentication in nginx config

## Post-Deployment Verification

After deployment, verify the services are running:

```bash
# SSH into the server
ssh user@khdev.ru

# Check container status
cd /var/www/pricetracker-api
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f backend

# Test API endpoint
curl https://api.khdev.ru/api

# Test Drizzle Studio
curl https://studio.khdev.ru
```

## Nginx Configuration

The nginx configuration file (`nginx.conf`) provides:

1. **HTTP to HTTPS redirect** for both subdomains
2. **Reverse proxy** to Docker containers
3. **SSL/TLS termination** with Let's Encrypt certificates
4. **Security headers** (HSTS, X-Frame-Options, etc.)
5. **WebSocket support** for Drizzle Studio
6. **Access and error logging**

### Nginx Setup on Server

If nginx is not yet configured for the subdomains:

```bash
# The deployment workflow automatically:
# 1. Copies nginx.conf to /etc/nginx/sites-available/api.khdev.ru
# 2. Creates symlink in /etc/nginx/sites-enabled/
# 3. Tests and reloads nginx

# Manual verification:
sudo nginx -t
sudo systemctl status nginx
```

## SSL Certificates

The nginx configuration assumes SSL certificates are available at:
- `/etc/letsencrypt/live/khdev.ru/fullchain.pem`
- `/etc/letsencrypt/live/khdev.ru/privkey.pem`
- `/etc/letsencrypt/live/khdev.ru/chain.pem`

If you need to set up SSL certificates:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates for both subdomains
sudo certbot --nginx -d api.khdev.ru -d studio.khdev.ru

# Auto-renewal is configured by default
sudo certbot renew --dry-run
```

## Troubleshooting

### Check Container Logs
```bash
cd /var/www/pricetracker-api
docker-compose -f docker-compose.production.yml logs -f
```

### Restart Services
```bash
cd /var/www/pricetracker-api
docker-compose -f docker-compose.production.yml restart
```

### Rebuild Containers
```bash
cd /var/www/pricetracker-api
docker-compose -f docker-compose.production.yml up -d --build
```

### Check Nginx Status
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/api.khdev.ru.error.log
```

### Database Issues
```bash
# Access database shell
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d price_tracker_db

# Check database migrations
docker-compose -f docker-compose.production.yml exec backend npx drizzle-kit push
```

## Security Considerations

1. **BEARER_TOKENS**: Use strong, random tokens (generate with `openssl rand -base64 32`)
2. **Database Password**: Change default postgres password in production
3. **Drizzle Studio**: Consider adding basic auth or IP restrictions in nginx
4. **SSH Access**: Use SSH keys instead of passwords when possible
5. **Firewall**: Ensure only necessary ports are open (80, 443)
6. **Regular Updates**: Keep Docker images and system packages updated

## Rollback

To rollback to a previous version:

1. Run the deployment workflow with the previous branch/commit
2. Or manually on the server:
   ```bash
   cd /var/www/pricetracker-api
   git checkout <previous-commit>
   docker-compose -f docker-compose.production.yml up -d --build
   ```

## Monitoring

Monitor your deployment with:

```bash
# Container resource usage
docker stats

# Container health status
docker-compose -f docker-compose.production.yml ps

# Application logs
docker-compose -f docker-compose.production.yml logs -f backend

# Nginx access logs
sudo tail -f /var/log/nginx/api.khdev.ru.access.log
```
