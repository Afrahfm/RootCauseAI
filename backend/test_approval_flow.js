import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'rootcauseai_db'
};

const serverUrl = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting HR Approval & Trust Tracking E2E Integration Tests...');
  const pool = mysql.createPool(dbConfig);
  let passed = true;

  try {
    const testEmail = 'approval_test@demostartup2.com';
    const adminEmail = 'afrahfathimahms9333@gmail.com';

    // 1. Clean up
    console.log('\n🧹 [Clean Up] Clearing existing test data...');
    await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
    await pool.query('DELETE FROM pending_approvals WHERE email = ?', [testEmail]);
    await pool.query('DELETE FROM otp_sessions WHERE email = ?', [testEmail]);
    await pool.query('DELETE FROM employee_verification_log WHERE email = ?', [testEmail]);

    // 2. Initiate Mock LinkedIn Auth (Unverified Startup Employee)
    console.log('\n🔑 [STEP 1] Generating OTP session for unverified startup employee...');
    const res1 = await axios.post(`${serverUrl}/api/auth/linkedin-mock`, {
      email: testEmail,
      name: 'Approval Test User',
      company: 'Demo Startup 2',
      hasBadge: false,
      badgeLevel: 'No verification'
    });

    if (!res1.data.success || !res1.data.requiresOtp) {
      console.error('   ❌ FAILED: Mock LinkedIn auth did not trigger OTP flow.', res1.data);
      passed = false;
      return;
    }
    console.log('   ✅ PASSED: Mock LinkedIn auth successfully returned requiresOtp = true');

    // 3. Retrieve generated OTP code from Database
    const [sessions] = await pool.query('SELECT * FROM otp_sessions WHERE email = ? AND is_used = FALSE', [testEmail]);
    if (sessions.length === 0 || !sessions[0].otp_code) {
      console.error('   ❌ FAILED: No active OTP session found in database.');
      passed = false;
      return;
    }
    const otpCode = sessions[0].otp_code;
    console.log(`   ✅ PASSED: Found active OTP session code: ${otpCode}`);

    // 4. Verify OTP code and register the user (creates LOW TRUST user)
    console.log('\n🔑 [STEP 2] Verifying OTP code to register LOW TRUST user...');
    const res2 = await axios.post(`${serverUrl}/api/auth/verify-code`, {
      email: testEmail,
      code: otpCode,
      fullName: 'Approval Test User',
      password: 'TestPassword123!'
    });

    if (!res2.data.success || !res2.data.token) {
      console.error('   ❌ FAILED: Verification failed.', res2.data);
      passed = false;
      return;
    }

    const userToken = res2.data.token;
    const userId = res2.data.user.id;
    console.log(`   ✅ PASSED: User verified successfully. User ID: ${userId}`);

    // 5. Query Database to assert initial trust level and approval status
    console.log('\n📊 [STEP 3] Asserting DB user initial trust state is LOW...');
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (user.trust_level === 'low' && !user.admin_approved) {
      console.log('   ✅ PASSED: trust_level is "low" and admin_approved is FALSE');
    } else {
      console.error('   ❌ FAILED: Initial user trust state is incorrect in DB.', user);
      passed = false;
    }

    // Assert entry in pending_approvals table
    const [pendings] = await pool.query('SELECT * FROM pending_approvals WHERE user_id = ?', [userId]);
    if (pendings.length > 0 && pendings[0].status === 'pending') {
      console.log('   ✅ PASSED: Found matching entry in pending_approvals table with "pending" status');
    } else {
      console.error('   ❌ FAILED: No entry found in pending_approvals table.', pendings);
      passed = false;
    }

    // 6. Attempt to call POST /api/analyze and assert 403 Forbidden
    console.log('\n🚫 [STEP 4] Attempting to call secure POST /api/analyze (expecting 403 Forbidden)...');
    try {
      await axios.post(`${serverUrl}/api/analyze`, {
        userInput: 'This is a high-fidelity problem description that is long enough.'
      }, {
        headers: { Cookie: `token=${userToken}` }
      });
      console.error('   ❌ FAILED: Analysis request succeeded but should have been blocked!');
      passed = false;
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`   ✅ PASSED: Access blocked with 403 Forbidden: "${err.response.data.error}"`);
        console.log(`   Message: "${err.response.data.message}"`);
      } else {
        console.error('   ❌ FAILED: Unexpected error response on analyze:', err.message);
        passed = false;
      }
    }

    // 7. Programmatically generate Admin JWT token and approve user
    console.log('\n👑 [STEP 5] Generating Admin token and approving low trust user...');
    const adminToken = jwt.sign(
      { id: 9999, email: adminEmail },
      process.env.JWT_SECRET || 'super_secret_jwt_key_change_me',
      { expiresIn: '1h' }
    );

    const approveRes = await axios.post(
      `${serverUrl}/api/auth/admin/approve-user/${userId}`,
      {},
      {
        headers: { Cookie: `token=${adminToken}` }
      }
    );

    if (approveRes.data.success) {
      console.log('   ✅ PASSED: Admin approve-user endpoint returned success');
    } else {
      console.error('   ❌ FAILED: Admin failed to approve user.', approveRes.data);
      passed = false;
    }

    // 8. Assert DB user trust level is now MEDIUM and admin_approved is TRUE
    console.log('\n📊 [STEP 6] Asserting DB user updated trust state is MEDIUM...');
    const [updatedUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUsers[0];

    if (updatedUser.trust_level === 'medium' && updatedUser.admin_approved) {
      console.log('   ✅ PASSED: trust_level is "medium" and admin_approved is TRUE');
    } else {
      console.error('   ❌ FAILED: Updated user trust state is incorrect in DB.', updatedUser);
      passed = false;
    }

    // Assert entry in pending_approvals table is approved
    const [updatedPendings] = await pool.query('SELECT * FROM pending_approvals WHERE user_id = ?', [userId]);
    if (updatedPendings.length > 0 && updatedPendings[0].status === 'approved') {
      console.log('   ✅ PASSED: Entry in pending_approvals updated to "approved"');
    } else {
      console.error('   ❌ FAILED: pending_approvals status did not update to approved.', updatedPendings);
      passed = false;
    }

    // 9. Re-attempt to call POST /api/analyze and assert it succeeds
    console.log('\n🚀 [STEP 7] Re-attempting to call secure POST /api/analyze (expecting success)...');
    try {
      const analyzeRes = await axios.post(`${serverUrl}/api/analyze`, {
        userInput: 'The user wants to analyze this specific product design issue.'
      }, {
        headers: { Cookie: `token=${userToken}` }
      });

      if (analyzeRes.data && analyzeRes.data.hidden_problem) {
        console.log('   ✅ PASSED: Analysis successfully processed and returned AI results!');
      } else {
        console.error('   ❌ FAILED: Analysis endpoint succeeded but response format is unexpected.', analyzeRes.data);
        passed = false;
      }
    } catch (err) {
      console.error('   ❌ FAILED: Analyze request failed unexpectedly:', err.response?.data || err.message);
      passed = false;
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n============================================================');
    if (passed) {
      console.log('🎉 ALL HR APPROVAL & TRUST TRACKING E2E TESTS PASSED! 🎉');
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
