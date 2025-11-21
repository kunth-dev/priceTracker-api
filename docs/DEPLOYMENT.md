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
5. `POSTGRES_PASSWORD` - Strong password for PostgreSQL database
6. `DRIZZLE_GATEWAY_MASTERPASS` - Master password for Drizzle Gateway web interface

### Optional Secrets (for Email Functionality)

7. `SMTP_APP_PASS` - Application-specific password for SMTP authentication (e.g., Gmail app password)
   - **Note**: If not configured, email sending will be disabled and verification codes will be logged to console

### Repository Variables

Configure these variables in your GitHub repository (Settings > Secrets and variables > Actions > Variables):

1. `ALLOWED_DOMAINS` - Comma-separated list of allowed CORS domains (e.g., `khdev.ru,api.khdev.ru`)
2. `LOG_SECURITY_EVENTS` - Set to `true` to log security events (default: `true`)
3. `NODE_ENV` - Environment mode (default: `production`)
4. `PORT` - API server port (default: `3002`)
5. `TRUST_PROXY` - Set to `true` when behind a reverse proxy (default: `true`)
6. `POSTGRES_DB` - PostgreSQL database name (default: `price_tracker_db`)
7. `POSTGRES_USER` - PostgreSQL username (default: `postgres_user`)
8. `SMTP_HOST` - SMTP server hostname (e.g., `smtp.gmail.com`)
9. `SMTP_PORT` - SMTP server port (e.g., `587` for TLS, `465` for SSL)
10. `SMTP_MAIL` - Email address to send from (e.g., `noreply@yourdomain.com`)

**Note**: For email functionality to work, you must configure all SMTP variables along with the `SMTP_APP_PASS` secret.

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
3. **Copy Files**: Transfers application files to `/var/www/ptracker-api`
4. **Create Environment File**: Generates `.env` file with configuration from GitHub secrets/variables
5. **Deploy with Docker**: Builds and starts Docker containers using `docker compose` command
6. **Verify Deployment**: Checks container status and logs

> **Note**: Nginx configuration should be set up manually on the server to expose the API at `api.khdev.ru` and Drizzle Studio at `studio.khdev.ru`.

## Server Structure

After deployment, the following structure is created on the remote server:

```
/var/www/ptracker-api/
├── .env                          # Environment variables (generated)
├── Dockerfile                    # Docker build configuration
├── docker-compose.yml            # Docker Compose config
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

### 1. PostgreSQL Database (`price-tracker-postgres`)
- Internal database service
- Data persisted in Docker volume `postgres_data`
- Accessible on port 5432

### 2. Backend API (`price-tracker-api`)
- Runs the Price Tracker API
- Accessible at `http://localhost:3002` or `http://server-ip:3002`
- Should be exposed via nginx reverse proxy at `https://api.khdev.ru`

### 3. Drizzle Studio (`price-tracker-drizzle-studio`)
- Database management UI
- Accessible at `http://localhost:4983` or `http://server-ip:4983`
- Should be exposed via nginx reverse proxy at `https://studio.khdev.ru`

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
cd /var/www/ptracker-api
docker compose ps

# View logs
docker compose logs -f backend

# Test API endpoint
curl https://api.khdev.ru/api

# Test Drizzle Studio
curl https://studio.khdev.ru
```

## Nginx Configuration

Nginx must be configured manually on the server to expose the services. The nginx configuration should provide:

1. **HTTP to HTTPS redirect** for both subdomains
2. **Reverse proxy** to Docker containers (ports 3002 and 4983)
3. **SSL/TLS termination** with Let's Encrypt certificates
4. **Security headers** (HSTS, X-Frame-Options, etc.)
5. **WebSocket support** for Drizzle Studio
6. **Access and error logging**

### Example Nginx Configuration

Create a configuration file at `/etc/nginx/sites-available/api.khdev.ru`:

```nginx
# Redirect HTTP to HTTPS for API
server {
    listen 80;
    listen [::]:80;
    server_name api.khdev.ru;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server for API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.khdev.ru;

    ssl_certificate /etc/letsencrypt/live/khdev.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khdev.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS server for Drizzle Studio
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name studio.khdev.ru;

    ssl_certificate /etc/letsencrypt/live/khdev.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khdev.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4983;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Nginx Setup on Server

To configure nginx manually:

```bash
# Create the nginx configuration file
sudo nano /etc/nginx/sites-available/api.khdev.ru

# Enable the site
sudo ln -s /etc/nginx/sites-available/api.khdev.ru /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
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
cd /var/www/ptracker-api
docker compose logs -f
```

### Restart Services
```bash
cd /var/www/ptracker-api
docker compose restart
```

### Rebuild Containers
```bash
cd /var/www/ptracker-api
docker compose up -d --build
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
docker compose exec postgres psql -U postgres -d price_tracker_db

# Check database migrations
docker compose exec backend npx drizzle-kit push
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
   cd /var/www/ptracker-api
   git checkout <previous-commit>
   docker compose up -d --build
   ```

## Monitoring

Monitor your deployment with:

```bash
# Container resource usage
docker stats

# Container health status
docker compose ps

# Application logs
docker compose logs -f backend

# Nginx access logs
sudo tail -f /var/log/nginx/api.khdev.ru.access.log
```
