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

### 7. SMTP_APP_PASS (Optional)
- **Name**: `SMTP_APP_PASS`
- **Value**: Application-specific password for SMTP authentication
- **Example**: For Gmail, generate an app password at https://myaccount.google.com/apppasswords
- **Description**: Required for email sending functionality (verification codes, password resets)
- **Note**: If not configured, email sending will be disabled and codes will be logged to console

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

---

### SMTP Configuration (Optional - All Required for Email Functionality)

**Important**: For email sending to work, you must configure ALL of the following SMTP variables together:
- `SMTP_HOST` (variable)
- `SMTP_PORT` (variable)
- `SMTP_MAIL` (variable)
- `SMTP_APP_PASS` (secret)

If any of these are missing, email sending will be disabled and verification codes will only be logged to the console.

### 6. SMTP_HOST (Optional)
- **Name**: `SMTP_HOST`
- **Value**: SMTP server hostname
- **Example**: `smtp.gmail.com`
- **Description**: Required for email sending functionality
- **Note**: All 4 SMTP variables must be configured together for emails to work

### 7. SMTP_PORT (Optional)
- **Name**: `SMTP_PORT`
- **Value**: SMTP server port
- **Example**: `587` (for TLS) or `465` (for SSL)
- **Description**: Required for email sending functionality
- **Note**: All 4 SMTP variables must be configured together for emails to work

### 8. SMTP_MAIL (Optional)
- **Name**: `SMTP_MAIL`
- **Value**: Email address to send from
- **Example**: `noreply@yourdomain.com`
- **Description**: Required for email sending functionality
- **Note**: All 4 SMTP variables must be configured together for emails to work

### 9. APP_DOMAIN
- **Name**: `APP_DOMAIN`
- **Value**: Full URL of your application domain
- **Example**: `https://khdev.ru` or `https://api.khdev.ru`
- **Description**: Used for generating email confirmation links
- **Important**: Must include protocol (http:// or https://)

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
# Note: Modern Docker installations include Compose as a plugin
# Verify installation with:
docker compose version
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
sudo mkdir -p /var/www/ptracker-api
sudo chown $USER:$USER /var/www/ptracker-api
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
cd /var/www/ptracker-api
docker compose ps
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
