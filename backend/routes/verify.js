import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const router = express.Router();

// Helper: Generate random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Display fancy terminal banner
const displayCodeBanner = (email, code) => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    📧 EMAIL VERIFICATION CODE                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  To: ${email.padEnd(50)}║`);
  console.log(`║  Code: ${code.padEnd(48)}║`);
  console.log('║  Expires in: 10 minutes                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
};

// ========== 1. SEND VERIFICATION CODE (BLOCKED FOR SECURITY) ==========
router.post('/send-code', async (req, res) => {
  console.log('⚠️ Blocked direct /send-code request: Direct email signup is disabled.');
  return res.status(400).json({ 
    error: 'Direct email signup is disabled',
    message: 'To register, you must verify your workplace with LinkedIn first. Direct email registration is not allowed.'
  });
});

// ========== 2. VERIFY CODE AND COMPLETE SIGNUP ==========
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, fullName, password } = req.body;
    
    console.log(`🔐 Verifying OTP for: ${email}`);
    console.log(`📝 Entered code: ${code}`);
    
    if (!email || !code || !fullName || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if code is valid in otp_sessions
    const [validCode] = await pool.query(
      'SELECT * FROM otp_sessions WHERE email = ? AND otp_code = ? AND expires_at > NOW() AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );
    
    if (!validCode || validCode.length === 0) {
      console.log(`❌ Invalid or expired OTP code for: ${email}`);
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    const session = validCode[0];
    
    // Get company info from domain
    const domain = email.split('@')[1];
    const [company] = await pool.query(
      'SELECT * FROM approved_companies WHERE company_domain = ? AND is_active = TRUE',
      [domain]
    );
    
    if (!company || company.length === 0) {
      return res.status(400).json({ error: 'Company domain is not pre-approved' });
    }
    
    const companyName = company[0].company_name;
    const userType = company[0].company_type;
    
    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // Also resolve company_id from companies table
    const [newComp] = await pool.query(
      'SELECT id, name FROM companies WHERE domain = ?',
      [domain]
    );
    let companyId = newComp && newComp.length > 0 ? newComp[0].id : null;

    // If company exists in approved_companies but not in companies, let's insert it dynamically
    if (!companyId) {
      const [insertComp] = await pool.query(
        'INSERT INTO companies (name, domain) VALUES (?, ?)',
        [companyName, domain]
      );
      companyId = insertComp.insertId;
    }

    let userId;
    let token;
    
    if (existing.length > 0) {
      // User exists - update and login
      userId = existing[0].id;
      
      await pool.query(
        `UPDATE users SET 
          verification_source = 'email_otp', 
          is_verified = TRUE,
          linkedin_verified = FALSE,
          linkedin_id = ?,
          linkedin_verified_at = NULL,
          verification_method = 'email_code',
          user_type = COALESCE(user_type, ?),
          company_name = COALESCE(company_name, ?),
          company_id = COALESCE(company_id, ?),
          role = 'employee',
          trust_level = 'low',
          admin_approved = FALSE,
          hr_approved = FALSE,
          approval_stage = 'pending'
        WHERE id = ?`,
        [session.linkedin_id, userType, companyName, companyId, userId]
      );
      
      // Clean up previous pending/rejected approval requests
      await pool.query('DELETE FROM pending_approvals WHERE user_id = ?', [userId]);

      // Insert new pending approval request
      await pool.query(
        `INSERT INTO pending_approvals 
          (user_id, email, full_name, company_name, company_id, verification_method, status, hr_approved, admin_approved) 
         VALUES (?, ?, ?, ?, ?, 'email_otp', 'pending', FALSE, FALSE)`,
        [userId, email, fullName, companyName, companyId]
      );
      
      token = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
        { expiresIn: '7d' }
      );
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      console.log(`✅ Existing user updated via LinkedIn OTP as LOW TRUST: ${email}`);
      
    } else {
      // Create new user (using plain text passwords consistent with hackathon presentation schema)
      const [result] = await pool.query(
        `INSERT INTO users 
          (email, full_name, password_hash, user_type, company_name, company_id, role, is_verified, linkedin_verified, linkedin_id, linkedin_verified_at, verification_source, verification_method, trust_level, admin_approved, hr_approved, approval_stage) 
         VALUES (?, ?, ?, ?, ?, ?, 'employee', TRUE, FALSE, ?, NULL, 'email_otp', 'email_code', 'low', FALSE, FALSE, 'pending')`,
        [email, fullName, password, userType, companyName, companyId, session.linkedin_id]
      );
      
      userId = result.insertId;
      
      // Insert new pending approval request
      await pool.query(
        `INSERT INTO pending_approvals 
          (user_id, email, full_name, company_name, company_id, verification_method, status, hr_approved, admin_approved) 
         VALUES (?, ?, ?, ?, ?, 'email_otp', 'pending', FALSE, FALSE)`,
        [userId, email, fullName, companyName, companyId]
      );

      token = jwt.sign(
        { id: userId, email: email },
        process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
        { expiresIn: '7d' }
      );
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      console.log(`✅ New LinkedIn OTP unverified user created as LOW TRUST: ${email} (ID: ${userId})`);
    }
    
    // Mark session as used
    await pool.query('UPDATE otp_sessions SET is_used = TRUE WHERE id = ?', [session.id]);
    
    // Update verification log
    await pool.query(
      `INSERT INTO employee_verification_log (email, verification_method, verification_status, linkedin_verification_level) 
       VALUES (?, 'email_otp', 'pending', 'LOW_TRUST_PENDING_APPROVAL')`,
      [email]
    );
    
    console.log(`✅ OTP Verification processed for low trust startup employee: ${email}`);
    
    res.json({ 
      success: true, 
      message: 'Verification successful! Account created, pending HR/Admin approval...',
      user: { 
        id: userId, 
        email, 
        fullName,
        userType: userType,
        companyName: companyName,
        companyId: companyId,
        role: 'employee',
        isVerified: true,
        trustLevel: 'low',
        adminApproved: false,
        hrApproved: false,
        approvalStage: 'pending'
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// ========== 3. RESEND CODE ==========
router.post('/resend-code', async (req, res) => {
  try {
    const { email, linkedinId, fullName } = req.body;
    
    if (!email || !linkedinId) {
      return res.status(400).json({ error: 'Email and LinkedIn ID are required' });
    }
    
    // Delete old unused sessions for this email
    await pool.query('DELETE FROM otp_sessions WHERE email = ?', [email]);
    
    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins
    
    // Store new code
    await pool.query(
      'INSERT INTO otp_sessions (email, linkedin_id, full_name, otp_code, expires_at) VALUES (?, ?, ?, ?, ?)',
      [email, linkedinId, fullName || '', code, expiresAt]
    );
    
    // Display new code banner
    console.log('\x1b[36m%s\x1b[0m', '┌────────────────────────────────────────────────────────┐');
    console.log('\x1b[36m%s\x1b[0m', '│         🔐 LINKEDIN WORKPLACE OTP (RESENT)             │');
    console.log('\x1b[36m%s\x1b[0m', '├────────────────────────────────────────────────────────┤');
    console.log(`\x1b[36m│\x1b[0m  Recipient: \x1b[33m${email.padEnd(43)}\x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  LinkedIn ID: \x1b[32m${linkedinId.padEnd(41)}\x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  Verification Code: \x1b[32m\x1b[1m${code.padEnd(36)}\x1b[0m\x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  Expires in: \x1b[35m15 minutes\x1b[0m                                 \x1b[36m│\x1b[0m`);
    console.log('\x1b[36m%s\x1b[0m', '├────────────────────────────────────────────────────────┤');
    console.log('\x1b[36m%s\x1b[0m', '│   Type this code into the signup modal to proceed.     │');
    console.log('\x1b[36m%s\x1b[0m', '└────────────────────────────────────────────────────────┘');
    
    res.json({ 
      success: true, 
      message: 'New verification code sent! Check your terminal for the code (demo mode).',
      expiresIn: 900 
    });
    
  } catch (error) {
    console.error('❌ Resend code error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// ========== 4. CHECK IF DOMAIN IS APPROVED ==========
router.post('/check-domain', async (req, res) => {
  try {
    const { email } = req.body;
    const domain = email.split('@')[1];
    
    const [company] = await pool.query(
      'SELECT company_name, company_type FROM approved_companies WHERE company_domain = ?',
      [domain.toLowerCase()]
    );
    
    if (company.length > 0) {
      res.json({ 
        approved: true, 
        companyName: company[0].company_name,
        companyType: company[0].company_type
      });
    } else {
      res.json({ approved: false });
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
