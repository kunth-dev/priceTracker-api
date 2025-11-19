# Email Service Troubleshooting Guide

## Common Production Issues

### ETIMEDOUT Error with CONN Command

**Error Message:**

```json
{
  "error": {
    "code": "ETIMEDOUT",
    "command": "CONN"
  },
  "level": "error",
  "message": "SMTP connection verification failed"
}
```

**Cause:**
This error indicates that the SMTP connection attempt timed out before establishing a connection to the mail server. **This is especially common in Docker production environments** where containers have isolated networks.

**Most Common Cause: Port 587 Blocked by Hosting Provider**

Many hosting providers and ISPs block outbound SMTP ports (especially 25, 587) to prevent spam. This is the #1 reason for ETIMEDOUT errors in production.

**Root Causes:**

1. **🔥 SMTP Port Blocking (Most Common)**: Hosting provider/ISP blocks ports 25/587
2. **Docker Network Isolation**: Container cannot reach external SMTP servers
3. **Firewall rules**: Server firewall blocking outbound connections
4. **DNS resolution problems**: Container cannot resolve SMTP hostname
5. **SSL/TLS certificate issues**: Self-signed or invalid certificates

## Quick Fix: Try Port 465

**Before doing anything else, try switching to port 465:**

In your GitHub repository variables, change `SMTP_PORT` from `587` to `465`.

Port 465 (direct SSL) is less commonly blocked than port 587 (STARTTLS).

## Quick Diagnostic Commands

### Test Which SMTP Ports Are Accessible

**On your production server (outside Docker):**

```bash
# Run the port testing script
bash /var/www/ptracker-api/scripts/test-smtp-ports.sh
```

This will test common SMTP providers and ports to see which ones work.

### From Docker Host

```bash
# Test if container is running
docker ps | grep price-tracker-api

# Check container logs
docker logs price-tracker-api --tail 100

# Test SMTP connectivity from host
nc -zv smtp.gmail.com 587
nc -zv smtp.gmail.com 465
```

### From Inside Container

```bash
# Enter the container
docker exec -it price-tracker-api sh

# Run shell diagnostic script
sh /app/scripts/test-smtp-connection.sh

# Run Node.js diagnostic script  
node /app/scripts/test-smtp.mjs

# Manual connectivity test
nc -zv smtp.gmail.com 587
```

## Solutions Implemented

### 1. Enhanced TLS Configuration
```typescript
tls: {
  rejectUnauthorized: false, // Allow self-signed certificates
  minVersion: "TLSv1.2",     // Minimum TLS version
  ciphers: "SSLv3",          // Cipher configuration
}
```

### 2. Increased Timeouts
- `connectionTimeout`: 60 seconds (was 10 seconds)
- `greetingTimeout`: 30 seconds (was 10 seconds)
- `socketTimeout`: 60 seconds (was 30 seconds)

### 3. Retry Logic with Exponential Backoff
- Automatically retries failed email sends up to 3 times
- Uses exponential backoff (2s, 4s, 6s delays)
- Logs each retry attempt for monitoring

### 4. Connection Verification
- Verifies SMTP connection on startup (production only)
- Provides early warning if email service is misconfigured
- Non-blocking - doesn't prevent app startup

### 5. Graceful Degradation
- Falls back to console logging when email fails
- Ensures user registration/verification continues
- Codes logged for manual verification if needed

## Recommended SMTP Configuration

### Gmail (Recommended for Development)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_MAIL=your-email@gmail.com
SMTP_APP_PASS=your-app-password
```

**Note**: Requires [App Password](https://support.google.com/accounts/answer/185833), not regular password.

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_MAIL=apikey
SMTP_APP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_MAIL=postmaster@your-domain.mailgun.org
SMTP_APP_PASS=your-mailgun-password
```

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_MAIL=your-ses-smtp-username
SMTP_APP_PASS=your-ses-smtp-password
```

## Docker-Specific Considerations

### DNS Configuration (Already Applied)

The `docker-compose.yml` has been updated with Google's DNS servers:

```yaml
services:
  backend:
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

