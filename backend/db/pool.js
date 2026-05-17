import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Test connection on startup
(async () => {
    try {
        const connection = await realPool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        console.error('Run: docker start rootcauseai-mysql');
        process.exit(1);
    }
})();

// PostgreSQL compatible MySQL Query Interceptor Wrapper
const pool = {
  query: async (sql, params = []) => {
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