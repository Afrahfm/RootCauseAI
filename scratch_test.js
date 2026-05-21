import pool from './backend/db/pool.js';

async function test() {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    console.log('Success:', rows);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

test();
