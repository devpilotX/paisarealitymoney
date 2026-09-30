import { CITIES } from '../src/lib/cities';
import { buildScriptPool } from './lib/script-pool';

async function seedCities(): Promise<void> {
  const pool = buildScriptPool();
  console.log('Connected to PostgreSQL. Seeding cities...');
  let failed = 0;

  try {
    for (const city of CITIES) {
      try {
        await pool.query(
          `INSERT INTO cities (slug, name, name_hi, state, is_metro, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, name_hi = EXCLUDED.name_hi,
             state = EXCLUDED.state, is_metro = EXCLUDED.is_metro,
             latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
          [city.slug, city.name, city.nameHi, city.state, city.isMetro, city.latitude, city.longitude],
        );
      } catch (error) {
        failed++;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`  Error for ${city.name}: ${msg}`);
      }
    }
    console.log(`Done. ${CITIES.length - failed} of ${CITIES.length} cities seeded.`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedCities().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
