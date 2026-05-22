import pool from './db/pool.js';

async function runMigration() {
  console.log('🚀 Starting Database Migration...');
  
  try {
    // 1. Create otp_sessions table and clean up old verification_codes table
    console.log('📦 Creating table otp_sessions if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        linkedin_id VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🗑️ Dropping verification_codes table if exists...');
    await pool.query('DROP TABLE IF EXISTS verification_codes');

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

    // 2.5. Create linkedin_badge_checks table
    console.log('📦 Creating table linkedin_badge_checks if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS linkedin_badge_checks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        email VARCHAR(255),
        has_badge BOOLEAN DEFAULT FALSE,
        verification_level VARCHAR(50),
        verified_company VARCHAR(255),
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    console.log('   Expanding verification_method ENUM to include email_otp...');
    await pool.query(`ALTER TABLE employee_verification_log MODIFY COLUMN verification_method ENUM('linkedin', 'email_code', 'email_otp', 'admin') DEFAULT 'email_code'`);
    
    if (!(await columnExists('employee_verification_log', 'ip_address'))) {
      console.log('   Adding ip_address to employee_verification_log...');
      await pool.query('ALTER TABLE employee_verification_log ADD COLUMN ip_address VARCHAR(45)');
    }
    if (!(await columnExists('employee_verification_log', 'linkedin_verification_level'))) {
      console.log('   Adding linkedin_verification_level to employee_verification_log...');
      await pool.query('ALTER TABLE employee_verification_log ADD COLUMN linkedin_verification_level VARCHAR(50)');
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
    // Check if unique index or constraint is needed for linkedin_id
    try {
      await pool.query('ALTER TABLE users ADD UNIQUE INDEX unique_linkedin_id (linkedin_id)');
      console.log('   Added unique index unique_linkedin_id to users table');
    } catch (e) {
      // Index might already exist or contain duplicates (we'll ignore gracefully)
      console.log('   Unique index unique_linkedin_id already exists or error adding: ', e.message);
    }

    if (!(await columnExists('users', 'linkedin_verification_level'))) {
      console.log('   Adding linkedin_verification_level to users...');
      await pool.query('ALTER TABLE users ADD COLUMN linkedin_verification_level VARCHAR(50)');
    }
    if (!(await columnExists('users', 'linkedin_verified_at'))) {
      console.log('   Adding linkedin_verified_at to users...');
      await pool.query('ALTER TABLE users ADD COLUMN linkedin_verified_at TIMESTAMP NULL');
    }
    if (!(await columnExists('users', 'linkedin_verified'))) {
      console.log('   Adding linkedin_verified to users...');
      await pool.query('ALTER TABLE users ADD COLUMN linkedin_verified BOOLEAN DEFAULT FALSE');
    }
    if (!(await columnExists('users', 'verification_source'))) {
      console.log('   Adding verification_source to users...');
      await pool.query(`ALTER TABLE users ADD COLUMN verification_source ENUM('linkedin_badge', 'email_otp', 'admin') DEFAULT 'email_otp'`);
    }

    if (!(await columnExists('users', 'trust_level'))) {
      console.log('   Adding trust_level to users...');
      await pool.query("ALTER TABLE users ADD COLUMN trust_level ENUM('high', 'medium', 'low') DEFAULT 'low'");
    }
    if (!(await columnExists('users', 'admin_approved'))) {
      console.log('   Adding admin_approved to users...');
      await pool.query("ALTER TABLE users ADD COLUMN admin_approved BOOLEAN DEFAULT FALSE");
    }
    if (!(await columnExists('users', 'approved_by'))) {
      console.log('   Adding approved_by to users...');
      await pool.query("ALTER TABLE users ADD COLUMN approved_by VARCHAR(255)");
    }
    if (!(await columnExists('users', 'approved_at'))) {
      console.log('   Adding approved_at to users...');
      await pool.query("ALTER TABLE users ADD COLUMN approved_at TIMESTAMP NULL");
    }
    if (!(await columnExists('users', 'verification_notes'))) {
      console.log('   Adding verification_notes to users...');
      await pool.query("ALTER TABLE users ADD COLUMN verification_notes TEXT");
    }

    // Two-Stage Approval additions to users
    if (!(await columnExists('users', 'role'))) {
      console.log('   Adding role to users...');
      await pool.query("ALTER TABLE users ADD COLUMN role ENUM('admin', 'hr', 'employee') DEFAULT 'employee'");
    }
    if (!(await columnExists('users', 'company_id'))) {
      console.log('   Adding company_id to users...');
      await pool.query("ALTER TABLE users ADD COLUMN company_id INT");
    }
    if (!(await columnExists('users', 'hr_approved'))) {
      console.log('   Adding hr_approved to users...');
      await pool.query("ALTER TABLE users ADD COLUMN hr_approved BOOLEAN DEFAULT FALSE");
    }
    if (!(await columnExists('users', 'approval_stage'))) {
      console.log('   Adding approval_stage to users...');
      await pool.query("ALTER TABLE users ADD COLUMN approval_stage ENUM('pending', 'hr_approved', 'fully_approved') DEFAULT 'pending'");
    }

    console.log('📦 Creating table companies if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📦 Creating table pending_approvals if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        verification_method VARCHAR(50),
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add Two-Stage columns to pending_approvals
    if (!(await columnExists('pending_approvals', 'hr_approved'))) {
      console.log('   Adding hr_approved to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN hr_approved BOOLEAN DEFAULT FALSE");
    }
    if (!(await columnExists('pending_approvals', 'hr_approved_by'))) {
      console.log('   Adding hr_approved_by to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN hr_approved_by VARCHAR(255)");
    }
    if (!(await columnExists('pending_approvals', 'hr_approved_at'))) {
      console.log('   Adding hr_approved_at to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN hr_approved_at TIMESTAMP NULL");
    }
    if (!(await columnExists('pending_approvals', 'admin_approved'))) {
      console.log('   Adding admin_approved to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN admin_approved BOOLEAN DEFAULT FALSE");
    }
    if (!(await columnExists('pending_approvals', 'admin_approved_by'))) {
      console.log('   Adding admin_approved_by to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN admin_approved_by VARCHAR(255)");
    }
    if (!(await columnExists('pending_approvals', 'admin_approved_at'))) {
      console.log('   Adding admin_approved_at to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN admin_approved_at TIMESTAMP NULL");
    }
    if (!(await columnExists('pending_approvals', 'company_id'))) {
      console.log('   Adding company_id to pending_approvals...');
      await pool.query("ALTER TABLE pending_approvals ADD COLUMN company_id INT");
    }

    console.log('🔄 Updating trust levels for existing users...');
    await pool.query("UPDATE users SET trust_level = 'high', admin_approved = TRUE, hr_approved = TRUE, approval_stage = 'fully_approved' WHERE linkedin_verified = TRUE");

    // Seed approved companies in approved_companies (original schema compat)
    console.log('🌱 Seeding pre-approved demo companies...');
    const demoCompanies = [
      ['TCS', 'tcs.com', 'enterprise', true],
      ['Cognizant', 'cognizant.com', 'enterprise', true],
      ['Zoho', 'zoho.com', 'enterprise', true],
      ['Hexaware', 'hexaware.com', 'enterprise', true],
      ['Demo Startup 1', 'demostartup1.com', 'startup', true],
      ['Demo Startup 2', 'demostartup2.com', 'startup', true],
      ['Demo Startup 3', 'demostartup3.com', 'startup', true],
      ['Tech Startup Inc', 'techstartup.com', 'startup', true],
      ['Innovate Solutions', 'innovate.io', 'startup', true],
      ['Creative Labs', 'creative.io', 'startup', true]
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

    // Seed into new companies table
    console.log('🏢 Seeding new companies table...');
    const mainCompanies = [
      ['Tech Startup Inc', 'techstartup.com'],
      ['Innovate Solutions', 'innovate.io'],
      ['Creative Labs', 'creative.io']
    ];
    for (const [name, domain] of mainCompanies) {
      await pool.query(`
        INSERT INTO companies (name, domain)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `, [name, domain]);
    }

    // Set admin user role
    console.log('👑 Configuring admin role...');
    await pool.query(`
      UPDATE users 
      SET role = 'admin', hr_approved = TRUE, admin_approved = TRUE, approval_stage = 'fully_approved' 
      WHERE email = 'afrahfathimahms9333@gmail.com'
    `);

    // Create HR users in users table
    console.log('👥 Seeding HR managers...');
    const hrUsers = [
      ['hr@techstartup.com', 'Tech Startup HR', 'hr123', 'hr', 1],
      ['hr@innovate.io', 'Innovate HR', 'hr123', 'hr', 2]
    ];
    for (const [email, fullName, password, role, companyId] of hrUsers) {
      await pool.query(`
        INSERT INTO users (email, full_name, password_hash, role, company_id, is_verified, trust_level, admin_approved, hr_approved, approval_stage)
        VALUES (?, ?, ?, ?, ?, TRUE, 'high', TRUE, TRUE, 'fully_approved')
        ON DUPLICATE KEY UPDATE role = VALUES(role), company_id = VALUES(company_id)
      `, [email, fullName, password, role, companyId]);
    }

    // Create demo employees and pending approvals
    console.log('👨‍💻 Seeding demo employees and review queue...');
    const demoEmployees = [
      ['newhire@techstartup.com', 'John New Hire', 'employee123', 'employee', 1, 'Tech Startup Inc'],
      ['sarah@innovate.io', 'Sarah Chen', 'employee123', 'employee', 2, 'Innovate Solutions']
    ];

    for (const [email, fullName, password, role, companyId, companyName] of demoEmployees) {
      // 1. Insert user
      const [res] = await pool.query(`
        INSERT INTO users (email, full_name, password_hash, role, company_id, is_verified, trust_level, admin_approved, hr_approved, approval_stage)
        VALUES (?, ?, ?, ?, ?, TRUE, 'low', FALSE, FALSE, 'pending')
        ON DUPLICATE KEY UPDATE role = VALUES(role), company_id = VALUES(company_id)
      `, [email, fullName, password, role, companyId]);

      // Get user id (either from result or select)
      let userId = res.insertId;
      if (!userId) {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        userId = existing[0].id;
      }

      // Clean up existing pending requests
      await pool.query('DELETE FROM pending_approvals WHERE user_id = ?', [userId]);

      // 2. Insert pending approval entry
      await pool.query(`
        INSERT INTO pending_approvals (user_id, email, full_name, company_name, company_id, verification_method, status)
        VALUES (?, ?, ?, ?, ?, 'email_otp', 'pending')
      `, [userId, email, fullName, companyName, companyId]);
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
