import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Connecting to MySQL DB:', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'rootcauseai_db'
});

// Create MySQL connection pool
const realPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'rootcauseai_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

let useMock = false;
const mockPath = path.join(__dirname, 'mock_storage.json');

// Test connection on startup
(async () => {
    try {
        const connection = await realPool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        console.log('🔄 Switching to Mock Database Fallback (JSON Storage) using mock_storage.json...');
        useMock = true;
    }
})();

// Helper functions for mock storage CRUD
async function readMock() {
  try {
    const data = await fs.readFile(mockPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], analyses: [], userIdCounter: 1007, analysisIdCounter: 1 };
  }
}

async function writeMock(data) {
  await fs.writeFile(mockPath, JSON.stringify(data, null, 2), 'utf8');
}

async function mockQuery(sql, params = []) {
  const data = await readMock();
  const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  console.log(`[MOCK DB QUERY] Executing SQL: "${sql}" with params:`, params);

  // 1. SELECT * FROM users WHERE email = $1 / ?
  if (normalizedSql.startsWith('select * from users where email =')) {
    const email = params[0].toLowerCase();
    const rows = data.users.filter(u => u.email.toLowerCase() === email);
    return { rows, rowCount: rows.length };
  }

  // 2. INSERT INTO users (email, full_name, password_hash)
  if (normalizedSql.startsWith('insert into users')) {
    const [email, fullName, passwordHash] = params;
    const newUser = {
      id: data.userIdCounter++,
      email,
      full_name: fullName,
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expiry: null,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    await writeMock(data);
    return { rows: [newUser], rowCount: 1 };
  }

  // 3. UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3
  if (normalizedSql.startsWith('update users set reset_token =')) {
    const [resetToken, resetTokenExpiry, email] = params;
    let rowCount = 0;
    data.users = data.users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        rowCount = 1;
        return { ...u, reset_token: resetToken, reset_token_expiry: resetTokenExpiry };
      }
      return u;
    });
    await writeMock(data);
    return { rows: [], rowCount };
  }

  // 4. SELECT * FROM users WHERE reset_token = $1
  if (normalizedSql.startsWith('select * from users where reset_token =')) {
    const resetToken = params[0];
    const rows = data.users.filter(u => u.reset_token === resetToken);
    return { rows, rowCount: rows.length };
  }

  // 5. UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2
  if (normalizedSql.includes('reset_token = null') && normalizedSql.includes('where id =')) {
    const [passwordHash, id] = params;
    let rowCount = 0;
    data.users = data.users.map(u => {
      if (Number(u.id) === Number(id)) {
        rowCount = 1;
        return { ...u, password_hash: passwordHash, reset_token: null, reset_token_expiry: null };
      }
      return u;
    });
    await writeMock(data);
    return { rows: [], rowCount };
  }

  // 6. SELECT id, email, full_name, created_at FROM users WHERE id = $1
  // or SELECT id, email, full_name FROM users WHERE id = $1
  if (normalizedSql.startsWith('select id, email, full_name') && normalizedSql.includes('where id =')) {
    const id = params[0];
    const rows = data.users.filter(u => Number(u.id) === Number(id)).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      created_at: u.created_at
    }));
    return { rows, rowCount: rows.length };
  }

  // 7. SELECT * FROM users WHERE id = $1
  if (normalizedSql.startsWith('select * from users where id =')) {
    const id = params[0];
    const rows = data.users.filter(u => Number(u.id) === Number(id));
    return { rows, rowCount: rows.length };
  }

  // 8. UPDATE users SET password_hash = $1 WHERE id = $2
  if (normalizedSql.startsWith('update users set password_hash =') && normalizedSql.includes('where id =')) {
    const [passwordHash, id] = params;
    let rowCount = 0;
    data.users = data.users.map(u => {
      if (Number(u.id) === Number(id)) {
        rowCount = 1;
        return { ...u, password_hash: passwordHash };
      }
      return u;
    });
    await writeMock(data);
    return { rows: [], rowCount };
  }

  // 9. SELECT id, email, full_name, created_at FROM users ORDER BY id DESC
  if (normalizedSql.startsWith('select id, email, full_name, created_at from users')) {
    const rows = [...data.users]
      .sort((a, b) => b.id - a.id)
      .map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        created_at: u.created_at
      }));
    return { rows, rowCount: rows.length };
  }

  // 10. INSERT INTO analyses
  if (normalizedSql.startsWith('insert into analyses')) {
    const [
      userId,
      userInput,
      hiddenProblem,
      wrongSolution,
      wrongSolutionCost,
      rightSolution,
      rightSolutionCost,
      savings,
      techStack
    ] = params;

    const newAnalysis = {
      id: data.analysisIdCounter++,
      user_id: userId,
      user_input: userInput,
      hidden_problem: hiddenProblem,
      wrong_solution: wrongSolution,
      wrong_solution_cost: wrongSolutionCost,
      right_solution: rightSolution,
      right_solution_cost: rightSolutionCost,
      savings,
      tech_stack: techStack,
      created_at: new Date().toISOString()
    };
    data.analyses.push(newAnalysis);
    await writeMock(data);
    return { rows: [newAnalysis], rowCount: 1 };
  }

  // 11. SELECT * FROM analyses WHERE user_id = $1 ORDER BY id DESC
  if (normalizedSql.startsWith('select * from analyses where user_id =')) {
    const userId = params[0];
    const rows = data.analyses
      .filter(a => Number(a.user_id) === Number(userId))
      .sort((a, b) => b.id - a.id);
    return { rows, rowCount: rows.length };
  }

  // 12. SELECT * FROM analyses WHERE id = $1 AND user_id = $2
  if (normalizedSql.startsWith('select * from analyses where id =')) {
    const [id, userId] = params;
    const rows = data.analyses.filter(
      a => Number(a.id) === Number(id) && Number(a.user_id) === Number(userId)
    );
    return { rows, rowCount: rows.length };
  }

  // 13. DELETE FROM analyses WHERE id = $1 AND user_id = $2
  if (normalizedSql.startsWith('delete from analyses where id =')) {
    const [id, userId] = params;
    const initialLen = data.analyses.length;
    data.analyses = data.analyses.filter(
      a => !(Number(a.id) === Number(id) && Number(a.user_id) === Number(userId))
    );
    const rowCount = initialLen - data.analyses.length;
    await writeMock(data);
    return { rows: [], rowCount };
  }

  console.warn(`[MOCK DB] Unhandled query: "${sql}"`);
  return { rows: [], rowCount: 0 };
}

