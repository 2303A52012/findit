const http = require('http');
const mongoose = require('mongoose');
const { app } = require('./src/server');
const User = require('./src/models/User');
const ItemReport = require('./src/models/ItemReport');
const Claim = require('./src/models/Claim');

const PORT = 5099;
let server;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      res => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function run() {
  console.log('--- Starting FindIt Full Stack Test Suite ---');
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/findit_test');
  console.log('Connected to test MongoDB database');

  // Clean test database collections
  await User.deleteMany({});
  await ItemReport.deleteMany({});
  await Claim.deleteMany({});

  server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  try {
    // 1. Health check
    console.log('\n[1] Testing Health Check');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Health check returns 200 and ok');

    // 2. User registration
    console.log('\n[2] Testing User Registration');
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123'
    });
    assert(regRes.status === 201, 'Registration returns 201');
    assert(regRes.data.token, 'Registration returns JWT token');
    assert(regRes.data.user.role === 'user', 'Public registration forces role "user"');
    assert(!regRes.data.user.passwordHash, 'Password hash is NOT returned');
    const user1Token = regRes.data.token;
    const user1Id = regRes.data.user.id;

    // 2b. Registration with missing fields
    console.log('\n[2b] Testing Registration Input Validation');
    const missingName = await request('POST', '/api/auth/register', {
      name: '',
      email: 'bad@example.com',
      password: 'password123'
    });
    assert(missingName.status === 400, 'Registration with empty name returns 400 Bad Request');

    const invalidEmail = await request('POST', '/api/auth/register', {
      name: 'Bad Email User',
      email: 'not-an-email',
      password: 'password123'
    });
    assert(invalidEmail.status === 400, 'Registration with invalid email returns 400 Bad Request');

    const shortPass = await request('POST', '/api/auth/register', {
      name: 'Short Pass User',
      email: 'shortpass@example.com',
      password: '123'
    });
    assert(shortPass.status === 400, 'Registration with short password returns 400 Bad Request');

    // 3. Prevent duplicate email registration
    console.log('\n[3] Testing Duplicate Registration Prevention');
    const dupRes = await request('POST', '/api/auth/register', {
      name: 'Alice Duplicate',
      email: 'alice@example.com',
      password: 'anotherpassword'
    });
    assert(dupRes.status === 409, 'Duplicate email registration returns 409 Conflict');

    // 4. Register a second user
    console.log('\n[4] Testing Second User Registration');
    const regRes2 = await request('POST', '/api/auth/register', {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password456'
    });
    assert(regRes2.status === 201, 'Second user registered successfully');
    const user2Token = regRes2.data.token;
    const user2Id = regRes2.data.user.id;

    // 5. Dedicated Moderator Registration
    console.log('\n[5] Testing Dedicated Moderator Registration');
    // Wrong code fails
    const failMod = await request('POST', '/api/auth/register-moderator', {
      name: 'Officer Davis',
      email: 'davis@findit.org',
      password: 'password123',
      adminSecretCode: 'wrongcode'
    });
    assert(failMod.status === 403, 'Invalid administrator key rejected with 403');

    // Valid code succeeds
    const regMod = await request('POST', '/api/auth/register-moderator', {
      name: 'Officer Davis',
      email: 'davis@findit.org',
      password: 'password123',
      adminSecretCode: 'admin123'
    });
    assert(regMod.status === 201, 'Valid administrator key returns 201');
    assert(regMod.data.user.role === 'moderator', 'Assigned role is "moderator"');
    const modToken = regMod.data.token;

    // 6. User login & invalid login
    console.log('\n[6] Testing User Login & Invalid Logins');
    const loginOk = await request('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    });
    assert(loginOk.status === 200, 'Valid login returns 200');
    assert(loginOk.data.user.email === 'alice@example.com', 'Login returns correct user email');

    const loginFail = await request('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'wrongpassword'
    });
    assert(loginFail.status === 401, 'Invalid password returns 401 Unauthorized');

    const loginNoUser = await request('POST', '/api/auth/login', {
      email: 'unknown@example.com',
      password: 'password123'
    });
    assert(loginNoUser.status === 401, 'Nonexistent email returns 401 Unauthorized');

    // 6b. JWT Middleware verification
    console.log('\n[6b] Testing JWT Authentication Middleware');
    const noToken = await request('GET', '/api/auth/me');
    assert(noToken.status === 401, 'Access protected API without token returns 401 Unauthorized');

    const badToken = await request('GET', '/api/auth/me', null, 'malformed.invalid.token');
    assert(badToken.status === 401, 'Access protected API with invalid token returns 401 Unauthorized');

    const validToken = await request('GET', '/api/auth/me', null, user1Token);
    assert(validToken.status === 200, 'Access protected API with valid token returns 200 OK');
    assert(validToken.data.user.email === 'alice@example.com', 'req.user details attached correctly');

    // 7. Create Lost and Found reports
    console.log('\n[7] Testing Item Creation (Lost and Found)');
    const lostItem = await request(
      'POST',
      '/api/items',
      {
        reportType: 'Lost',
        title: 'Blue Leather Backpack',
        category: 'Bags',
        description: 'Navy blue leather backpack containing college textbooks and notebook.',
        eventDate: '2026-10-28',
        locationText: 'University Library 2nd Floor',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
      },
      user1Token
    );
    assert(lostItem.status === 201, 'Lost item created with 201');
    assert(lostItem.data.status === 'Under Review', 'Default item status is "Under Review"');
    assert(lostItem.data.ownerId._id === user1Id, 'ownerId is derived from authenticated user');
    const lostItemId = lostItem.data._id;

    const foundItem = await request(
      'POST',
      '/api/items',
      {
        reportType: 'Found',
        title: 'Apple AirPods Pro Case',
        category: 'Electronics',
        description: 'White AirPods Pro charging case found near the cafeteria seating area.',
        eventDate: '2026-10-29',
        locationText: 'Campus Cafeteria',
        imageUrl: ''
      },
      user2Token
    );
    assert(foundItem.status === 201, 'Found item created with 201');
    const foundItemId = foundItem.data._id;

    // 8. Validation errors on item creation
    console.log('\n[8] Testing Item Creation Validation');
    const invalidItem = await request(
      'POST',
      '/api/items',
      {
        reportType: 'UnknownType',
        title: '',
        category: '',
        description: 'Too short',
        eventDate: 'invalid-date',
        locationText: ''
      },
      user1Token
    );
    assert(invalidItem.status === 400, 'Invalid item creation inputs rejected with 400');

    // 9. Browse items and filters
    console.log('\n[9] Testing Browse and Search Filters');
    const allItems = await request('GET', '/api/items');
    assert(allItems.status === 200 && allItems.data.length === 2, 'Browse items returns all active items');

    const lostOnly = await request('GET', '/api/items?type=Lost');
    assert(lostOnly.data.length === 1 && lostOnly.data[0].title === 'Blue Leather Backpack', 'Filter by type=Lost works');

    const foundOnly = await request('GET', '/api/items?type=Found');
    assert(foundOnly.data.length === 1 && foundOnly.data[0].title === 'Apple AirPods Pro Case', 'Filter by type=Found works');

    const searchTitle = await request('GET', '/api/items?search=Backpack');
    assert(searchTitle.data.length === 1 && searchTitle.data[0]._id === lostItemId, 'Search by title works');

    const searchCat = await request('GET', '/api/items?category=Electronics');
    assert(searchCat.data.length === 1 && searchCat.data[0]._id === foundItemId, 'Filter by category works');

    const searchLoc = await request('GET', '/api/items?location=Cafeteria');
    assert(searchLoc.data.length === 1 && searchLoc.data[0]._id === foundItemId, 'Search by location works');

    // 10. Item details & error handling
    console.log('\n[10] Testing Item Details Endpoint');
    const itemDetails = await request('GET', `/api/items/${lostItemId}`);
    assert(itemDetails.status === 200 && itemDetails.data._id === lostItemId, 'Get item details returns correct record');

    const invalidIdRes = await request('GET', '/api/items/not-a-valid-id');
    assert(invalidIdRes.status === 400, 'Malformed ID returns 400');

    const notFoundRes = await request('GET', '/api/items/507f1f77bcf86cd799439011');
    assert(notFoundRes.status === 404, 'Nonexistent ID returns 404');

    // 11. Submit a claim
    console.log('\n[11] Testing Claim Submission');
    const claimRes = await request(
      'POST',
      `/api/items/${lostItemId}/claims`,
      {
        message: 'This is my backpack. It has a student ID sticker inside the front zipper.'
      },
      user2Token
    );
    assert(claimRes.status === 201, 'Claim submitted with 201');
    assert(claimRes.data.status === 'Pending', 'Initial claim status is Pending');
    assert(claimRes.data.claimantId._id === user2Id, 'Claimant ID matches user 2');
    const claimId = claimRes.data._id;

    const initialConversation = await request('GET', `/api/items/claims/${claimId}/messages`, null, user1Token);
    assert(initialConversation.status === 200, 'Owner can access claim conversation');
    assert(initialConversation.data.length === 1, 'Initial claim note is reported in conversation');

    const ownerReply = await request(
      'POST',
      `/api/items/claims/${claimId}/messages`,
      { message: 'Please describe the exact contents before we arrange recovery.' },
      user1Token
    );
    assert(ownerReply.status === 201, 'Owner can reply to claimant');

    const claimantConversation = await request('GET', `/api/items/claims/${claimId}/messages`, null, user2Token);
    assert(claimantConversation.status === 200, 'Claimant can access claim conversation');
    assert(claimantConversation.data.length === 2, 'Claimant receives owner reply in conversation');

    // Short message should fail
    const shortClaim = await request(
      'POST',
      `/api/items/${lostItemId}/claims`,
      { message: 'mine' },
      user2Token
    );
    assert(shortClaim.status === 400, 'Claim with <10 characters rejected with 400');

    // 12. Personal dashboard
    console.log('\n[12] Testing Personal Dashboard APIs');
    const user1Items = await request('GET', '/api/me/items', null, user1Token);
    assert(user1Items.status === 200 && user1Items.data.length === 1, 'user1 has 1 item in dashboard');
    assert(user1Items.data[0]._id === lostItemId, 'user1 item matches lostItemId');

    const user2Claims = await request('GET', '/api/me/claims', null, user2Token);
    assert(user2Claims.status === 200 && user2Claims.data.length === 1, 'user2 has 1 claim in dashboard');
    assert(user2Claims.data[0].message.includes('student ID'), 'user2 claim message matches');

    // 13. Ownership security checks
    console.log('\n[13] Testing Ownership Permissions & Tampering Protection');
    // user2 tries to edit user1's item
    const unauthEdit = await request(
      'PATCH',
      `/api/items/${lostItemId}`,
      { title: 'Hacked title' },
      user2Token
    );
    assert(unauthEdit.status === 403, 'User cannot edit another user report (403)');

    // user2 tries to delete user1's item
    const unauthDelete = await request('DELETE', `/api/items/${lostItemId}`, null, user2Token);
    assert(unauthDelete.status === 403, 'User cannot delete another user report (403)');

    // user1 (owner) can edit their report
    const authEdit = await request(
      'PATCH',
      `/api/items/${lostItemId}`,
      { locationText: 'University Library 3rd Floor' },
      user1Token
    );
    assert(authEdit.status === 200, 'Owner can edit their own report');
    assert(authEdit.data.locationText === 'University Library 3rd Floor', 'Updated value saved');

    // Regular user cannot alter status
    const statusTamper = await request(
      'PATCH',
      `/api/items/${lostItemId}`,
      { status: 'Resolved' },
      user1Token
    );
    assert(statusTamper.status === 403, 'Non-moderator cannot change status (403)');

    // 14. Moderator role and actions
    console.log('\n[14] Testing Moderator Actions');
    // Moderator updates status to Resolved
    const modResolve = await request(
      'PATCH',
      `/api/items/${lostItemId}`,
      { status: 'Resolved' },
      modToken
    );
    assert(modResolve.status === 200, 'Moderator can update status to Resolved');
    assert(modResolve.data.status === 'Resolved', 'Item status is now Resolved');
    const resolvedClaim = await request('GET', '/api/me/claims', null, user2Token);
    assert(resolvedClaim.data[0].status === 'Approved', 'Resolved item automatically approves its pending claim');

    // Chat is disabled on resolved claim
    const postToResolvedChat = await request(
      'POST',
      `/api/items/claims/${claimId}/messages`,
      { message: 'Trying to chat after resolution' },
      user1Token
    );
    assert(postToResolvedChat.status === 403, 'Chat access is disabled when claim/item is resolved (403)');

    // 14b. Testing Sent/Received Handshake Workflow
    console.log('\n[14b] Testing Handshake Workflow ("Sent" and "Received")');
    // Create a new lost item and claim for handshake testing
    const handshakeItemRes = await request(
      'POST',
      '/api/items',
      {
        reportType: 'Lost',
        title: 'Silver Laptop Charger',
        category: 'Electronics',
        description: '65W USB-C charger left in lecture hall 3.',
        eventDate: '2026-10-30',
        locationText: 'Lecture Hall 3',
        imageUrl: ''
      },
      user1Token
    );
    const handshakeItemId = handshakeItemRes.data._id;

    const handshakeClaimRes = await request(
      'POST',
      `/api/items/${handshakeItemId}/claims`,
      { message: 'I found your charger plugged in the back row!' },
      user2Token
    );
    const hsClaimId = handshakeClaimRes.data._id;

    // Finder (User 2) marks Sent
    const markSentRes = await request(
      'PATCH',
      `/api/items/claims/${hsClaimId}/handshake`,
      { action: 'sent' },
      user2Token
    );
    assert(markSentRes.status === 200, 'Finder can mark item as Sent');
    assert(markSentRes.data.claim.senderSent === true, 'claim.senderSent is now true');
    assert(markSentRes.data.claim.chatDisabled === false, 'Chat is still active before Received is confirmed');

    // Loser (User 1) marks Received
    const markReceivedRes = await request(
      'PATCH',
      `/api/items/claims/${hsClaimId}/handshake`,
      { action: 'received' },
      user1Token
    );
    assert(markReceivedRes.status === 200, 'Owner can mark item as Received');
    assert(markReceivedRes.data.claim.receiverReceived === true, 'claim.receiverReceived is now true');
    assert(markReceivedRes.data.claim.status === 'Approved', 'Claim is automatically Approved when both confirm');
    assert(markReceivedRes.data.claim.chatDisabled === true, 'Chat access is disabled when both confirm');
    assert(markReceivedRes.data.itemResolved === true, 'Item report is marked Resolved');

    // Messages now fail with 403
    const chatAfterHandshake = await request(
      'POST',
      `/api/items/claims/${hsClaimId}/messages`,
      { message: 'Checking if chat is locked' },
      user1Token
    );
    assert(chatAfterHandshake.status === 403, 'Chat message blocked after both approve handshake (403)');

    // Moderator updates status to Removed
    const modRemove = await request(
      'PATCH',
      `/api/items/${lostItemId}`,
      { status: 'Removed' },
      modToken
    );
    assert(modRemove.status === 200, 'Moderator can update status to Removed');

    // Public list excludes Removed items
    const publicList = await request('GET', '/api/items');
    assert(
      !publicList.data.some(i => i._id === lostItemId),
      'Public listing excludes Removed items'
    );

    // Moderator list with includeRemoved=true includes Removed items
    const modItems = await request('GET', '/api/items?includeRemoved=true');
    assert(
      modItems.data.some(i => i._id === lostItemId),
      'Moderator list includes Removed items when includeRemoved=true'
    );

    // Owner deletes their own item
    console.log('\n[15] Testing Owner Deletion');
    const delRes = await request('DELETE', `/api/items/${foundItemId}`, null, user2Token);
    assert(delRes.status === 204, 'Owner can delete their own item (204 No Content)');

    const verifyDeleted = await request('GET', `/api/items/${foundItemId}`);
    assert(verifyDeleted.status === 404, 'Deleted item is no longer accessible (404)');

    console.log('\n🎉 ALL TEST SUITES PASSED CLEANLY AND FULLY!');
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  });
