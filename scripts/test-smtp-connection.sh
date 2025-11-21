#!/bin/sh
# SMTP Connection Test Script for Docker Container
# Usage: docker exec -it price-tracker-api sh /app/scripts/test-smtp-connection.sh

echo "=========================================="
echo "SMTP Connection Diagnostic Test"
echo "=========================================="
echo ""

# Check if required environment variables are set
if [ -z "$SMTP_HOST" ]; then
  echo "❌ SMTP_HOST is not set"
  exit 1
fi

if [ -z "$SMTP_PORT" ]; then
  echo "❌ SMTP_PORT is not set"
  exit 1
fi

echo "📋 Configuration:"
echo "   SMTP_HOST: $SMTP_HOST"
echo "   SMTP_PORT: $SMTP_PORT"
echo ""

# Test 1: DNS Resolution
echo "🔍 Test 1: DNS Resolution"
if command -v nslookup >/dev/null 2>&1; then
  nslookup "$SMTP_HOST" && echo "✅ DNS resolution successful" || echo "❌ DNS resolution failed"
elif command -v host >/dev/null 2>&1; then
  host "$SMTP_HOST" && echo "✅ DNS resolution successful" || echo "❌ DNS resolution failed"
else
  echo "⚠️  Neither nslookup nor host command available, skipping DNS test"
fi
echo ""

# Test 2: Network Connectivity (nc/netcat)
echo "🔍 Test 2: Network Connectivity (Port $SMTP_PORT)"
if command -v nc >/dev/null 2>&1; then
  if nc -zv "$SMTP_HOST" "$SMTP_PORT" 2>&1; then
    echo "✅ Port $SMTP_PORT is reachable"
  else
    echo "❌ Cannot connect to port $SMTP_PORT"
    echo "   This usually means:"
    echo "   - Firewall is blocking outbound connections"
    echo "   - Docker container has no internet access"
    echo "   - SMTP server is down or unreachable"
  fi
elif command -v telnet >/dev/null 2>&1; then
  timeout 5 telnet "$SMTP_HOST" "$SMTP_PORT" && echo "✅ Port $SMTP_PORT is reachable" || echo "❌ Cannot connect to port $SMTP_PORT"
else
  echo "⚠️  Neither nc nor telnet available, skipping connectivity test"
fi
echo ""

# Test 3: Internet Connectivity
echo "🔍 Test 3: Internet Connectivity"
if command -v wget >/dev/null 2>&1; then
  wget -q --spider --timeout=5 http://www.google.com && echo "✅ Internet connectivity confirmed" || echo "❌ No internet access"
elif command -v curl >/dev/null 2>&1; then
  curl -s --max-time 5 http://www.google.com > /dev/null && echo "✅ Internet connectivity confirmed" || echo "❌ No internet access"
else
  echo "⚠️  Neither wget nor curl available"
fi
echo ""

# Test 4: Check configured DNS servers
echo "🔍 Test 4: DNS Configuration"
if [ -f /etc/resolv.conf ]; then
  echo "Configured DNS servers:"
  cat /etc/resolv.conf | grep nameserver
else
  echo "⚠️  /etc/resolv.conf not found"
fi
echo ""

echo "=========================================="
echo "Diagnostic test completed"
echo "=========================================="
echo ""
echo "💡 If connectivity tests fail:"
echo "   1. Check Docker host firewall rules"
echo "   2. Verify outbound port $SMTP_PORT is allowed"
echo "   3. Try using network_mode: host in docker compose configuration"
echo "   4. Check if ISP blocks SMTP ports"
echo ""
