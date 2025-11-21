#!/usr/bin/env tsx
/**
 * Seed script to create two test users in the same school for multi-account testing
 *
 * Usage: npx tsx scripts/seedTwoUsers.ts
 */

import "dotenv/config";
import { db } from "../server/db";
import { users, schools, schoolMemberships } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const TEST_SCHOOL_SLUG = "test-school";
const TEST_SCHOOL_NAME = "Test University";

const TEST_USERS = [
  {
    username: "alice",
    email: "alice@test.com",
    password: "pass",
    displayName: "Alice Test",
  },
  {
    username: "bob",
    email: "bob@test.com",
    password: "pass",
    displayName: "Bob Test",
  },
];

async function main() {
  try {
    console.log("🌱 Starting seed script for two test users...\n");

    // 1. Ensure test school exists
    let school = await db.query.schools.findFirst({
      where: eq(schools.slug, TEST_SCHOOL_SLUG),
    });

    if (!school) {
      console.log(`Creating test school: ${TEST_SCHOOL_NAME} (${TEST_SCHOOL_SLUG})`);
      [school] = await db
        .insert(schools)
        .values({
          slug: TEST_SCHOOL_SLUG,
          name: TEST_SCHOOL_NAME,
        })
        .returning();
      console.log(`✅ School created: ${school.id}\n`);
    } else {
      console.log(`✅ School already exists: ${school.name} (${school.id})\n`);
    }

    // 2. Create or update test users
    for (const userData of TEST_USERS) {
      console.log(`Processing user: ${userData.username}...`);

      // Check if user exists
      let user = await db.query.users.findFirst({
        where: eq(users.username, userData.username),
      });

      const hashedPassword = await bcrypt.hash(userData.password, 12);

      if (!user) {
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            displayName: userData.displayName,
          })
          .returning();
        console.log(`  ✅ User created: ${user.id}`);
      } else {
        // Update existing user's password to ensure it matches
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        console.log(`  ✅ User already exists: ${user.id} (password updated)`);
      }

      // Ensure user is member of test school
      const membership = await db.query.schoolMemberships.findFirst({
        where: and(
          eq(schoolMemberships.userId, user.id),
          eq(schoolMemberships.schoolId, school.id)
        ),
      });

      if (!membership) {
        await db.insert(schoolMemberships).values({
          userId: user.id,
          schoolId: school.id,
        });
        console.log(`  ✅ Added to ${TEST_SCHOOL_NAME}`);
      } else {
        console.log(`  ✅ Already member of ${TEST_SCHOOL_NAME}`);
      }

      console.log(`  📧 Email: ${user.email}`);
      console.log(`  🔑 Password: ${userData.password}`);
      console.log("");
    }

    console.log("✅ Seed script completed successfully!\n");
    console.log("Test Credentials:");
    console.log("━".repeat(50));
    for (const userData of TEST_USERS) {
      console.log(`Username: ${userData.username}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Password: ${userData.password}`);
      console.log(`School: ${TEST_SCHOOL_SLUG}`);
      console.log("━".repeat(50));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  }
}

main();
