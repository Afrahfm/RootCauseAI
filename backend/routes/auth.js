// import express from 'express';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import pool from '../db/pool.js';
// import { validate, signupSchema, loginSchema } from '../middleware/validation.js';
// import { authLimiter } from '../middleware/rateLimiter.js';
// import { sendResetEmail } from '../services/emailService.js';
// import { authenticate } from '../middleware/auth.js';

// const router = express.Router();

// // SIGNUP ROUTE
// router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
//   try {
//     const { email, fullName, password } = req.body;

//     // ✅ DEBUG: Log password to terminal (remove after hackathon)
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//     console.log('📝 NEW USER SIGNUP');
//     console.log('   Email:', email);
//     console.log('   Full Name:', fullName);
//     console.log('   Password:', password);
//     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

//     // Check if user exists
//     const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

//     if (existing && existing.length > 0) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     // Hash password before storing
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insert user with hashed password
//     await pool.query(
//       'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
//       [email, fullName, hashedPassword]
//     );

//     // Generate token for auto-login
//     const { rows: newUserRows } = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
//     const newUser = newUserRows[0];

//     const token = jwt.sign(
//       { id: newUser.id, email: email },
//       process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
//       { expiresIn: '7d' }
//     );

//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     console.log('✅ User created successfully. Password logged above.');

//     res.status(201).json({ 
//       success: true,
//       message: 'User created successfully',
//       user: { id: newUser.id, email, fullName },
//       token
//     });

//   } catch (error) {
//     console.error('Signup error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // LOGIN ROUTE - FIXED VERSION
// router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('🔐 Login attempt for:', email);
//     console.log('📝 Password received:', password ? 'Yes (length: ' + password.length + ')' : 'No');

//     // Get user from database
//     const { rows } = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

//     if (!rows || rows.length === 0) {
//       console.log('❌ User not found:', email);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const user = rows[0];
//     console.log('👤 User found:', user.email);
//     console.log('🔑 Stored hash:', user.password_hash.substring(0, 20) + '...');

//     // Compare password using bcrypt
//     const isMatch = await bcrypt.compare(password, user.password_hash);

//     console.log('🔐 Password match:', isMatch);

//     if (!isMatch) {
//       console.log('❌ Password mismatch for:', email);
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
//       { expiresIn: '7d' }
//     );

//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     console.log('✅ Login successful for:', email);

//     res.json({ 
//       success: true,
//       message: 'Logged in successfully',
//       user: { 
//         id: user.id, 
//         email: user.email, 
//         fullName: user.full_name 
//       },
//       token
//     });

//   } catch (error) {
//     console.error('❌ Login error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // DEMO LOGIN ROUTE
// router.post('/login-demo', async (req, res) => {
//   try {
//     // Check if demo user exists, if not create
//     const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = ?', ['demo@rootcauseai.com']);

//     let userId;
//     if (existing && existing.length > 0) {
//       userId = existing[0].id;
//     } else {
//       const hashedPassword = await bcrypt.hash('demo123', 10);
//       const [result] = await pool.query(
//         'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
//         ['demo@rootcauseai.com', 'Demo User', hashedPassword]
//       );
//       userId = result.insertId;
//     }

//     const token = jwt.sign(
//       { id: userId, email: 'demo@rootcauseai.com' },
//       process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
//       { expiresIn: '7d' }
//     );

//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     res.json({ 
//       success: true,
//       message: 'Demo login successful',
//       user: { id: userId, email: 'demo@rootcauseai.com', fullName: 'Demo User' },
//       token
//     });

//   } catch (error) {
//     console.error('Demo login error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // LOGOUT ROUTE
// router.post('/logout', authenticate, (req, res) => {
//   res.clearCookie('token');
//   res.json({ success: true, message: 'Logged out successfully' });
// });

// // FORGOT PASSWORD ROUTE
// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body;

//     const { rows } = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

//     if (rows && rows.length > 0) {
//       const resetToken = crypto.randomBytes(32).toString('hex');
//       const resetTokenExpiry = new Date(Date.now() + 3600000);

//       await pool.query(
//         'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
//         [resetToken, resetTokenExpiry, email]
//       );

//       await sendResetEmail(email, resetToken);
//     }

//     res.json({ message: 'If an account exists, a reset link has been sent.' });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // RESET PASSWORD ROUTE
// router.post('/reset-password/:token', async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     const { rows } = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);

