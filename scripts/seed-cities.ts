import { CITIES } from '../src/lib/cities';
import mysql from 'mysql2/promise';

async function seedCities(): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'paisareality',
  });

  console.log('Connected to MySQL. Seeding cities...');

  for (const city of CITIES) {
    try {
      await connection.execute(
        `INSERT INTO cities (slug, name, name_hi, state, is_metro, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), name_hi=VALUES(name_hi), state=VALUES(state),
         is_metro=VALUES(is_metro), latitude=VALUES(latitude), longitude=VALUES(longitude)`,
        [city.slug, city.name, city.nameHi, city.state, city.isMetro, city.latitude, city.longitude]
      );
      console.log(`  Inserted/updated: ${city.name} (${city.state})`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  Error for ${city.name}: ${msg}`);
    }
  }

  console.log(`\nDone. ${CITIES.length} cities seeded.`);
  await connection.end();
}

seedCities().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});