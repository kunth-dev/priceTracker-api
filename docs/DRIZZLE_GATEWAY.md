# Drizzle Gateway Setup Guide

## Overview

Drizzle Gateway is a self-hosted database management tool, providing an advanced UI for managing PostgreSQL databases with AI-powered features.

## Quick Start

### Using Docker Compose (Recommended)

Drizzle Gateway is automatically included in the Docker Compose setup.

1. **Start the services**:

   ```bash
   docker compose up -d
   ```

2. **Access Drizzle Gateway**:

   Open your browser and navigate to:

   ```text
   http://localhost:4983
   ```

3. **Login**:

   Use the master password configured in your `.env` file:

   ```env
   DRIZZLE_GATEWAY_MASTERPASS=your_secure_password_here
   ```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Drizzle Gateway Master Password
# Generate using: openssl rand -base64 32
DRIZZLE_GATEWAY_MASTERPASS=changeme_secure_password
```

### Docker Compose Configuration

The gateway is configured in `docker-compose.yml`:

```yaml
drizzle-gateway:
  image: ghcr.io/drizzle-team/gateway:latest
  container_name: price-tracker-drizzle-gateway
  restart: unless-stopped
  ports:
    - "4983:4983"
  environment:
    PORT: 4983
    STORE_PATH: /app/data
    MASTERPASS: ${DRIZZLE_GATEWAY_MASTERPASS:-changeme_secure_password}
    DATABASE_URL_default: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
  volumes:
    - drizzle_gateway_data:/app/data
  depends_on:
    postgres:
      condition: service_healthy
```

## Features

### Database Management

- **Schema Browser**: View and navigate your database schema
- **Table Editor**: Create, modify, and delete tables
- **View Management**: Manage database views
- **Enum Types**: Create and manage custom enum types
- **Data Browser**: View and edit table data with filtering and sorting

### Advanced Features

- **Role Management**: Manage PostgreSQL roles and privileges
- **Policy Management**: Configure row-level security policies
- **Query History**: Track and reuse previous queries
- **Dark Mode**: Modern dark theme support
- **Health Monitoring**: Built-in health check endpoint at `/health`

## Security

### Master Password

⚠️ **Important**: Change the default master password before deploying to production!

Generate a secure password:

```bash
openssl rand -base64 32
```

Add it to your `.env` file:

```env
DRIZZLE_GATEWAY_MASTERPASS=your_generated_secure_password_here
```

### Network Security

For production deployments:

1. **Use HTTPS**: Configure a reverse proxy (nginx, Caddy) with SSL
2. **Firewall Rules**: Restrict access to port 4983
3. **VPN Access**: Consider placing behind a VPN for additional security
4. **IP Whitelisting**: Limit access to specific IP addresses

## Troubleshooting

### Cannot Connect to Gateway

**Issue**: Gateway is not accessible at `http://localhost:4983`

**Solutions**:

- Check if the container is running: `docker compose ps`
- View logs: `docker compose logs drizzle-gateway`
- Ensure port 4983 is not used by another service
- Verify the gateway service started successfully

### Authentication Failed

**Issue**: Master password is rejected

**Solutions**:

- Verify `DRIZZLE_GATEWAY_MASTERPASS` in your `.env` file
- Restart the gateway service: `docker compose restart drizzle-gateway`
- Check for special characters that might need escaping

### Database Connection Issues

**Issue**: Gateway cannot connect to the database

**Solutions**:

- Ensure PostgreSQL container is healthy: `docker compose ps postgres`
- Verify database credentials in `docker-compose.yml`
- Check network connectivity between containers
- Review PostgreSQL logs: `docker compose logs postgres`

## Useful Commands

```bash
# View Gateway logs
docker compose logs -f drizzle-gateway

# Restart Gateway
docker compose restart drizzle-gateway

# Check Gateway health
curl http://localhost:4983/health

# Access Gateway shell (debugging)
docker compose exec drizzle-gateway sh

# Stop Gateway
docker compose stop drizzle-gateway

# Remove Gateway and its data
docker compose down -v
```

## Alternative: Drizzle Studio CLI

For local development without Docker, you can use the traditional Drizzle Studio:

```bash
yarn drizzle-kit studio
```

This provides basic database management features

## Learn More

- [Drizzle Gateway Official Site](https://gateway.drizzle.team/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Database Setup Guide](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Version Information

- **Current Version**: v1.0.6 (latest)
- **Docker Image**: `ghcr.io/drizzle-team/gateway:latest`
- **Platform Support**: linux/amd64, linux/arm64

## Changelog

See the [official changelog](https://gateway.drizzle.team/#changelog) for the latest updates and features.