//     if (!rows || rows.length === 0) {
//       return res.status(400).json({ error: 'Invalid or expired reset token' });
//     }

//     const user = rows[0];
//     if (new Date(user.reset_token_expiry) < new Date()) {
//       return res.status(400).json({ error: 'Reset token has expired' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await pool.query(
//       'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
//       [hashedPassword, user.id]
//     );

//     res.json({ message: 'Password has been reset successfully' });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // VERIFY TOKEN ROUTE
// router.get('/verify', authenticate, async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT id, email, full_name FROM users WHERE id = ?', [req.user.id]);

//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({ user: rows[0] });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// export default router;

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import nodemailer from 'nodemailer';
import pool from '../db/pool.js';
import { validate, signupSchema, loginSchema, sendCodeSchema, verifyCodeSchema } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendResetEmail } from '../services/emailService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// SIGNUP ROUTE - Stores PLAIN TEXT password with employee domain/ID verification
router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
  try {
    const { email, fullName, password, companyName } = req.body;
    let employeeId = req.body.employeeId ? req.body.employeeId.trim() : '';

    // ✅ DEBUG: Log plain text password and verification details to terminal
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 NEW USER SIGNUP');
    console.log('   Email:', email);
    console.log('   Full Name:', fullName);
    console.log('   Company Name:', companyName);
    console.log('   Employee ID:', employeeId);
    console.log('   🔓 PASSWORD (Plain Text):', password);
    console.log('═══════════════════════════════════════════════════');

    // Check if user exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 1. Personal email domain validation
    const domainMatch = email.match(/@(.+)$/);
    if (!domainMatch) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    const domain = domainMatch[1].toLowerCase().trim();

    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    if (personalDomains.includes(domain)) {
      return res.status(400).json({ error: 'Personal email domains are not allowed' });
    }

    // 2. Pre-approved company lookup
    const [companies] = await pool.query(
      'SELECT * FROM approved_companies WHERE company_domain = ? AND is_active = TRUE',
      [domain]
    );

    if (!companies || companies.length === 0) {
      // Log failed verification log
      await pool.query(
        'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_status, rejection_reason) VALUES (?, ?, ?, ?, ?)',
        [email, employeeId || null, domain, 'rejected', 'Domain not approved']
      );
      return res.status(400).json({ error: 'Company domain is not pre-approved' });
    }

    const company = companies[0];

    // 3. Employee ID verification against Regex pattern
    if (company.requires_employee_id) {
      if (!employeeId) {
        await pool.query(
          'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_status, rejection_reason) VALUES (?, ?, ?, ?, ?)',
          [email, null, domain, 'rejected', 'Missing Employee ID']
        );
        return res.status(400).json({ error: 'Employee ID is required for this company' });
      }

      const regex = new RegExp(company.employee_id_pattern);
      if (!regex.test(employeeId)) {
        await pool.query(
          'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_status, rejection_reason) VALUES (?, ?, ?, ?, ?)',
          [email, employeeId, domain, 'rejected', 'Invalid Employee ID format']
        );
        return res.status(400).json({ error: 'Invalid Employee ID format' });
      }
    }

    // 4. Verification logging success
    await pool.query(
      'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_status) VALUES (?, ?, ?, ?)',
      [email, employeeId || null, domain, 'approved']
    );

    // 5. Insert user with validated user type
    await pool.query(
      `INSERT INTO users (email, full_name, password_hash, user_type, company_name, employee_id, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        email,
        fullName,
        password, // ← plain text password!
        company.company_type, // 'startup' or 'enterprise'
        company.company_name,
        employeeId || null
      ]
    );

    // Get the new user
    const [newUserRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const newUser = newUserRows[0];

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: email },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    console.log('✅ User created with PLAIN TEXT password and VERIFIED domain');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { 
        id: newUser.id, 
        email: newUser.email, 
        fullName: newUser.full_name,
        user_type: newUser.user_type,
        userType: newUser.user_type,
        company_name: newUser.company_name,
        companyName: newUser.company_name,
        employee_id: newUser.employee_id,
        employeeId: newUser.employee_id,
        is_verified: newUser.is_verified,
        isVerified: newUser.is_verified
      },
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN ROUTE - Plain text comparison
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);
    console.log('🔓 Entered password:', password);

    // Get user from database
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (!rows || rows.length === 0) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('👤 User found:', user.email);
    console.log('📦 Stored password (plain text):', user.password_hash);

    // ✅ Direct plain text comparison
    if (password !== user.password_hash) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful');

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.full_name,
        user_type: user.user_type || 'startup',
        userType: user.user_type || 'startup',
        company_name: user.company_name,
        companyName: user.company_name,
        employee_id: user.employee_id,
        employeeId: user.employee_id,
        is_verified: user.is_verified,
        isVerified: user.is_verified
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DEMO LOGIN ROUTE - FIXED
router.post('/login-demo', async (req, res) => {
  try {
    console.log('🎯 Demo login requested');

    // Check if demo user exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', ['demo@rootcauseai.com']);

    let userId;
    if (existing && existing.length > 0) {
      userId = existing[0].id;
      console.log('✅ Demo user already exists with ID:', userId);
    } else {
      // Create demo user with PLAIN TEXT password
      const plainPassword = 'demo123';
      const [result] = await pool.query(
        'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
        ['demo@rootcauseai.com', 'Demo User', plainPassword]  // ← Plain text!
      );
      userId = result.insertId;
      console.log('✅ Demo user created with plain text password:', plainPassword);
    }

    // Get the demo user
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userRows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    console.log('✅ Demo login successful for:', user.email);
    console.log('🔓 Demo password is: demo123');

    res.json({
      success: true,
      message: 'Demo login successful',
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.full_name,
        user_type: user.user_type || 'startup',
        userType: user.user_type || 'startup',
        company_name: user.company_name || 'Acme Corp',
        companyName: user.company_name || 'Acme Corp',
        employee_id: user.employee_id,
        employeeId: user.employee_id,
        is_verified: user.is_verified,
        isVerified: user.is_verified
      },
      token
    });

  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGOUT ROUTE
router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// FORGOT PASSWORD ROUTE
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows && rows.length > 0) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await pool.query(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
        [resetToken, resetTokenExpiry, email]
      );

      await sendResetEmail(email, resetToken);
    }

    res.json({ message: 'If an account exists, a reset link has been sent.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// RESET PASSWORD ROUTE
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = rows[0];
    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Store plain text password
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [password, user.id]  // ← Plain text!
    );

    res.json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// VERIFY TOKEN ROUTE
router.get('/verify', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, full_name, user_type, company_name, employee_id, is_verified FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dbUser = rows[0];

    res.json({ 
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.full_name,
        user_type: dbUser.user_type,
        userType: dbUser.user_type,
        company_name: dbUser.company_name,
        companyName: dbUser.company_name,
        employee_id: dbUser.employee_id,
        employeeId: dbUser.employee_id,
        is_verified: dbUser.is_verified,
        isVerified: dbUser.is_verified
      } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// 🌟 LINKEDIN OAUTH ENDPOINTS (DUAL-MODE)
// ==========================================

// GET /api/auth/linkedin - Redirect to LinkedIn OAuth or Mock Portal
router.get('/linkedin', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const hasCreds = process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET;

  if (!hasCreds) {
    console.log('⚠️ LinkedIn credentials not found in env. Redirecting to offline Mock Portal...');
    return res.redirect(`${clientUrl}/linkedin-mock`);
  }

  const redirectUri = encodeURIComponent('http://localhost:5000/api/auth/linkedin/callback');
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=r_liteprofile%20r_emailaddress%20r_verify&state=rootcauseai_secure_state`;
  
  res.redirect(authUrl);
});