This ensures the container can resolve external hostnames.

### Network Mode (Alternative Solution)

If DNS configuration doesn't solve the issue, you can use host networking mode (Linux only):

```yaml
services:
  api:
    network_mode: host
```

**Note:** This removes network isolation and isn't recommended for security.

### Connection Verification Delay

The email service now waits 5 seconds after initialization before verifying the connection, allowing the Docker network to fully initialize.

### Diagnostic Scripts

Two diagnostic scripts are included in the container:

**Shell Script:**
```bash
docker exec -it price-tracker-api sh /app/scripts/test-smtp-connection.sh
```

**Node.js Script:**
```bash
docker exec -it price-tracker-api node /app/scripts/test-smtp.mjs
```

These scripts will test:
- DNS resolution
- Port connectivity  
- Internet access
- SMTP authentication

## Testing Email Configuration

### Manual Test from Container
```bash
# Enter running container
docker exec -it price-tracker-api sh

# Test SMTP connection
nc -zv smtp.gmail.com 587

# Test with OpenSSL
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

### Using Node.js REPL
```javascript
// Inside container or dev environment
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

// Verify connection
transporter.verify().then(
  () => console.log('SMTP OK'),
  (err) => console.error('SMTP Error:', err)
);
```

## Monitoring and Logging

### Enable Debug Mode
For detailed SMTP logs in development:
```typescript
// Already configured in emailService.ts
debug: env.NODE_ENV === "development",
logger: env.NODE_ENV === "development",
```

### Check Application Logs
```bash
# View recent logs
docker logs price-tracker-api --tail 100

# Follow logs in real-time
docker logs -f price-tracker-api

# Search for email-related errors
docker logs price-tracker-api 2>&1 | grep -i "email\|smtp"
```

### Important Log Messages
- `Email transporter initialized successfully` - SMTP configured correctly
- `SMTP connection verified successfully` - Connection test passed
- `Email sending is disabled` - SMTP not configured (will use console fallback)
- `SMTP connection verification failed` - Check network/credentials

## Alternative Solutions

### 1. Use Email Service with API (Recommended for Production)
Instead of SMTP, consider using REST APIs:
- **SendGrid**: More reliable, better deliverability
- **Mailgun**: Good documentation, generous free tier
- **Amazon SES**: Cost-effective for high volume
- **Postmark**: Excellent for transactional emails

### 2. Message Queue Approach
For high-volume applications:
- Queue email jobs (Redis, RabbitMQ)
- Process emails asynchronously
- Better error handling and retry logic
- Prevents blocking user operations

### 3. Temporary Disable Email in Production
If email is not critical for testing:
```env
# Leave SMTP vars empty or unset
SMTP_HOST=
SMTP_PORT=
SMTP_MAIL=
SMTP_APP_PASS=
```
The service will gracefully fall back to console logging.

## Security Best Practices

1. **Never commit credentials**: Use environment variables
2. **Use app passwords**: Not your actual email password
3. **Enable 2FA**: On email account for app password generation
4. **Rotate credentials**: Change passwords regularly
5. **Use TLS**: Always prefer port 587 (STARTTLS) or 465 (SSL/TLS)
6. **Restrict sender**: Use dedicated email for application sending

## Troubleshooting Checklist

- [ ] SMTP credentials correct and up-to-date
- [ ] Using app-specific password (not regular password)
- [ ] Port 587 or 465 accessible from server
- [ ] No firewall blocking outbound SMTP connections
- [ ] DNS can resolve SMTP hostname
- [ ] Container has internet access
- [ ] Email account not locked/suspended
- [ ] Rate limits not exceeded (check provider limits)
- [ ] Correct environment variables set in production
- [ ] Application logs show specific error details

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP Integration](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Docker Networking Guide](https://docs.docker.com/network/)
