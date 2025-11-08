# Crypton Backend

Backend API for crypto trading application with user management and authentication.

## Features

- User registration and authentication
- Password reset flow with email verification codes
- User profile management
- Bearer token authentication for protected endpoints
- Input validation with Zod
- Error handling with detailed error messages
- Machine-readable error codes
- PostgreSQL database with DrizzleORM

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- PostgreSQL >= 12.0 (see [Database Setup Guide](./docs/DATABASE.md))

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure the environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (development, production, test)
- `ALLOWED_DOMAINS` - Comma-separated list of allowed CORS domains
- `BEARER_TOKENS` - Comma-separated list of valid bearer tokens for authentication
- `DATABASE_URL` - PostgreSQL connection string (see [Database Setup Guide](./docs/DATABASE.md))

### Database Setup

See the comprehensive [Database Setup Guide](./docs/DATABASE.md) for:
- PostgreSQL installation and configuration
- Database creation and schema setup
- Migration management
- DrizzleORM usage examples

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test

# Database commands
npm run db:push      # Push schema to database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## API Documentation

Complete API documentation is available in [docs/API.md](./docs/API.md).

**Quick Links:**
- [Database Setup & Configuration](./docs/DATABASE.md) - PostgreSQL and DrizzleORM setup
- [Auth Endpoints](./docs/API.md#auth-endpoints-public---no-authentication-required) (Public - No authentication)
  - Register, Login, Forgot Password, Reset Password
- [User Endpoints](./docs/API.md#user-endpoints-protected---authentication-required) (Protected - Authentication required)
  - Get User, Update User, Delete User
- [Error Codes](./docs/API.md#error-codes) - Machine-readable error codes
- [Testing Examples](./docs/API.md#testing) - curl command examples

## Security Notes

### Current Implementation (Demo/Development)

- **Password Hashing:** Uses SHA-256 (NOT secure for production)
- **Storage:** PostgreSQL database with DrizzleORM
- **Reset Codes:** Logged to console (not sent via email)

### Production Requirements

Before deploying to production, implement:

1. **Password Hashing:** Replace SHA-256 with bcrypt, scrypt, or Argon2
2. **Database Security:** Enable SSL/TLS for database connections
3. **Email Service:** Integrate email service (SendGrid, AWS SES, etc.) for reset codes
4. **Rate Limiting:** Add rate limiting to prevent brute force attacks
5. **HTTPS:** Ensure all traffic uses HTTPS
6. **Token Management:** Implement JWT or session-based authentication
7. **Input Sanitization:** Add additional input sanitization for XSS prevention
8. **Audit Logging:** Log all security-relevant events
9. **Database Backups:** Implement automated backup strategy
10. **Connection Pooling:** Configure connection pooling for better performance

## Development

### Project Structure

```
src/
├── config/          # Environment configuration
│   └── database.ts  # Database connection setup
├── constants/       # Application constants (error codes, etc.)
├── db/              # Database schema and migrations
│   └── schema.ts    # Drizzle schema definitions
├── middleware/      # Express middleware (auth, error handling)
├── routes/          # API route handlers
│   ├── auth.ts      # Authentication endpoints
│   ├── user.ts      # User management endpoints
│   ├── public.ts    # Public routes aggregator
│   └── private.ts   # Protected routes aggregator
├── services/        # Business logic
│   └── userService.ts
├── types/           # TypeScript type definitions
│   ├── api.ts
│   └── user.ts
├── utils/           # Helper utilities
│   ├── validation.ts
│   └── errorHandler.ts
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

### Code Quality

- **Error Codes:** Machine-readable error codes for all errors
- **Reusable Helpers:** Centralized validation and error handling
- **REST Best Practices:** PATCH for partial updates
- **Functional Programming:** Array methods instead of loops
- **Type Safety:** Full TypeScript support

## License

MIT
