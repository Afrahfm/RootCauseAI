import pool from './backend/db/pool.js';

(async () => {
  try {
    console.log('Testing DB connection...');
    const result = await pool.query('SELECT 1 as val');
    console.log('Select 1 result:', result);

    console.log('Testing INSERT INTO analyses...');
    const insertRes = await pool.query(
      `INSERT INTO analyses 
      (user_id, user_input, hidden_problem, wrong_solution, wrong_solution_cost, right_solution, right_solution_cost, savings, tech_stack) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        999,
        'test input',
        'test problem',
        'test wrong',
        '$1',
        'test right',
        '$2',
        '$3',
        JSON.stringify(['tech1'])
      ]
    );
    console.log('Insert result:', insertRes);

  } catch (err) {
    console.error('DB Crash:', err);
  } finally {
    process.exit();
  }
})();