// GET /api/auth/linkedin/callback - Handles secure profile workplace check and registration
router.get('/linkedin/callback', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('❌ LinkedIn OAuth error:', error_description);
    return res.redirect(`${clientUrl}/login?auth_error=${encodeURIComponent(error_description)}`);
  }

  try {
    let email, fullName, linkedinId, companyName, verifiedWorkplace = false;

    // A. Detect Mock Callback Flow for offline hackathon presentations
    const isMock = !code || code.startsWith('mock_') || !process.env.LINKEDIN_CLIENT_ID;

    if (isMock) {
      console.log('🤖 Processed OFFLINE LinkedIn Mock Callback data...');
      email = req.query.email || 'alex.rivera@zoho.com';
      fullName = req.query.fullName || 'Alex Rivera';
      linkedinId = req.query.linkedinId || `li_mock_${Date.now()}`;
      companyName = req.query.companyName || 'Zoho';
      verifiedWorkplace = req.query.verifiedWorkplace === 'true';
    } else {
      // B. Real Live LinkedIn OAuth Exchange Flow
      console.log('🔄 Executing live LinkedIn token exchange...');
      
      const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:5000/api/auth/linkedin/callback',
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const accessToken = tokenRes.data.access_token;

      // Fetch profile & email address
      const [profileRes, emailRes, workplaceRes] = await Promise.all([
        axios.get('https://api.linkedin.com/v2/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('https://api.linkedin.com/v2/verifiedWorkplaces', { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => null)
      ]);

      fullName = `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`;
      linkedinId = profileRes.data.id;
      email = emailRes.data.elements[0]['handle~'].emailAddress;

      // Extract verified company if workplace verification records exist
      if (workplaceRes && workplaceRes.data && workplaceRes.data.elements && workplaceRes.data.elements.length > 0) {
        verifiedWorkplace = true;
        companyName = workplaceRes.data.elements[0].companyName || '';
      }
    }

    const domainMatch = email.match(/@(.+)$/);
    const domain = domainMatch ? domainMatch[1].toLowerCase().trim() : '';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Verify company in approved companies database
    const [companies] = await pool.query(
      'SELECT * FROM approved_companies WHERE company_domain = ? AND is_active = TRUE',
      [domain]
    );

    if (!companies || companies.length === 0) {
      console.log(`❌ LinkedIn workplace domain "@${domain}" not approved in system.`);
      
      // Audit log failed attempt
      await pool.query(
        'INSERT INTO employee_verification_log (email, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, "linkedin", "rejected", ?, ?)',
        [email, 'Domain not pre-approved', ipAddress]
      );

      return res.redirect(`${clientUrl}/login?auth_error=${encodeURIComponent(`Your company domain (@${domain}) is not pre-approved.`)}`);
    }

    const company = companies[0];

    // Log success workplace record
    await pool.query(
      'INSERT INTO linkedin_verifications (linkedin_id, email, full_name, verified_workplace, company_name) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE verified_workplace = VALUES(verified_workplace), company_name = VALUES(company_name)',
      [linkedinId, email, fullName, verifiedWorkplace, companyName || company.company_name]
    );

    await pool.query(
      'INSERT INTO employee_verification_log (email, verification_method, verification_status, ip_address) VALUES (?, "linkedin", "approved", ?)',
      [email, ipAddress]
    );

    // Get or Create user in DB
    const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (userRows && userRows.length > 0) {
      user = userRows[0];
      // Update verified status if needed
      await pool.query(
        'UPDATE users SET is_verified = TRUE, verification_method = "linkedin", linkedin_id = ? WHERE id = ?',
        [linkedinId, user.id]
      );
    } else {
      // Auto-create user with plain text random password
      const randomPassword = crypto.randomBytes(16).toString('hex');
      await pool.query(
        `INSERT INTO users (email, full_name, password_hash, user_type, company_name, is_verified, verification_method, linkedin_id) 
         VALUES (?, ?, ?, ?, ?, TRUE, "linkedin", ?)`,
        [email, fullName, randomPassword, company.company_type, company.company_name, linkedinId]
      );

      const [freshUserRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      user = freshUserRows[0];
    }

    // Generate token and sign in
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    console.log(`✅ LinkedIn authentication successful for ${email}. Redirecting to dashboard.`);
    res.redirect(`${clientUrl}/dashboard?auth_success=true&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      userType: user.user_type,
      companyName: user.company_name,
      isVerified: true,
      provider: 'linkedin'
    }))}`);

  } catch (err) {
    console.error('❌ LinkedIn callback failure:', err);
    res.redirect(`${clientUrl}/login?auth_error=${encodeURIComponent('LinkedIn server authentication failed.')}`);
  }
});

