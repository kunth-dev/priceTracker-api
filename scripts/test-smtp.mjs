#!/usr/bin/env node
/**
 * SMTP Connection Test Script
 * Tests SMTP connection from within the Docker container
 * 
 * Usage:
 *   docker exec -it price-tracker-api node /app/scripts/test-smtp.js
 */

import { createTransport } from 'nodemailer';
import { config } from 'dotenv';

// Load environment variables
config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_MAIL,
  SMTP_APP_PASS,
} = process.env;

console.log('==========================================');
console.log('SMTP Connection Test (Nodemailer)');
console.log('==========================================\n');

// Check configuration
if (!SMTP_HOST || !SMTP_PORT || !SMTP_MAIL || !SMTP_APP_PASS) {
  console.error('❌ SMTP configuration incomplete');
  console.log('\nMissing variables:');
  if (!SMTP_HOST) console.log('  - SMTP_HOST');
  if (!SMTP_PORT) console.log('  - SMTP_PORT');
  if (!SMTP_MAIL) console.log('  - SMTP_MAIL');
  if (!SMTP_APP_PASS) console.log('  - SMTP_APP_PASS');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   Host: ${SMTP_HOST}`);
console.log(`   Port: ${SMTP_PORT}`);
console.log(`   From: ${SMTP_MAIL}`);
console.log(`   Password: ${'*'.repeat(SMTP_APP_PASS.length)}\n`);

const isSecure = parseInt(SMTP_PORT) === 465;

// Create transporter with same configuration as production
const transporter = createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT),
  secure: isSecure,
  auth: {
    user: SMTP_MAIL,
    pass: SMTP_APP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
    ciphers: 'SSLv3',
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  debug: true, // Enable debug output
  logger: true, // Enable logging
});

console.log('🔍 Testing SMTP connection...\n');

// Test connection
transporter.verify()
  .then(() => {
    console.log('\n✅ SMTP connection successful!');
    console.log('   Email sending should work in production.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ SMTP connection failed!');
    console.error('\nError details:', error.message);
    console.error('\nError code:', error.code);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 ETIMEDOUT error indicates:');
      console.log('   1. Docker container cannot reach SMTP server');
      console.log('   2. Firewall blocking outbound connection');
      console.log('   3. Network not configured properly');
      console.log('\n🔧 Troubleshooting steps:');
      console.log('   1. Run: docker exec -it price-tracker-api sh /app/scripts/test-smtp-connection.sh');
      console.log('   2. Check Docker host firewall');
      console.log('   3. Verify DNS configuration in docker-compose.yml');
      console.log('   4. Try network_mode: host if on Linux');
    } else if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication error:');
      console.log('   - Check SMTP_MAIL and SMTP_APP_PASS are correct');
      console.log('   - For Gmail, use App Password, not regular password');
      console.log('   - Ensure 2FA is enabled and app password is generated');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 DNS resolution error:');
      console.log('   - Container cannot resolve SMTP_HOST');
      console.log('   - Check DNS configuration in docker-compose.yml');
      console.log('   - Verify internet connectivity from container');
    }
    
    console.log('');
    process.exit(1);
  });