// PostgreSQL compatible MySQL Query Interceptor Wrapper
const pool = {
  query: async (sql, params = []) => {
    if (useMock) {
      return await mockQuery(sql, params);
    }

    // 1. Convert PostgreSQL placeholders ($1, $2, ...) to MySQL ? placeholders
    let mysqlSql = sql.replace(/\$\d+/g, '?');

    console.log(`[DB QUERY] Executing SQL: "${mysqlSql}" with params:`, params);

    // 2. Handle PostgreSQL-specific RETURNING * clauses
    const hasReturning = sql.toUpperCase().includes('RETURNING');
    if (hasReturning) {
      // Strip out the RETURNING clause from the MySQL statement
      mysqlSql = mysqlSql.replace(/RETURNING\s+\*/gi, '').trim();
      
      console.log(`[DB QUERY] Stripped RETURNING from insert. Executing clean insert: "${mysqlSql}"`);
      // Execute the insert
      const [insertResult] = await realPool.execute(mysqlSql, params);
      const insertId = insertResult.insertId;
      console.log(`[DB QUERY] Insert succeeded. Generated ID: ${insertId}. Fetching row...`);

      // Extract table name to select the newly inserted row
      const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : '';

      // Fetch the newly inserted row to mimic PG's RETURNING *
      const [rows] = await realPool.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [insertId]);
      console.log(`[DB QUERY] Fetched returning row:`, rows);
      return {
        rows: rows,
        rowCount: rows.length
      };
    }

    // 3. Execute normal MySQL query
    const [rows] = await realPool.execute(mysqlSql, params);
    console.log(`[DB QUERY] Query completed. Returned ${Array.isArray(rows) ? rows.length : 1} rows.`);
    
    return {
      rows: Array.isArray(rows) ? rows : [rows],
      rowCount: Array.isArray(rows) ? rows.length : (rows ? 1 : 0)
    };
  }
};

export default pool;