// ==========================================
// 📧 EMAIL OTP VERIFICATION ENDPOINTS
// ==========================================

// POST /api/auth/send-code - Pre-approves domain and dispatches OTP
router.post('/send-code', validate(sendCodeSchema), async (req, res) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    const domainMatch = email.match(/@(.+)$/);
    if (!domainMatch) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    const domain = domainMatch[1].toLowerCase().trim();

    // Direct block list check for personal emails
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    if (personalDomains.includes(domain)) {
      return res.status(400).json({ error: 'Personal email domains are not allowed' });
    }

    // Pre-approved company domain check
    const [companies] = await pool.query(
      'SELECT * FROM approved_companies WHERE company_domain = ? AND is_active = TRUE',
      [domain]
    );

    if (!companies || companies.length === 0) {
      // Log rejected audit trace
      await pool.query(
        'INSERT INTO employee_verification_log (email, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, "email_code", "rejected", "Domain not pre-approved", ?)',
        [email, ipAddress]
      );
      return res.status(400).json({ error: 'Company domain is not pre-approved' });
    }

    const company = companies[0];

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins expiry

    // Save to DB
    await pool.query(
      'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    // Print to server console in highly visible colorful ASCII banner for judge review
    console.log('\x1b[36m%s\x1b[0m', '┌────────────────────────────────────────────────────────┐');
    console.log('\x1b[36m%s\x1b[0m', '│               🔑 ROOTCAUSEAI VERIFICATION CODE         │');
    console.log('\x1b[36m%s\x1b[0m', '├────────────────────────────────────────────────────────┤');
    console.log(`\x1b[36m│\x1b[0m  Recipient: \x1b[33m${email.padEnd(43)}\x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  Verification Code: \x1b[32m\x1b[1m${code.padEnd(36)}\x1b[0m\x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  Expires in: \x1b[35m15 minutes\x1b[0m                                 \x1b[36m│\x1b[0m`);
    console.log('\x1b[36m%s\x1b[0m', '├────────────────────────────────────────────────────────┤');
    console.log('\x1b[36m%s\x1b[0m', '│   Type this code into the signup modal to proceed.     │');
    console.log('\x1b[36m%s\x1b[0m', '└────────────────────────────────────────────────────────┘');

    // Attempt real SMTP dispatch fallback if configured in env
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"RootCauseAI Security" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Your 6-Digit Workplace Verification Code',
          text: `Please enter the following 6-digit code to verify your employment: ${code}. It expires in 15 minutes.`,
          html: `<div style="font-family: sans-serif; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px;">
                   <h2 style="color: #4f46e5;">Verify Your Employment</h2>
                   <p>Welcome to RootCauseAI! Use the verification code below to authorize your account:</p>
                   <div style="font-size: 32px; font-weight: bold; background: #f3f4f6; color: #1e1b4b; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; letter-spacing: 4px;">
                     ${code}
                   </div>
                   <p style="color: #64748b; font-size: 12px;">This code will expire in 15 minutes. If you did not request this, you can ignore this email.</p>
                 </div>`
        });
        console.log('📧 Dispatch: Email sent successfully via SMTP!');
      } catch (smtpErr) {
        console.warn('⚠️ SMTP send error (falling back to mock console logs):', smtpErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Verification code dispatched successfully!',
      company: {
        name: company.company_name,
        type: company.company_type,
        requires_employee_id: company.requires_employee_id,
        employee_id_pattern: company.employee_id_pattern
      }
    });

  } catch (error) {
    console.error('❌ Send OTP code failure:', error);
    res.status(500).json({ error: 'Server error failed to send code.' });
  }
});

