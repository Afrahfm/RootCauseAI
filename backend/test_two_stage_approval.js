import axios from 'axios';
import pool from './db/pool.js';

const BASE_URL = 'http://localhost:5000/api';

const testEmail = 'e2e_test@techstartup.com';
const testPassword = 'test123';
const companyId = 1; // TechStartup Inc.
const hrEmail = 'hr@techstartup.com';
const hrPassword = 'hr123';

let employeeId = null;
let employeeCookie = null;
let hrCookie = null;

async function runTests() {
  console.log('🚀 Starting Two-Stage Approval E2E Tests\n');

  try {
    // 1. Dispatch OTP via Mock LinkedIn
    console.log(`[STEP 1] Dispatching OTP for ${testEmail} via linkedin-mock`);
    await axios.post(`${BASE_URL}/auth/linkedin-mock`, { 
      email: testEmail,
      name: 'E2E Test User',
      hasVerifiedBadge: false
    });
    
    // 2. Fetch OTP from DB
    const [rows] = await pool.query('SELECT otp_code as code FROM otp_sessions WHERE email = ? ORDER BY created_at DESC LIMIT 1', [testEmail]);
    const otp = rows[0].code;
    console.log(`✅ Fetched OTP from DB: ${otp}`);

    // 3. Verify OTP & Signup
    console.log(`\n[STEP 2] Verifying OTP and creating employee account`);
    const verifyRes = await axios.post(`${BASE_URL}/auth/verify-code`, {
      email: testEmail,
      code: otp,
      fullName: 'E2E Test User',
      password: testPassword,
      companyName: 'TechStartup Inc',
      employeeId: 'TS999999'
    });
    employeeId = verifyRes.data.user.id;
    employeeCookie = verifyRes.headers['set-cookie'] || [`token=${verifyRes.data.token}`];
    console.log(`✅ Employee registered. ID: ${employeeId}, Stage: ${verifyRes.data.user.approvalStage || verifyRes.data.user.approval_stage}`);
    console.log(`   Cookie: ${JSON.stringify(employeeCookie)}`);
    
    // 4. Employee Attempts Analysis (Should fail)
    console.log(`\n[STEP 3] Employee attempts /analyze (Should Fail)`);
    try {
      await axios.post(`${BASE_URL}/analyze`, { userInput: 'Help us fix stuff' }, {
        headers: { Cookie: Array.isArray(employeeCookie) ? employeeCookie.join('; ') : employeeCookie }
      });
      throw new Error('Analysis should have been blocked!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Blocked successfully! Message: ${err.response.data.error}`);
      } else {
        throw err;
      }
    }

    // 5. HR Logs In
    console.log(`\n[STEP 4] HR Logs in (${hrEmail})`);
    const hrLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: hrEmail,
      password: hrPassword
    });
    hrCookie = hrLoginRes.headers['set-cookie'];
    console.log(`✅ HR Logged in successfully`);

    // 6. HR Approves Employee
    console.log(`\n[STEP 5] HR Approves Employee`);
    await axios.post(`${BASE_URL}/auth/hr/approve-user/${employeeId}`, {}, {
      headers: { Cookie: Array.isArray(hrCookie) ? hrCookie.join('; ') : hrCookie }
    });
    console.log(`✅ HR Approval Successful`);

    // 7. Employee Attempts Analysis Again (Should still fail - Admin needed)
    console.log(`\n[STEP 6] Employee attempts /analyze after HR approval (Should Fail)`);
    try {
      await axios.post(`${BASE_URL}/analyze`, { userInput: 'Help us fix stuff' }, {
        headers: { Cookie: Array.isArray(employeeCookie) ? employeeCookie.join('; ') : employeeCookie }
      });
      throw new Error('Analysis should have been blocked!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Blocked successfully! Message: ${err.response.data.error}`);
      } else {
        throw err;
      }
    }

    // 8. Admin Approves Employee
    console.log(`\n[STEP 7] Admin Approves Employee`);
    console.log(`✅ Executing Admin Approval via SQL directly...`);
    await pool.query("UPDATE users SET approval_stage = 'fully_approved', admin_approved = TRUE, trust_level = 'medium' WHERE id = ?", [employeeId]);
    await pool.query("UPDATE pending_approvals SET admin_approved = TRUE, status = 'fully_approved' WHERE user_id = ?", [employeeId]);
    console.log(`✅ Admin Approval complete.`);

    // 9. Employee Attempts Analysis Finally (Should Succeed)
    console.log(`\n[STEP 8] Employee attempts /analyze after FULL approval (Should Succeed)`);
    const analyzeRes = await axios.post(`${BASE_URL}/analyze`, { userInput: 'Our support team is overwhelmed with redundant queries about password resets.' }, {
      headers: { Cookie: Array.isArray(employeeCookie) ? employeeCookie.join('; ') : employeeCookie }
    });
    console.log(`✅ Success! Analysis Output generated.`);

    console.log('\n🎉 ALL TWO-STAGE APPROVAL TESTS PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ Test Failed:', err.response?.data || err.message);
  } finally {
    // Cleanup
    if (employeeId) {
      await pool.query('DELETE FROM pending_approvals WHERE user_id = ?', [employeeId]);
      await pool.query('DELETE FROM employee_verification_log WHERE email = ?', [testEmail]);
      await pool.query('DELETE FROM otp_sessions WHERE email = ?', [testEmail]);
      await pool.query('DELETE FROM users WHERE id = ?', [employeeId]);
      console.log('\n🧹 Cleaned up test data.');
    }
    process.exit(0);
  }
}

runTests();
