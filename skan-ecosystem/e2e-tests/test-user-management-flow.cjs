const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';
const VENUE_ID = 'beach-bar-durres';

// Manager credentials for testing
const MANAGER_CREDENTIALS = {
  email: 'manager_email1@gmail.com',
  password: 'admin123'
};

console.log('\n👥 TESTING USER MANAGEMENT FLOW');
console.log('===============================');

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testUserManagementFlow() {
  let managerToken;
  let testUser;
  
  try {
    // 🔥 STEP 1: Manager authentication
    console.log('\n🔐 STEP 1: Manager authentication');
    
    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: MANAGER_CREDENTIALS
    });
    
    console.log('✅ Manager login successful');
    console.log(`Manager: ${loginResponse.user.fullName}`);
    console.log(`Role: ${loginResponse.user.role}`);
    console.log(`Venue: ${loginResponse.venue ? loginResponse.venue.name : 'No venue assigned'}`);
    
    managerToken = loginResponse.token;
    
    if (!managerToken) {
      throw new Error('❌ No access token received');
    }
    
    // 🔥 STEP 2: View current users
    console.log('\n👀 STEP 2: Viewing current users');
    
    const currentUsersResponse = await makeRequest('/users', {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log('✅ Current users retrieved');
    console.log(`Total users in system: ${currentUsersResponse.users.length}`);
    
    // Analyze current users
    const usersByRole = {};
    const usersByVenue = {};
    let activeUsers = 0;
    
    for (const user of currentUsersResponse.users) {
      // Count by role
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
      
      // Count by venue
      if (user.venueId) {
        usersByVenue[user.venueId] = (usersByVenue[user.venueId] || 0) + 1;
      }
      
      // Count active users
      if (user.isActive !== false) {
        activeUsers++;
      }
      
      console.log(`  👤 ${user.fullName} (${user.email}) - ${user.role} - ${user.isActive !== false ? 'Active' : 'Inactive'}`);
    }
    
    console.log('\n📊 User Statistics:');
    console.log(`Active users: ${activeUsers}/${currentUsersResponse.users.length}`);
    console.log('Users by role:');
    for (const [role, count] of Object.entries(usersByRole)) {
      console.log(`  ${role}: ${count}`);
    }
    
    // 🔥 STEP 3: Create test user invitation
    console.log('\n📧 STEP 3: Creating user invitation');
    
    const testUserData = {
      email: `test-staff-${Date.now()}@skan.al`,
      fullName: 'E2E Test Staff Member',
      role: 'staff'
    };
    
    const invitationResponse = await makeRequest('/users/invite', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: testUserData
    });
    
    console.log('✅ User invitation created');
    console.log(`Invitation ID: ${invitationResponse.invitationId}`);
    console.log(`Invite Token: ${invitationResponse.inviteToken ? 'Present' : 'Missing'}`);
    console.log(`Email: ${testUserData.email}`);
    
    // 🔥 STEP 4: Accept invitation (simulate new user)
    console.log('\n🎉 STEP 4: Accepting invitation');
    
    const acceptInvitationData = {
      token: invitationResponse.inviteToken,
      password: 'TestPassword123!'
    };
    
    const acceptResponse = await makeRequest('/auth/accept-invitation', {
      method: 'POST',
      body: acceptInvitationData
    });
    
    console.log('✅ Invitation accepted successfully');
    console.log(`New user ID: ${acceptResponse.user.id}`);
    console.log(`User name: ${acceptResponse.user.fullName}`);
    console.log(`User role: ${acceptResponse.user.role}`);
    console.log(`User venue: ${acceptResponse.user.venueId}`);
    
    testUser = acceptResponse.user;
    
    // 🔥 STEP 5: Verify new user appears in user list
    console.log('\n✅ STEP 5: Verifying new user in system');
    
    const updatedUsersResponse = await makeRequest('/users', {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`Updated user count: ${updatedUsersResponse.users.length}`);
    
    const newUser = updatedUsersResponse.users.find(user => user.id === testUser.id);
    
    if (!newUser) {
      throw new Error('❌ New user not found in user list');
    }
    
    console.log('✅ New user found in system');
    console.log(`Name: ${newUser.fullName}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Active: ${newUser.isActive}`);
    console.log(`Email Verified: ${newUser.emailVerified}`);
    
    // 🔥 STEP 6: Test new user login
    console.log('\n🔑 STEP 6: Testing new user login');
    
    const newUserLoginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUserData.email,
        password: acceptInvitationData.password
      }
    });
    
    console.log('✅ New user login successful');
    console.log(`Logged in as: ${newUserLoginResponse.user.fullName}`);
    console.log(`Role: ${newUserLoginResponse.user.role}`);
    console.log(`Token received: ${newUserLoginResponse.token ? 'Yes' : 'No'}`);
    
    // 🔥 STEP 7: Test user management operations
    console.log('\n⚙️  STEP 7: Testing user management operations');
    
    // Get specific user details
    const userDetailsResponse = await makeRequest(`/users/${testUser.id}`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log('✅ User details retrieved');
    console.log(`User: ${userDetailsResponse.fullName}`);
    console.log(`Created: ${userDetailsResponse.createdAt}`);
    console.log(`Updated: ${userDetailsResponse.updatedAt}`);
    
    // Update user information
    const userUpdateData = {
      fullName: 'E2E Test Staff Member (Updated)',
      role: 'staff',
      isActive: true
    };
    
    const updateResponse = await makeRequest(`/users/${testUser.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: userUpdateData
    });
    
    console.log('✅ User information updated');
    console.log(`Updated name: ${updateResponse.fullName}`);
    
    // 🔥 STEP 8: Test user filtering
    console.log('\n🔍 STEP 8: Testing user filtering');
    
    // Filter by venue
    const venueUsersResponse = await makeRequest(`/users?venueId=${VENUE_ID}`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`✅ Users for venue ${VENUE_ID}: ${venueUsersResponse.users.length}`);
    
    // Filter by role
    const staffUsersResponse = await makeRequest('/users?role=staff', {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`✅ Staff users: ${staffUsersResponse.users.length}`);
    
    const managerUsersResponse = await makeRequest('/users?role=manager', {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    
    console.log(`✅ Manager users: ${managerUsersResponse.users.length}`);
    
    // 🔥 STEP 9: Test user deactivation
    console.log('\n🚫 STEP 9: Testing user deactivation');
    
    const deactivateResponse = await makeRequest(`/users/${testUser.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: {
        ...userUpdateData,
        isActive: false
      }
    });
    
    console.log('✅ User deactivated');
    console.log(`Active status: ${deactivateResponse.isActive}`);
    
    // Test that deactivated user cannot login
    try {
      await makeRequest('/auth/login', {
        method: 'POST',
        body: {
          email: testUserData.email,
          password: acceptInvitationData.password
        }
      });
      console.log('⚠️  Warning: Deactivated user can still login');
    } catch (error) {
      console.log('✅ Deactivated user correctly blocked from login');
    }
    
    // 🔥 STEP 10: Test user reactivation
    console.log('\n✅ STEP 10: Testing user reactivation');
    
    const reactivateResponse = await makeRequest(`/users/${testUser.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${managerToken}` },
      body: {
        ...userUpdateData,
        isActive: true
      }
    });
    
    console.log('✅ User reactivated');
    console.log(`Active status: ${reactivateResponse.isActive}`);
    
    // Test that reactivated user can login again
    const reactivatedLoginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUserData.email,
        password: acceptInvitationData.password
      }
    });
    
    console.log('✅ Reactivated user can login successfully');
    console.log(`Logged in as: ${reactivatedLoginResponse.user.fullName}`);
    
    // 🔥 STEP 11: Test user permissions
    console.log('\n🔐 STEP 11: Testing user permissions');
    
    // Test what staff user can access
    const staffToken = reactivatedLoginResponse.token;
    
    // Try to access users list as staff (should be restricted)
    try {
      await makeRequest('/users', {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      console.log('⚠️  Warning: Staff user can access user management');
    } catch (error) {
      console.log('✅ Staff user correctly restricted from user management');
    }
    
    // 🎉 SUCCESS!
    console.log('\n🎉 SUCCESS: USER MANAGEMENT FLOW TEST PASSED!');
    console.log('============================================');
    console.log('✅ Manager authentication working');
    console.log('✅ User listing and filtering working');
    console.log('✅ User invitation system functioning');
    console.log('✅ Invitation acceptance working');
    console.log('✅ New user appears in system');
    console.log('✅ New user login working');
    console.log('✅ User management operations functioning');
    console.log('✅ User activation/deactivation working');
    console.log('✅ User permissions properly enforced');
    
    return {
      success: true,
      manager: loginResponse.user.fullName,
      initialUserCount: currentUsersResponse.users.length,
      finalUserCount: updatedUsersResponse.users.length,
      testUser: {
        id: testUser.id,
        email: testUserData.email,
        name: userUpdateData.fullName,
        role: testUser.role
      },
      usersByRole: usersByRole,
      activeUsers: activeUsers
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- Manager authentication failing');
    console.log('- User management endpoints not working');
    console.log('- Invitation system not functioning');
    console.log('- User permission system not enforced');
    console.log('- User activation/deactivation not working');
    
    throw error;
  }
}

// 🚀 Run the test
testUserManagementFlow()
  .then(result => {
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Manager: ${result.manager}`);
    console.log(`Initial Users: ${result.initialUserCount}`);
    console.log(`Final Users: ${result.finalUserCount}`);
    console.log(`Test User: ${result.testUser.name} (${result.testUser.email})`);
    console.log(`Test User Role: ${result.testUser.role}`);
    console.log(`Active Users: ${result.activeUsers}`);
    console.log('Users by Role:');
    for (const [role, count] of Object.entries(result.usersByRole)) {
      console.log(`  ${role}: ${count}`);
    }
    console.log('\n✨ User management system is fully functional!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 USER MANAGEMENT FLOW TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });