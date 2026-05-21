import mysql from 'mysql2/promise';

const BACKEND_URL = 'http://localhost:5000/api/auth';
const timestamp = Date.now();

const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root',
  database: 'rootcauseai_db'
};

async function runTests() {
  console.log('🚀 STARTING END-TO-END EMPLOYEE VERIFICATION & OTP SYSTEM TESTS\n');
  let passedCount = 0;
  let totalTests = 0;

  // 1. Connect to MySQL Database
  let pool;
  try {
    pool = mysql.createPool(dbConfig);
    const [rows] = await pool.query('SELECT 1');
    console.log('✅ Connection to MySQL database established successfully.\n');
  } catch (err) {
    console.error('❌ Could not connect to MySQL database:', err.message);
    console.error('Please make sure MySQL Docker container is running on port 3307.');
    return;
  }

  // Helper to assert fetch responses
  async function testEndpoint(name, url, method, body, expectedStatus, expectedErrorKey, expectedErrorVal) {
    totalTests++;
    console.log(`Testing Case: ${name}`);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null
      });

      const status = response.status;
      const text = await response.text();
      console.log(`RAW TEXT [${status}]:`, text);
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse response as JSON:', err.message);
      }

      console.log(`Response Status: ${status}`);
      console.log(`Response Body:`, JSON.stringify(data, null, 2));

      if (status !== expectedStatus) {
        console.log(`❌ FAILED: Got status ${status}, expected ${expectedStatus}\n`);
        return null;
      }

      if (expectedErrorKey && expectedErrorVal) {
        if (data[expectedErrorKey] === expectedErrorVal) {
          console.log('✅ PASSED\n');
          passedCount++;
          return data;
        } else {
          console.log(`❌ FAILED: Expected ${expectedErrorKey} to be "${expectedErrorVal}", got "${data[expectedErrorKey]}"\n`);
          return null;
        }
      }

      console.log('✅ PASSED\n');
      passedCount++;
      return data;
    } catch (err) {
      console.log(`❌ FAILED with unexpected exception: ${err.message}\n`);
      return null;
    }
  }

  // Test 1: Block Personal Email domains
  await testEndpoint(
    '1. Block Personal Email (gmail.com)',
    `${BACKEND_URL}/send-code`,
    'POST',
    { email: `test.user${timestamp}@gmail.com` },
    400,
    'error',
    'Personal email domains are not allowed'
  );

  // Test 2: Block Unapproved Company domains
  await testEndpoint(
    '2. Block Unapproved Company Domain',
    `${BACKEND_URL}/send-code`,
    'POST',
    { email: `employee${timestamp}@strangestartup.com` },
    400,
    'error',
    'Company domain is not pre-approved'
  );

  // Test 3: Allow Approved Domain & Send Code
  const approvedEmail = `employee${timestamp}@techstartup.com`;
  const sendRes = await testEndpoint(
    '3. Allow Approved Company Domain & Dispatch Code',
    `${BACKEND_URL}/send-code`,
    'POST',
    { email: approvedEmail },
    200
  );

  if (sendRes && sendRes.success) {
    // Connect to MySQL and retrieve the code!
    console.log('🔍 Fetching verification code from MySQL database...');
    try {
      const [rows] = await pool.query(
        'SELECT code FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        [approvedEmail]
      );

      if (rows.length === 0) {
        console.log('❌ FAILED: No verification code found in MySQL database for', approvedEmail, '\n');
      } else {
        const generatedCode = rows[0].code;
        console.log(`🔑 Verification code retrieved from DB: ${generatedCode}\n`);

        // Test 4: Block Verify Code with Invalid Employee ID Pattern (Format check TS[0-9]{6})
        await testEndpoint(
          '4. Block Verification with Invalid Employee ID Pattern',
          `${BACKEND_URL}/verify-code`,
          'POST',
          {
            email: approvedEmail,
            code: generatedCode,
            fullName: 'Valid Employee',
            password: 'password123',
            companyName: 'TechStartup Inc',
            employeeId: 'INVALID_ID'
          },
          400,
          'error',
          'Invalid Employee ID format'
        );

        // Test 5: Block Verify Code with Wrong Code
        await testEndpoint(
          '5. Block Verification with Incorrect OTP Code',
          `${BACKEND_URL}/verify-code`,
          'POST',
          {
            email: approvedEmail,
            code: '999999',
            fullName: 'Valid Employee',
            password: 'password123',
            companyName: 'TechStartup Inc',
            employeeId: 'TS123456'
          },
          400,
          'error',
          'Invalid or expired verification code'
        );

        // Test 6: Verify Code Successfully & Register User
        const verifyRes = await testEndpoint(
          '6. Complete Registration with Valid OTP and Employee ID',
          `${BACKEND_URL}/verify-code`,
          'POST',
          {
            email: approvedEmail,
            code: generatedCode,
            fullName: 'Valid Employee',
            password: 'password123',
            companyName: 'TechStartup Inc',
            employeeId: 'TS123456'
          },
          201
        );

        if (verifyRes && verifyRes.success) {
          // Test 7: Verify DB User registration is marked correct
          console.log('🔍 Checking database user table record...');
          const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [approvedEmail]);
          if (userRows.length > 0 && userRows[0].user_type === 'startup' && userRows[0].is_verified === 1) {
            console.log('✅ PASSED: Database user record has correct fields!\n');
            passedCount++;
          } else {
            console.log('❌ FAILED: Database user record fields mismatched.\n');
          }
          totalTests++;

          // Test 8: Verify Employee Audit Logs entry is present
          console.log('🔍 Verifying audit trail logging in employee_verification_log...');
          const [logRows] = await pool.query(
            'SELECT * FROM employee_verification_log WHERE email = ? ORDER BY created_at DESC',
            [approvedEmail]
          );
          if (logRows.length > 0) {
            console.log('✅ PASSED: Audit trail logs created correctly for the verification flows!\n');
            passedCount++;
          } else {
            console.log('❌ FAILED: No audit log records written.\n');
          }
          totalTests++;
        }
      }
    } catch (dbErr) {
      console.log(`❌ DB Error while querying test code: ${dbErr.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log(`🏁 TEST RESULTS: ${passedCount} / ${totalTests} PASSED`);
  console.log('═══════════════════════════════════════════════════');
  
  await pool.end();
}

runTests();
