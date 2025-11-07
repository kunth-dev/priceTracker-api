import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres connection
const queryClient = postgres(databaseUrl);

// Create drizzle instance
export const db = drizzle(queryClient, { schema });
