import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create postgres connection for Supabase
export const client = postgres(process.env.DATABASE_URL, {
  prepare: false, // Required for Supabase connection pooling
});

export const db = drizzle(client, { schema });
