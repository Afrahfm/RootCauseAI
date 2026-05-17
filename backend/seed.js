import pool from './db/pool.js';
import bcrypt from 'bcrypt';

const seedData = async () => {
  try {
    console.log('Seeding database...');
    
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    let userId;
    
    if (userRes.rows.length === 0) {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      const insertUserRes = await pool.query(
        'INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['test@example.com', 'Test User', passwordHash]
      );
      userId = insertUserRes.rows[0].id;
      console.log('Created test user: test@example.com / Password123!');
    } else {
      userId = userRes.rows[0].id;
      console.log('Test user already exists.');
    }

    const analysisRes = await pool.query('SELECT * FROM analyses WHERE user_id = $1', [userId]);
    if (analysisRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO analyses 
        (user_id, user_input, hidden_problem, wrong_solution, wrong_solution_cost, right_solution, right_solution_cost, savings, tech_stack) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          "We need an AI chatbot for customer support because our support reps are overwhelmed.",
          "Customers are calling repeatedly because they cannot find the status of their order on the website.",
          "Enterprise AI Chatbot",
          "$150,000",
          "Add a simple 'Track Order' button connected to your existing ERP API.",
          "$5,000",
          "$145,000",
          JSON.stringify(["React", "Node.js", "ERP API"])
        ]
      );
      console.log('Created sample analysis.');
    } else {
      console.log('Sample analyses already exist.');
    }
    
    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
