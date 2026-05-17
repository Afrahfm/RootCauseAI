import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const realPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/real_problem_finder',
});

// In-memory fallback
let dbOffline = true; // Assume offline by default since Docker failed
const mockUsers = [];
const mockAnalyses = [];
let userIdCounter = 1;
let analysisIdCounter = 1;

realPool.on('error', (err) => {
  console.error('Unexpected error on idle client (DB might be offline)', err.message);
  dbOffline = true;
});

// Create a dummy user for testing
import bcrypt from 'bcrypt';
(async () => {
  const hash = await bcrypt.hash('Password123!', 10);
  mockUsers.push({
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    password_hash: hash,
    reset_token: null,
    reset_token_expiry: null
  });
  
  // Add professional demo user
  const demoHash = await bcrypt.hash('demo123', 10);
  mockUsers.push({
    id: 999,
    email: 'demo@rootcause.ai',
    full_name: 'Demo User',
    password_hash: demoHash,
    reset_token: null,
    reset_token_expiry: null
  });
  
  userIdCounter = 1000;
})();

const mockQuery = async (text, params = []) => {
  console.log('MOCK DB QUERY Fallback Used');
  if (text.includes('INSERT INTO users')) {
    const newUser = {
      id: userIdCounter++,
      email: params[0],
      full_name: params[1],
      password_hash: params[2],
      reset_token: null,
      reset_token_expiry: null
    };
    mockUsers.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }
  
  if (text.includes('SELECT * FROM users WHERE email')) {
    const user = mockUsers.find(u => u.email === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (text.includes('SELECT * FROM users WHERE id')) {
    const user = mockUsers.find(u => u.id === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }
  
  if (text.includes('SELECT * FROM users WHERE reset_token')) {
    const user = mockUsers.find(u => u.reset_token === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (text.includes('UPDATE users SET reset_token')) {
    const user = mockUsers.find(u => u.email === params[2]);
    if (user) {
      user.reset_token = params[0];
      user.reset_token_expiry = params[1];
    }
    return { rowCount: user ? 1 : 0 };
  }
  
  if (text.includes('UPDATE users SET password_hash')) {
    const user = mockUsers.find(u => u.id === params[1] || u.id === params[3]);
    if (user) {
      user.password_hash = params[0];
      user.reset_token = null;
      user.reset_token_expiry = null;
    }
    return { rowCount: user ? 1 : 0 };
  }

  if (text.includes('INSERT INTO analyses')) {
    const newAnalysis = {
      id: analysisIdCounter++,
      user_id: params[0],
      user_input: params[1],
      hidden_problem: params[2],
      wrong_solution: params[3],
      wrong_solution_cost: params[4],
      right_solution: params[5],
      right_solution_cost: params[6],
      savings: params[7],
      tech_stack: params[8],
      created_at: new Date().toISOString()
    };
    mockAnalyses.push(newAnalysis);
    return { rows: [newAnalysis], rowCount: 1 };
  }

  if (text.includes('SELECT * FROM analyses WHERE user_id')) {
    const analyses = mockAnalyses.filter(a => a.user_id === params[0]).sort((a,b) => b.id - a.id);
    return { rows: analyses, rowCount: analyses.length };
  }
  
  if (text.includes('SELECT * FROM analyses WHERE id = $1 AND user_id = $2')) {
    const analysis = mockAnalyses.find(a => a.id === parseInt(params[0]) && a.user_id === params[1]);
    return { rows: analysis ? [analysis] : [], rowCount: analysis ? 1 : 0 };
  }

  if (text.includes('DELETE FROM analyses')) {
    const index = mockAnalyses.findIndex(a => a.id === parseInt(params[0]) && a.user_id === params[1]);
    if (index > -1) {
      mockAnalyses.splice(index, 1);
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
};

const pool = {
  query: async (text, params) => {
    if (dbOffline) {
      return mockQuery(text, params);
    }
    try {
      return await realPool.query(text, params);
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED')) {
        console.warn('DB Connection refused, switching to mock DB fallback');
        dbOffline = true;
        return mockQuery(text, params);
      }
      throw error;
    }
  }
};

export default pool;
