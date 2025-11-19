# SMTP Port 587 Blocked - Action Plan

## Problem Diagnosis ✅

Your diagnostic tests show:
- ✅ DNS resolution works (container can resolve smtp.gmail.com)
- ✅ Internet connectivity works (container can reach external sites)
- ❌ **Port 587 is BLOCKED** (connection timeout)

**Conclusion:** Your hosting provider or network is blocking outbound SMTP port 587.

## Solution Options (in order of recommendation)

### Option 1: Switch to Port 465 ⭐ RECOMMENDED - TRY THIS FIRST

Gmail SMTP supports both port 587 (STARTTLS) and port 465 (SSL/TLS).
Port 465 is often less restricted.

**Steps:**
1. Go to your GitHub repository
2. Navigate to: Settings → Secrets and variables → Actions → Variables
3. Find `SMTP_PORT` and change value from `587` to `465`
4. Redeploy using GitHub Actions

**Test after deployment:**
```bash
# On production server
docker exec -it price-tracker-api node /app/scripts/test-smtp.mjs
```

---

### Option 2: Switch to SendGrid ⭐ BEST FOR PRODUCTION

SendGrid is designed for transactional emails and less likely to be blocked.

**Free Tier:** 100 emails/day (sufficient for most apps)

**Steps:**
1. Sign up at https://sendgrid.com
2. Create an API key (Settings → API Keys)
3. Update GitHub repository variables:
   - `SMTP_HOST` → `smtp.sendgrid.net`
   - `SMTP_PORT` → `587` (or `465`)
   - `SMTP_MAIL` → `apikey` (literally the word "apikey")
   - `SMTP_APP_PASS` (secret) → Your SendGrid API key
4. Redeploy

**Advantages:**
- Better deliverability
- Email analytics
- Less likely to be blocked
- Professional service

---

### Option 3: Switch to Mailgun

Similar to SendGrid, professional email service.

**Free Tier:** 1,000 emails/month for 3 months

**Steps:**
1. Sign up at https://www.mailgun.com
2. Verify your domain (or use sandbox for testing)
3. Get SMTP credentials from dashboard
4. Update GitHub variables:
   - `SMTP_HOST` → `smtp.mailgun.org`
   - `SMTP_PORT` → `587`
   - `SMTP_MAIL` → `postmaster@yourdomain.mailgun.org`
   - `SMTP_APP_PASS` → Your Mailgun SMTP password
5. Redeploy

---

### Option 4: Test Which Ports Work (Diagnostic)

Run this on your production server to see which SMTP ports are accessible:

```bash
# SSH into your production server
ssh your-user@khdev.ru

# Navigate to app directory
cd /var/www/ptracker-api

# Make script executable
chmod +x scripts/test-smtp-ports.sh

# Run port test
bash scripts/test-smtp-ports.sh
```

This will show you which providers and ports are accessible from your server.

---

### Option 5: Use Host Networking (Linux Only)

If your server runs Linux and you have root access, you can bypass Docker network isolation.

**⚠️ Warning:** This removes network isolation security benefits.

**Steps:**
1. SSH into production server
2. Backup current docker-compose.yml:
   ```bash
   cd /var/www/ptracker-api
   cp docker-compose.yml docker-compose.yml.backup
   ```
3. Replace with host networking version:
   ```bash
   cp docker-compose.host-network.yml docker-compose.yml
   ```
4. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## Recommended Immediate Action

**Start with Option 1 (Port 465):**
1. Change `SMTP_PORT` to `465` in GitHub variables
2. Redeploy via GitHub Actions
3. Test with diagnostic script

**If that doesn't work, switch to Option 2 (SendGrid):**
- Most reliable for production
- Free tier is sufficient
- Takes 10 minutes to set up

---

## What Won't Work

❌ **Increasing timeouts** - Port is blocked, no amount of waiting helps  
❌ **Changing DNS** - DNS resolution already works  
❌ **Changing TLS settings** - Can't negotiate TLS if connection fails  
❌ **Retry logic** - Already implemented, but can't retry blocked connections

---

## After Fixing

Once emails work, you should see in the logs:
```
✅ SMTP connection verified successfully
✅ Confirmation email sent to user@example.com
```

No more `ETIMEDOUT` errors.

---

## Need Help?

1. Run port diagnostic: `bash scripts/test-smtp-ports.sh`
2. Check logs: `docker logs price-tracker-api`
3. Test SMTP: `docker exec -it price-tracker-api node /app/scripts/test-smtp.mjs`

See `docs/EMAIL_TROUBLESHOOTING.md` for complete troubleshooting guide.
