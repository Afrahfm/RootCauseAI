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
import pool from '../db/pool.js';
import { validate, signupSchema, loginSchema } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendResetEmail } from '../services/emailService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// SIGNUP ROUTE - Stores PLAIN TEXT password
router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
  try {
    const { email, fullName, password } = req.body;

    // ✅ DEBUG: Log plain text password to terminal
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 NEW USER SIGNUP');
    console.log('   Email:', email);
    console.log('   Full Name:', fullName);
    console.log('   🔓 PASSWORD (Plain Text):', password);
    console.log('═══════════════════════════════════════════════════');

    // Check if user exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // ✅ STORE PASSWORD AS PLAIN TEXT (NOT HASHED)
    await pool.query(
      'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
      [email, fullName, password]  // ← Plain text password!
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

    console.log('✅ User created with PLAIN TEXT password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: newUser.id, email, fullName },
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
      user: { id: user.id, email: user.email, fullName: user.full_name },
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
      user: { id: user.id, email: user.email, fullName: user.full_name },
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
    const [rows] = await pool.query('SELECT id, email, full_name FROM users WHERE id = ?', [req.user.id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;