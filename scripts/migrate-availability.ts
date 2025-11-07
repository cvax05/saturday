import { db } from "../server/db";
import { users, userAvailability } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to convert existing available_saturdays array data
 * into the new user_availability table with 'available' state.
 * 
 * Run with: npx tsx scripts/migrate-availability.ts
 */
async function migrateAvailability() {
  console.log("Starting availability migration...");
  
  try {
    // Get all users with available_saturdays data
    const usersWithAvailability = await db
      .select({
        id: users.id,
        availableSaturdays: users.availableSaturdays,
      })
      .from(users)
      .where(sql`${users.availableSaturdays} IS NOT NULL AND array_length(${users.availableSaturdays}, 1) > 0`);
    
    console.log(`Found ${usersWithAvailability.length} users with availability data`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const user of usersWithAvailability) {
      if (!user.availableSaturdays || user.availableSaturdays.length === 0) {
        continue;
      }
      
      // Convert each Saturday date to an availability entry
      for (const dateStr of user.availableSaturdays) {
        try {
          // Insert or ignore if already exists (idempotent)
          await db
            .insert(userAvailability)
            .values({
              userId: user.id,
              date: dateStr,
              state: 'available',
            })
            .onConflictDoNothing(); // Skip if already exists (user_id, date composite key)
          
          migrated++;
        } catch (error) {
          console.error(`Error migrating date ${dateStr} for user ${user.id}:`, error);
          skipped++;
        }
      }
    }
    
    console.log(`Migration complete!`);
    console.log(`- Migrated: ${migrated} availability entries`);
    console.log(`- Skipped: ${skipped} entries (duplicates or errors)`);
    console.log(`\nNote: available_saturdays column is preserved for backward compatibility`);
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateAvailability();
