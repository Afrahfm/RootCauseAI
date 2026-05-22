import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration from backend
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'rootcauseai_db'
};

const serverUrl = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting "LinkedIn First, then OTP" E2E Security Tests...');
  const pool = mysql.createPool(dbConfig);
  let passed = true;

  try {
    const testEmail = 'employee@demostartup2.com';
    const testLinkedinId = 'li_john_startup';
    const testFullName = 'John Startup';
    const testPassword = 'Password123!';

    // Clean up databases before starting test
    console.log('\n🧹 [Clean Up] Preparing DB (deleting existing test users & sessions)...');
    await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
    await pool.query('DELETE FROM otp_sessions WHERE email = ?', [testEmail]);

    // -------------------------------------------------------------
    // TEST 1: Block Direct Email Signup Bypass
    // -------------------------------------------------------------
    console.log('\n🛡️ [TEST 1] Asserting direct signup route /api/auth/signup is blocked...');
    try {
      await axios.post(`${serverUrl}/api/auth/signup`, {
        email: testEmail,
        fullName: testFullName,
        password: testPassword
      });
      console.error('   ❌ FAILED: Direct signup succeeded when it should be blocked!');
      passed = false;
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.error === 'Direct email registration is disabled') {
        console.log('   ✅ PASSED: Direct signup successfully blocked with 400 Bad Request.');
      } else {
        console.error('   ❌ FAILED: Direct signup returned unexpected response:', err.response?.data || err.message);
        passed = false;
      }
    }

    // -------------------------------------------------------------
    // TEST 2: Block Direct /send-code Route
    // -------------------------------------------------------------
    console.log('\n🛡️ [TEST 2] Asserting direct send-code route /api/auth/send-code is blocked...');
    try {
      await axios.post(`${serverUrl}/api/auth/send-code`, {
        email: testEmail
      });
      console.error('   ❌ FAILED: Direct send-code succeeded when it should be blocked!');
      passed = false;
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.error === 'Direct email signup is disabled') {
        console.log('   ✅ PASSED: Direct /send-code successfully blocked with 400 Bad Request.');
      } else {
        console.error('   ❌ FAILED: Direct /send-code returned unexpected response:', err.response?.data || err.message);
        passed = false;
      }
    }

    // -------------------------------------------------------------
    // TEST 3: Block LinkedIn Signup Lacking Verified Badge
    // -------------------------------------------------------------
    console.log('\n🚫 [TEST 3] Simulating LinkedIn Workplace verification callback WITHOUT badge...');
    const paramsNoBadge = {
      email: testEmail,
      fullName: testFullName,
      companyName: 'Demo Startup 2',
      verifiedWorkplace: 'false',
      verificationLevel: 'No verification',
      linkedinId: testLinkedinId
    };

    const resNoBadge = await axios.get(`${serverUrl}/api/auth/linkedin/callback`, {
      params: paramsNoBadge,
      maxRedirects: 0,
      validateStatus: (status) => status >= 300 && status < 400
    });

    const redirectUrlNoBadge = resNoBadge.headers.location;
    console.log(`   Received redirect: ${redirectUrlNoBadge}`);

    if (redirectUrlNoBadge.includes('/signup') && redirectUrlNoBadge.includes('auth_error=')) {
      console.log('   ✅ PASSED: Successfully blocked and redirected to signup with auth_error.');
      const decodedError = decodeURIComponent(new URL(redirectUrlNoBadge).searchParams.get('auth_error'));
      console.log(`   Error message shown: "${decodedError}"`);
    } else {
      console.error('   ❌ FAILED: Callback without badge did not block access or redirect properly.');
      passed = false;
    }

    // -------------------------------------------------------------
    // TEST 4: Allow LinkedIn Signup WITH Verified Badge (Generates OTP)
    // -------------------------------------------------------------
    console.log('\n🚀 [TEST 4] Simulating LinkedIn Workplace verification callback WITH verified badge...');
    const paramsWithBadge = {
      email: testEmail,
      fullName: testFullName,
      companyName: 'Demo Startup 2',
      verifiedWorkplace: 'true',
      verificationLevel: 'VERIFIED_WORKPLACE',
      linkedinId: testLinkedinId
    };

    const resWithBadge = await axios.get(`${serverUrl}/api/auth/linkedin/callback`, {
      params: paramsWithBadge,
      maxRedirects: 0,
      validateStatus: (status) => status >= 300 && status < 400
    });

    const redirectUrlWithBadge = resWithBadge.headers.location;
    console.log(`   Received redirect: ${redirectUrlWithBadge}`);

    if (redirectUrlWithBadge.includes('/signup') && redirectUrlWithBadge.includes('otp_sent=true')) {
      console.log('   ✅ PASSED: Successfully approved LinkedIn badge and redirected to Step 2.');
    } else {
      console.error('   ❌ FAILED: Callback with badge did not redirect to signup with otp_sent.');
      passed = false;
    }

    // -------------------------------------------------------------
    // TEST 5: Verify Generated OTP Session in DB & Complete Registration
    // -------------------------------------------------------------
    console.log('\n🔑 [TEST 5] Querying DB for generated OTP session code...');
    const [sessions] = await pool.query('SELECT * FROM otp_sessions WHERE email = ? AND is_used = FALSE', [testEmail]);
    
    if (sessions.length > 0) {
      const otpCode = sessions[0].otp_code;
      console.log(`   ✅ Found active session! Generated OTP code is: ${otpCode}`);

      // Now hit /verify-code to complete signup
      console.log(`   Submitting OTP code and setting password via /api/auth/verify-code...`);
      const verifyRes = await axios.post(`${serverUrl}/api/auth/verify-code`, {
        email: testEmail,
        code: otpCode,
        fullName: testFullName,
        password: testPassword
      });

      if (verifyRes.data.success) {
        console.log('   ✅ PASSED: OTP validation and signup succeeded!');
      } else {
        console.error('   ❌ FAILED: /verify-code failed:', verifyRes.data);
        passed = false;
      }

      // Assert user exists in database and properties are correct
      console.log('   Asserting user record exists in users table with correct verification columns...');
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [testEmail]);
      if (users.length > 0) {
        const user = users[0];
        if (user.linkedin_verified === 1 && user.verification_source === 'linkedin_badge' && user.is_verified === 1) {
          console.log(`   ✅ PASSED: User "${user.full_name}" is fully registered and verified via linkedin_badge!`);
        } else {
          console.error('   ❌ FAILED: User table fields are incorrect:', {
            linkedin_verified: user.linkedin_verified,
            verification_source: user.verification_source,
            is_verified: user.is_verified
          });
          passed = false;
        }
      } else {
        console.error('   ❌ FAILED: User was not found in database.');
        passed = false;
      }
    } else {
      console.error('   ❌ FAILED: No active OTP session found in DB for the user.');
      passed = false;
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n============================================================');
    if (passed) {
      console.log('🎉 ALL SECURITY INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('============================================================');
    } else {
      console.error('❌ SOME TESTS FAILED. Please review error logs above.');
      console.log('============================================================');
    }

  } catch (error) {
    console.error('❌ E2E TEST CRITICAL ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

runTests();
