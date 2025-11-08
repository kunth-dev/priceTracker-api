# Database Configuration

This project uses PostgreSQL as the database with DrizzleORM for type-safe database access.

## Overview

- **Database**: PostgreSQL
- **ORM**: DrizzleORM
- **Migration Tool**: Drizzle Kit

## Prerequisites

- PostgreSQL 12 or higher installed and running
- Node.js >= 18.0.0

## Database Setup

### 1. Install PostgreSQL

Make sure PostgreSQL is installed on your system:

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE crypton_db;

# Exit psql
\q
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env` and update the `DATABASE_URL`:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL=postgresql://username:password@host:port/database

# Example:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crypton_db
```

**URL Format:**
- `username`: Your PostgreSQL username (default: `postgres`)
- `password`: Your PostgreSQL password
- `host`: Database host (default: `localhost`)
- `port`: Database port (default: `5432`)
- `database`: Database name (e.g., `crypton_db`)

### 4. Run Migrations

Push the schema to your database:

```bash
npm run db:push
```

This will create the necessary tables in your database.

## Database Schema

### Users Table

Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID (PK) | Unique user identifier (auto-generated) |
| `email` | TEXT (UNIQUE) | User's email address |
| `password` | TEXT | Hashed password (SHA-256 for demo, use bcrypt/argon2 in production) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Reset Codes Table

Stores password reset verification codes.

| Column | Type | Description |
|--------|------|-------------|
| `email` | TEXT (PK) | User's email address |
| `code` | TEXT | 6-digit reset code |
| `expires_at` | TIMESTAMP | Code expiration timestamp (15 minutes) |

## DrizzleORM Usage

### Configuration

The database configuration is located in `src/config/database.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
```

### Schema Definition

Schema is defined in `src/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: uuid("user_id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});
```

### Example Queries

**Insert a user:**
```typescript
import { db } from "../config/database";
import { users } from "../db/schema";

const [newUser] = await db
  .insert(users)
  .values({
    email: "user@example.com",
    password: "hashed_password",
  })
  .returning();
```

**Query a user:**
```typescript
import { eq } from "drizzle-orm";

const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, "user@example.com"))
  .limit(1);
```

**Update a user:**
```typescript
await db
  .update(users)
  .set({ email: "newemail@example.com", updatedAt: new Date().toISOString() })
  .where(eq(users.userId, userId));
```

**Delete a user:**
```typescript
await db.delete(users).where(eq(users.userId, userId));
```

## Available Database Scripts

The following npm scripts are available for database management:

```bash
# Generate migration files from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema changes directly to database (for development)
npm run db:push

# Open Drizzle Studio (GUI for database management)
npm run db:studio
```

## Drizzle Studio

Drizzle Studio is a visual database browser and editor. To launch it:

```bash
npm run db:studio
```

This will open a web interface (typically at `https://local.drizzle.studio`) where you can:
- View and edit data
- Explore schema
- Run queries
- Manage relationships

## Migration Workflow

### Development

For rapid development, use `db:push` to sync schema changes:

```bash
npm run db:push
```

This applies schema changes directly without creating migration files.

### Production

For production deployments, use migrations:

1. **Generate migrations** after schema changes:
   ```bash
   npm run db:generate
   ```

2. **Review generated SQL** in the `drizzle/` directory

3. **Apply migrations**:
   ```bash
   npm run db:migrate
   ```

## Switching from In-Memory Storage

This application previously used in-memory Map for storage. The migration to PostgreSQL provides:

✅ **Persistent storage** - Data survives application restarts  
✅ **Scalability** - Handle large datasets efficiently  
✅ **ACID compliance** - Data integrity and consistency  
✅ **Concurrent access** - Multiple instances can share data  
✅ **Backup & recovery** - Standard database tools apply  

## Security Considerations

⚠️ **Important**: The current implementation uses SHA-256 for password hashing, which is **NOT SECURE** for production use.

### For Production:

1. **Replace SHA-256 with bcrypt, scrypt, or Argon2**
   ```bash
   npm install bcrypt
   npm install -D @types/bcrypt
   ```

2. **Enable SSL for database connections**
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

3. **Use connection pooling** for better performance

4. **Implement proper database backup strategy**

5. **Set up database monitoring and alerts**

6. **Use read replicas** for scaling read operations

## Troubleshooting

### Connection Issues

**Error: "password authentication failed"**
- Verify PostgreSQL username and password
- Check `pg_hba.conf` authentication settings

**Error: "database does not exist"**
- Create the database: `CREATE DATABASE crypton_db;`

**Error: "could not connect to server"**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check host and port in `DATABASE_URL`

### Migration Issues

**Error: "relation already exists"**
- Drop existing tables or use a fresh database
- Review migration history in `drizzle/meta/_journal.json`

## Environment-Specific Configurations

### Development
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crypton_db
```

### Testing
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crypton_test_db
```

### Production
```env
DATABASE_URL=postgresql://user:password@prod-host:5432/crypton_db?sslmode=require
```

## Additional Resources

- [DrizzleORM Documentation](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
