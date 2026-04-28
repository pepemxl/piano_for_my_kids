// Seeds lessons into the database. Run after applying db/schema.sql.
//   node scripts/init-db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const { lessons } = require('../data/lessons');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log(`Seeding ${lessons.length} lessons...`);
  for (const lesson of lessons) {
    const totalSteps = lesson.steps.length;
    await conn.execute(
      `INSERT INTO lessons (slug, module, title, description, difficulty, ordering, steps_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         module = VALUES(module),
         title = VALUES(title),
         description = VALUES(description),
         difficulty = VALUES(difficulty),
         ordering = VALUES(ordering),
         steps_json = VALUES(steps_json)`,
      [
        lesson.slug,
        lesson.module,
        lesson.title,
        lesson.description,
        lesson.difficulty,
        lesson.ordering,
        JSON.stringify(lesson.steps)
      ]
    );
    console.log(`  - ${lesson.slug} (${totalSteps} steps)`);
  }

  await conn.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
