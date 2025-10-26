import { db } from "../server/db";
import { schools } from "../shared/schema";
import { readFileSync } from "fs";
import { sql } from "drizzle-orm";

// Function to create a slug from school name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .trim();
}

async function populateSchools() {
  console.log('Reading CSV file...');
  const csvContent = readFileSync('/tmp/world-universities.csv', 'utf-8');
  
  // Parse CSV and filter US universities
  const lines = csvContent.split('\n');
  const usUniversities: { name: string; slug: string }[] = [];
  
  for (const line of lines) {
    if (line.startsWith('US,')) {
      const parts = line.split(',');
      const name = parts[1];
      if (name && name.trim()) {
        const slug = createSlug(name);
        usUniversities.push({ name: name.trim(), slug });
      }
    }
  }
  
  console.log(`Found ${usUniversities.length} US universities`);
  
  // Get existing schools to avoid duplicates
  console.log('Fetching existing schools...');
  const existingSchools = await db.select({ slug: schools.slug }).from(schools);
  const existingSlugs = new Set(existingSchools.map(s => s.slug));
  
  // Filter out schools that already exist
  const newSchools = usUniversities.filter(school => !existingSlugs.has(school.slug));
  console.log(`${existingSlugs.size} schools already exist, adding ${newSchools.length} new schools`);
  
  if (newSchools.length === 0) {
    console.log('No new schools to add');
    return;
  }
  
  // Insert in batches of 100 to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < newSchools.length; i += batchSize) {
    const batch = newSchools.slice(i, i + batchSize);
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newSchools.length / batchSize)}...`);
    
    await db.insert(schools).values(
      batch.map(school => ({
        id: sql`gen_random_uuid()`,
        slug: school.slug,
        name: school.name,
      }))
    ).onConflictDoNothing();
  }
  
  console.log('Done! Successfully populated schools table');
  
  // Verify count
  const count = await db.select({ count: sql<number>`count(*)` }).from(schools);
  console.log(`Total schools in database: ${count[0].count}`);
  
  process.exit(0);
}

populateSchools().catch(error => {
  console.error('Error populating schools:', error);
  process.exit(1);
});
