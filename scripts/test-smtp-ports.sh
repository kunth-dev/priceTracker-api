#!/bin/bash
# Test which SMTP ports are accessible from Docker host
# Run this on your production server to diagnose port blocking

echo "=========================================="
echo "SMTP Port Accessibility Test"
echo "=========================================="
echo ""
echo "Testing SMTP connectivity from Docker host..."
echo ""

# Test common SMTP servers and ports
SERVERS=(
  "smtp.gmail.com:587:Gmail TLS"
  "smtp.gmail.com:465:Gmail SSL"
  "smtp.gmail.com:25:Gmail Plain"
  "smtp.sendgrid.net:587:SendGrid TLS"
  "smtp.sendgrid.net:465:SendGrid SSL"
  "smtp.mailgun.org:587:Mailgun TLS"
  "smtp.mailgun.org:465:Mailgun SSL"
)

for server_info in "${SERVERS[@]}"; do
  IFS=':' read -r host port name <<< "$server_info"
  
  echo "Testing $name ($host:$port)..."
  
  if command -v nc >/dev/null 2>&1; then
    if timeout 5 nc -zv "$host" "$port" 2>&1 | grep -q "succeeded\|open"; then
      echo "  ✅ ACCESSIBLE - $name on port $port works"
    else
      echo "  ❌ BLOCKED - Cannot connect to $name on port $port"
    fi
  elif command -v telnet >/dev/null 2>&1; then
    if timeout 5 telnet "$host" "$port" 2>&1 | grep -q "Connected"; then
      echo "  ✅ ACCESSIBLE - $name on port $port works"
    else
      echo "  ❌ BLOCKED - Cannot connect to $name on port $port"
    fi
  else
    echo "  ⚠️  Neither nc nor telnet available"
  fi
  echo ""
done

echo "=========================================="
echo "Recommendations:"
echo "=========================================="
echo ""
echo "If all ports are blocked:"
echo "  → Your hosting provider blocks SMTP"
echo "  → Use SendGrid/Mailgun API instead of SMTP"
echo "  → Contact your hosting provider"
echo ""
echo "If port 465 works but 587 doesn't:"
echo "  → Update SMTP_PORT=465 in GitHub variables"
echo ""
echo "If SendGrid/Mailgun ports work:"
echo "  → Switch from Gmail to one of these services"
echo ""
