#!/bin/bash

# Script to initialize SSL certificates using certbot
# This script should be run on the server before deploying with SSL

set -e

# Check if required environment variables are set
if [ -z "$API_DOMAIN" ] || [ -z "$STUDIO_DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Error: Required environment variables not set"
    echo "Usage: API_DOMAIN=api.example.com STUDIO_DOMAIN=studio.example.com EMAIL=admin@example.com ./init-ssl.sh"
    exit 1
fi

echo "Initializing SSL certificates for:"
echo "  API Domain: $API_DOMAIN"
echo "  Studio Domain: $STUDIO_DOMAIN"
echo "  Email: $EMAIL"
echo ""

# Create directory for certbot webroot
mkdir -p certbot/www

# Check if certificates already exist
if [ -d "certbot/conf/live/$API_DOMAIN" ]; then
    echo "Certificates already exist for $API_DOMAIN"
    read -p "Do you want to renew them? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
    RENEW=1
else
    RENEW=0
fi

# Create dummy certificates if they don't exist (for initial nginx startup)
if [ $RENEW -eq 0 ]; then
    echo "Creating dummy certificates..."
    mkdir -p certbot/conf/live/$API_DOMAIN
    mkdir -p certbot/conf/live/$STUDIO_DOMAIN
    
    # Create self-signed certificates for initial setup
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout certbot/conf/live/$API_DOMAIN/privkey.pem \
        -out certbot/conf/live/$API_DOMAIN/fullchain.pem \
        -subj "/CN=$API_DOMAIN"
    
    cp certbot/conf/live/$API_DOMAIN/fullchain.pem certbot/conf/live/$API_DOMAIN/chain.pem
    
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout certbot/conf/live/$STUDIO_DOMAIN/privkey.pem \
        -out certbot/conf/live/$STUDIO_DOMAIN/fullchain.pem \
        -subj "/CN=$STUDIO_DOMAIN"
    
    cp certbot/conf/live/$STUDIO_DOMAIN/fullchain.pem certbot/conf/live/$STUDIO_DOMAIN/chain.pem
fi

# Start nginx temporarily to serve ACME challenges
echo "Starting nginx for ACME challenge..."
docker-compose up -d nginx

# Wait for nginx to be ready
sleep 5

# Request certificates for API domain
echo "Requesting certificate for $API_DOMAIN..."
if [ $RENEW -eq 1 ]; then
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $API_DOMAIN
else
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $API_DOMAIN
fi

# Request certificates for Studio domain
echo "Requesting certificate for $STUDIO_DOMAIN..."
if [ $RENEW -eq 1 ]; then
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $STUDIO_DOMAIN
else
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $STUDIO_DOMAIN
fi

# Reload nginx to use new certificates
echo "Reloading nginx with new certificates..."
docker-compose exec nginx nginx -s reload

echo ""
echo "✅ SSL certificates successfully initialized!"
echo ""
echo "Certificates are stored in: ./certbot/conf/live/"
echo "  - $API_DOMAIN"
echo "  - $STUDIO_DOMAIN"
echo ""
echo "Certificates will auto-renew via the certbot container."
