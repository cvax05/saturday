
import postgres from 'postgres';
import "dotenv/config";

async function testDb() {
    console.log('Testing DB connection...');
    console.log('URL:', process.env.DATABASE_URL);

    try {
        const sql = postgres(process.env.DATABASE_URL!);
        const result = await sql`SELECT 1 as val`;
        console.log('Connection successful:', result);
        await sql.end();
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

testDb();