// POST /api/auth/verify-code - Verifies OTP and registers account
router.post('/verify-code', validate(verifyCodeSchema), async (req, res) => {
  const { email, code, fullName, password, companyName } = req.body;
  let employeeId = req.body.employeeId ? req.body.employeeId.trim() : '';
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    const domainMatch = email.match(/@(.+)$/);
    const domain = domainMatch ? domainMatch[1].toLowerCase().trim() : '';

    // 1. Fetch pre-approved company rules
    const [companies] = await pool.query(
      'SELECT * FROM approved_companies WHERE company_domain = ? AND is_active = TRUE',
      [domain]
    );

    if (!companies || companies.length === 0) {
      return res.status(400).json({ error: 'Company domain is not pre-approved' });
    }
    const company = companies[0];

    // 2. Employee ID regex validation if required
    if (company.requires_employee_id) {
      if (!employeeId) {
        await pool.query(
          'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, ?, ?, "email_code", "rejected", "Missing Employee ID", ?)',
          [email, null, domain, ipAddress]
        );
        return res.status(400).json({ error: 'Employee ID is required for this company' });
      }

      const regex = new RegExp(company.employee_id_pattern);
      if (!regex.test(employeeId)) {
        await pool.query(
          'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, ?, ?, "email_code", "rejected", "Invalid Employee ID format", ?)',
          [email, employeeId, domain, ipAddress]
        );
        return res.status(400).json({ error: 'Invalid Employee ID format' });
      }
    }

    // 3. Verify OTP code matches
    const [codeRows] = await pool.query(
      'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (!codeRows || codeRows.length === 0) {
      // Log failure trace
      await pool.query(
        'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, ?, ?, "email_code", "rejected", "Invalid or expired code", ?)',
        [email, employeeId || null, domain, ipAddress]
      );
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Clear verification codes for security
    await pool.query('DELETE FROM verification_codes WHERE email = ?', [email]);

    // 4. Log successful trace in employee audit
    await pool.query(
      'INSERT INTO employee_verification_log (email, employee_id, company_domain, verification_method, verification_status, ip_address) VALUES (?, ?, ?, "email_code", "approved", ?)',
      [email, employeeId || null, domain, ipAddress]
    );

    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 5. Insert user under validated user type with plain-text password
    await pool.query(
      `INSERT INTO users (email, full_name, password_hash, user_type, company_name, employee_id, is_verified, verification_method) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE, "email_code")`,
      [email, fullName, password, company.company_type, company.company_name, employeeId || null]
    );

    const [newUserRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const newUser = newUserRows[0];

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: email },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    console.log(`✅ Email OTP verification successful. User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Verified and registered successfully!',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        userType: newUser.user_type,
        companyName: newUser.company_name,
        employeeId: newUser.employee_id,
        isVerified: true
      },
      token
    });

  } catch (error) {
    console.error('❌ Verify OTP code failure:', error);
    res.status(500).json({ error: 'Server error during code verification.' });
  }
});

// ==========================================
// 🛡️ SYSTEM ADMIN MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/auth/admin/companies - Retrieve pre-approved companies list
router.get('/admin/companies', authenticate, async (req, res) => {
  if (req.user.email !== 'afrahfathimahms9333@gmail.com') {
    return res.status(403).json({ error: 'Unauthorized administrator access' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM approved_companies ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Failed to get approved companies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/admin/companies - Add new pre-approved company domain rules
router.post('/admin/companies', authenticate, async (req, res) => {
  if (req.user.email !== 'afrahfathimahms9333@gmail.com') {
    return res.status(403).json({ error: 'Unauthorized administrator access' });
  }

  const { company_name, company_domain, company_type, employee_id_pattern, requires_employee_id, max_employees } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    await pool.query(
      `INSERT INTO approved_companies (company_name, company_domain, company_type, employee_id_pattern, requires_employee_id, max_employees, added_by, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        company_name,
        company_domain.toLowerCase().trim(),
        company_type || 'startup',
        employee_id_pattern || '.*',
        requires_employee_id === undefined ? true : !!requires_employee_id,
        parseInt(max_employees) || 100,
        req.user.email
      ]
    );

    // Log action to audit trace
    await pool.query(
      'INSERT INTO employee_verification_log (email, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, "admin", "approved", ?, ?)',
      [req.user.email, `Added approved company domain: ${company_domain}`, ipAddress]
    );

    res.json({ success: true, message: 'Company domain approved successfully!' });
  } catch (error) {
    console.error('Failed to add approved company:', error);
    res.status(400).json({ error: 'Domain already approved or invalid parameter format.' });
  }
});

