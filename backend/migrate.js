import pool from './db/pool.js';

async function runMigration() {
  console.log('🚀 Starting Database Migration...');
  
  try {
    // 1. Create verification_codes table
    console.log('📦 Creating table verification_codes if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create linkedin_verifications table
    console.log('📦 Creating table linkedin_verifications if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS linkedin_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        linkedin_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        verified_workplace BOOLEAN DEFAULT FALSE,
        company_name VARCHAR(255),
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Helper to check if column exists
    const columnExists = async (table, column) => {
      const [rows] = await pool.query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        ['rootcauseai_db', table, column]
      );
      return rows && rows.length > 0;
    };

    // 4. Alter approved_companies
    console.log('🔧 Checking and altering approved_companies...');
    if (!(await columnExists('approved_companies', 'is_verified'))) {
      console.log('   Adding is_verified to approved_companies...');
      await pool.query('ALTER TABLE approved_companies ADD COLUMN is_verified BOOLEAN DEFAULT FALSE');
    }
    if (!(await columnExists('approved_companies', 'linkedin_verified'))) {
      console.log('   Adding linkedin_verified to approved_companies...');
      await pool.query('ALTER TABLE approved_companies ADD COLUMN linkedin_verified BOOLEAN DEFAULT FALSE');
    }

    // 5. Alter employee_verification_log
    console.log('🔧 Checking and altering employee_verification_log...');
    if (!(await columnExists('employee_verification_log', 'verification_method'))) {
      console.log('   Adding verification_method to employee_verification_log...');
      await pool.query(`ALTER TABLE employee_verification_log ADD COLUMN verification_method ENUM('linkedin', 'email_code', 'admin') DEFAULT 'email_code'`);
    }
    if (!(await columnExists('employee_verification_log', 'ip_address'))) {
      console.log('   Adding ip_address to employee_verification_log...');
      await pool.query('ALTER TABLE employee_verification_log ADD COLUMN ip_address VARCHAR(45)');
    }

    // 6. Alter users
    console.log('🔧 Checking and altering users...');
    if (!(await columnExists('users', 'verification_method'))) {
      console.log('   Adding verification_method to users...');
      await pool.query('ALTER TABLE users ADD COLUMN verification_method VARCHAR(50)');
    }
    if (!(await columnExists('users', 'linkedin_id'))) {
      console.log('   Adding linkedin_id to users...');
      await pool.query('ALTER TABLE users ADD COLUMN linkedin_id VARCHAR(255)');
    }

    // 7. Seed approved companies
    console.log('🌱 Seeding pre-approved demo companies...');
    const demoCompanies = [
      ['TCS', 'tcs.com', 'enterprise', true],
      ['Cognizant', 'cognizant.com', 'enterprise', true],
      ['Zoho', 'zoho.com', 'enterprise', true],
      ['Hexaware', 'hexaware.com', 'enterprise', true],
      ['Demo Startup 1', 'demostartup1.com', 'startup', true],
      ['Demo Startup 2', 'demostartup2.com', 'startup', true],
      ['Demo Startup 3', 'demostartup3.com', 'startup', true]
    ];

    for (const [name, domain, type, verified] of demoCompanies) {
      await pool.query(`
        INSERT INTO approved_companies (company_name, company_domain, company_type, is_verified, is_active)
        VALUES (?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE 
          company_name = VALUES(company_name), 
          company_type = VALUES(company_type), 
          is_verified = VALUES(is_verified)
      `, [name, domain, type, verified]);
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
