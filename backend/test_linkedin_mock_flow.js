import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, '../../../../../real-problem-finder/backend/.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'rootcauseai_db'
};

const serverUrl = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting LinkedIn Mock Portal Endpoint E2E Integration Tests...');
  const pool = mysql.createPool(dbConfig);
  let passed = true;

  try {
    const autoApproveEmail = 'founder@demostartup1.com';
    const otpEmail = 'employee@demostartup2.com';
    const fraudulentEmail = 'hacker@gmail.com';

    // Clean up
    console.log('\n🧹 [Clean Up] Clearing existing test data...');
    await pool.query('DELETE FROM users WHERE email IN (?, ?, ?)', [autoApproveEmail, otpEmail, fraudulentEmail]);
    await pool.query('DELETE FROM otp_sessions WHERE email IN (?, ?, ?)', [autoApproveEmail, otpEmail, fraudulentEmail]);
    await pool.query('DELETE FROM linkedin_badge_checks WHERE email IN (?, ?, ?)', [autoApproveEmail, otpEmail, fraudulentEmail]);

    // -------------------------------------------------------------
    // TEST 1: Auto-Approve Flow for Badge-Holding User
    // -------------------------------------------------------------
    console.log('\n🚀 [TEST 1] Testing Auto-Approve with Verified Badge...');
    const res1 = await axios.post(`${serverUrl}/api/auth/linkedin-mock`, {
      email: autoApproveEmail,
      name: 'Startup Founder',
      company: 'Demo Startup 1',
      hasBadge: true,
      badgeLevel: 'VERIFIED_WORKPLACE'
    });

    if (res1.data.success && res1.data.autoApprove && res1.data.token) {
      console.log('   ✅ PASSED: Instantly auto-approved and returned token!');
      
      // Verify user in DB
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [autoApproveEmail]);
      if (users.length > 0 && users[0].is_verified && users[0].verification_source === 'linkedin_badge') {
        console.log('   ✅ PASSED: User successfully created in users table with is_verified = TRUE!');
      } else {
        console.error('   ❌ FAILED: User in database does not match verified state.', users);
        passed = false;
      }
    } else {
      console.error('   ❌ FAILED: Auto-approve response is incorrect.', res1.data);
      passed = false;
    }

    // -------------------------------------------------------------
    // TEST 2: OTP Flow for Non-Badge Startup Employee
    // -------------------------------------------------------------
    console.log('\n🔑 [TEST 2] Testing OTP generation for Non-Badge Startup Employee...');
    const res2 = await axios.post(`${serverUrl}/api/auth/linkedin-mock`, {
      email: otpEmail,
      name: 'John Startup',
      company: 'Demo Startup 2',
      hasBadge: false,
      badgeLevel: 'No verification'
    });

    if (res2.data.success && res2.data.requiresOtp) {
      console.log('   ✅ PASSED: Endpoint successfully returned requiresOtp = true!');
      
      // Verify OTP session in DB
      const [sessions] = await pool.query('SELECT * FROM otp_sessions WHERE email = ? AND is_used = FALSE', [otpEmail]);
      if (sessions.length > 0 && sessions[0].otp_code) {
        console.log(`   ✅ PASSED: Found generated OTP session! Code: ${sessions[0].otp_code}`);
        
        // Complete verify OTP flow
        const verifyRes = await axios.post(`${serverUrl}/api/auth/verify-code`, {
          email: otpEmail,
          code: sessions[0].otp_code,
          fullName: 'John Startup',
          password: 'JohnPassword123!'
        });

        if (verifyRes.data.success && verifyRes.data.token) {
          console.log('   ✅ PASSED: Completed enrollment and successfully logged in!');
        } else {
          console.error('   ❌ FAILED: OTP verification failed.', verifyRes.data);
          passed = false;
        }
      } else {
        console.error('   ❌ FAILED: OTP session was not generated in database.');
        passed = false;
      }
    } else {
      console.error('   ❌ FAILED: Non-badge employee response is incorrect.', res2.data);
      passed = false;
    }

    // -------------------------------------------------------------
    // TEST 3: Block Unapproved Domain Fraud Claims
    // -------------------------------------------------------------
    console.log('\n🚫 [TEST 3] Testing Blocked Domain / Gmail Fraud Gate...');
    try {
      await axios.post(`${serverUrl}/api/auth/linkedin-mock`, {
        email: fraudulentEmail,
        name: 'Hacker Gmail',
        company: 'Fake Corp',
        hasBadge: false,
        badgeLevel: 'No verification'
      });
      console.error('   ❌ FAILED: Personal Gmail was not blocked!');
      passed = false;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   ✅ PASSED: Blocked with 400 Bad Request: "${err.response.data.error}"`);
      } else {
        console.error('   ❌ FAILED: Unexpected response when blocking gmail.', err.message);
        passed = false;
      }
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n============================================================');
    if (passed) {
      console.log('🎉 ALL LINKEDIN MOCK E2E TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('============================================================');
    } else {
      console.error('❌ SOME TESTS FAILED. Review E2E trace logs.');
      console.log('============================================================');
    }

  } catch (error) {
    console.error('❌ CRITICAL ERROR RUNNING TESTS:', error.message);
    passed = false;
  } finally {
    await pool.end();
    process.exit(passed ? 0 : 1);
  }
}

runTests();