// DELETE /api/auth/admin/companies/:id - Remove company domain rules
router.delete('/admin/companies/:id', authenticate, async (req, res) => {
  if (req.user.email !== 'afrahfathimahms9333@gmail.com') {
    return res.status(403).json({ error: 'Unauthorized administrator access' });
  }

  const companyId = req.params.id;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    const [existing] = await pool.query('SELECT company_domain FROM approved_companies WHERE id = ?', [companyId]);
    
    if (existing && existing.length > 0) {
      await pool.query('DELETE FROM approved_companies WHERE id = ?', [companyId]);
      
      await pool.query(
        'INSERT INTO employee_verification_log (email, verification_method, verification_status, rejection_reason, ip_address) VALUES (?, "admin", "approved", ?, ?)',
        [req.user.email, `Deleted approved company domain: ${existing[0].company_domain}`, ipAddress]
      );
    }

    res.json({ success: true, message: 'Approved company domain removed successfully.' });
  } catch (error) {
    console.error('Failed to delete approved company:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/admin/verification-logs - Get all audit logs
router.get('/admin/verification-logs', authenticate, async (req, res) => {
  if (req.user.email !== 'afrahfathimahms9333@gmail.com') {
    return res.status(403).json({ error: 'Unauthorized administrator access' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM employee_verification_log ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Failed to get verification logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;