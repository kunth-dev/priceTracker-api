# GitHub Repository Configuration Guide

This guide explains how to configure GitHub repository secrets and variables for the deployment workflow.

## Setting Up Secrets

Navigate to your GitHub repository and go to: **Settings** → **Secrets and variables** → **Actions** → **Secrets**

Click on **"New repository secret"** for each of the following:

### 1. SERVER_SSH_HOST
- **Name**: `SERVER_SSH_HOST`
- **Value**: Your server's hostname or IP address
- **Example**: `khdev.ru` or `192.168.1.100`

### 2. SERVER_SSH_LOGIN
- **Name**: `SERVER_SSH_LOGIN`
- **Value**: SSH username for authentication
- **Example**: `root`, `deploy`, or your server username

### 3. SERVER_SSH_PASSWORD
- **Name**: `SERVER_SSH_PASSWORD`
- **Value**: SSH password for the user
- **Security Note**: Consider using SSH keys for better security in production

### 4. BEARER_TOKENS
- **Name**: `BEARER_TOKENS`
- **Value**: Comma-separated list of valid bearer tokens for API authentication
- **Example**: `token1,token2,token3`
- **Generate tokens**: `openssl rand -base64 32`

### 5. POSTGRES_PASSWORD
- **Name**: `POSTGRES_PASSWORD`
- **Value**: Strong password for PostgreSQL database
- **Example**: Generate with `openssl rand -base64 32`

### 6. DRIZZLE_GATEWAY_MASTERPASS
- **Name**: `DRIZZLE_GATEWAY_MASTERPASS`
- **Value**: Master password for Drizzle Gateway web interface
- **Example**: Generate with `openssl rand -base64 32`
- **Description**: Secure password for accessing the Drizzle Gateway database management UI

## Setting Up Variables

Navigate to: **Settings** → **Secrets and variables** → **Actions** → **Variables**

Click on **"New repository variable"** for each of the following:

### 1. ALLOWED_DOMAINS
- **Name**: `ALLOWED_DOMAINS`
- **Value**: Comma-separated list of allowed CORS domains
- **Example**: `khdev.ru,api.khdev.ru`

### 2. LOG_SECURITY_EVENTS
- **Name**: `LOG_SECURITY_EVENTS`
- **Value**: `true`
- **Description**: Enable logging of security events

### 3. NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Description**: Environment mode

### 4. PORT
- **Name**: `PORT`
- **Value**: `3002`
- **Description**: API server port

### 5. TRUST_PROXY
- **Name**: `TRUST_PROXY`
- **Value**: `true`
- **Description**: Trust proxy headers when behind reverse proxy

## Server Prerequisites

Before running the deployment, ensure your remote server has:

### 1. Docker Installed
```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Docker Compose Installed
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Nginx Installed
```bash
# Install Nginx on Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx
```

### 4. SSL Certificates
```bash
# Install Certbot for Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d api.khdev.ru -d studio.khdev.ru
```

### 5. Create Deployment Directory
```bash
sudo mkdir -p /var/www/pricetracker-api
sudo chown $USER:$USER /var/www/pricetracker-api
```

## Running the Deployment

Once all secrets, variables, and server prerequisites are configured:

1. Go to your repository on GitHub
2. Click on **"Actions"** tab
3. Select **"Deploy to Remote Server"** workflow
4. Click **"Run workflow"** button
5. Select the branch you want to deploy (default: `main`)
6. Click **"Run workflow"** to start deployment

## Verification

After deployment completes, verify the services:

### Check API
```bash
curl https://api.khdev.ru/api
```

### Check Drizzle Studio
```bash
curl https://studio.khdev.ru
```

### Check Container Status
```bash
ssh user@khdev.ru
cd /var/www/pricetracker-api
docker-compose ps
```

## Troubleshooting

### SSH Connection Issues
- Verify `SERVER_SSH_HOST`, `SERVER_SSH_LOGIN`, and `SERVER_SSH_PASSWORD` are correct
- Ensure SSH is enabled on the server: `sudo systemctl status ssh`
- Check firewall allows SSH connections: `sudo ufw status`

### Docker Issues
- Verify Docker is running: `sudo systemctl status docker`
- Check Docker permissions: `docker ps`
- Review deployment logs in GitHub Actions

### Nginx Issues
- Test nginx configuration: `sudo nginx -t`
- Check nginx status: `sudo systemctl status nginx`
- Review error logs: `sudo tail -f /var/log/nginx/api.khdev.ru.error.log`

## Security Best Practices

1. **Use SSH Keys**: Replace password authentication with SSH keys for better security
2. **Strong Tokens**: Generate strong bearer tokens using `openssl rand -base64 32`
3. **Firewall**: Configure firewall to allow only necessary ports (22, 80, 443)
4. **Regular Updates**: Keep server packages and Docker images updated
5. **Monitor Logs**: Regularly review application and nginx logs
6. **Database Password**: Change the default PostgreSQL password in production
7. **Drizzle Studio Access**: Add basic authentication or IP restrictions for Drizzle Studio

## Optional: Using SSH Keys Instead of Password

For better security, you can use SSH keys:

1. Generate SSH key pair on GitHub Actions:
   ```bash
   ssh-keygen -t rsa -b 4096 -f deploy_key -N ""
   ```

2. Add the public key to server:
   ```bash
   cat deploy_key.pub >> ~/.ssh/authorized_keys
   ```

3. Add the private key as a GitHub secret named `SERVER_SSH_KEY`

4. Update the workflow to use `key` instead of `password`:
   ```yaml
   - name: Deploy via SSH
     uses: appleboy/ssh-action@v1.0.3
     with:
       host: ${{ secrets.SERVER_SSH_HOST }}
       username: ${{ secrets.SERVER_SSH_LOGIN }}
       key: ${{ secrets.SERVER_SSH_KEY }}
   ```
