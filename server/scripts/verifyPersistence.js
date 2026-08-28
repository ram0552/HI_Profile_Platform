require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { connectDB } = require('../config/db');

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING COMPREHENSIVE BENTO PERSISTENCE TEST SUITE');
    console.log('======================================================\n');

    await connectDB();

    // 1. Find a test profile and user
    const testProfile = await Profile.findOne({});
    if (!testProfile) {
        console.error('❌ No test profile found in DB');
        process.exit(1);
    }
    const testUser = await User.findById(testProfile.userId);
    if (!testUser) {
        console.error('❌ No test user found for profile:', testProfile.username);
        process.exit(1);
    }

    const username = testProfile.username;
    console.log(`👤 Using test profile: @${username} (User ID: ${testUser._id})`);

    // Create a valid JWT token for testUser
    const validToken = jwt.sign(
        { userId: testUser._id, username: testUser.username, role: testUser.role || 'user' },
        process.env.JWT_SECRET || 'access_secret_key',
        { expiresIn: '1h' }
    );

    // Create another user token for 403 test
    const fakeOtherUserId = new mongoose.Types.ObjectId();
    const otherUserToken = jwt.sign(
        { userId: fakeOtherUserId, username: 'otheruser_random', role: 'user' },
        process.env.JWT_SECRET || 'access_secret_key',
        { expiresIn: '1h' }
    );

    let passedTests = 0;
    let failedTests = 0;

    const assert = (condition, name, details = '') => {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passedTests++;
        } else {
            console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
            failedTests++;
        }
    };

    // TEST 1: Public GET customization
    console.log('\n--- Test 1: Public GET Customization ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`);
        const json = await res.json();
        assert(res.status === 200, 'GET /api/profiles/:username/customization status 200');
        assert(json.designStyle !== undefined, 'Returns designStyle field');
        assert(json.colorTheme !== undefined, 'Returns colorTheme field');
        assert(json.typography !== undefined, 'Returns typography field');
        assert(json.borderRadius !== undefined, 'Returns borderRadius field');
        assert(json.shadow !== undefined, 'Returns shadow field');
        assert(json.spacing !== undefined, 'Returns spacing field');
        assert(json.updatedAt !== undefined, 'Returns updatedAt field');
    } catch (e) {
        assert(false, 'Public GET request threw an error', e.message);
    }

    // TEST 2: GET nonexistent user -> 404
    console.log('\n--- Test 2: GET Nonexistent Profile (404) ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/nonexistent_profile_xyz_999/customization`);
        assert(res.status === 404, 'GET nonexistent profile returns 404');
    } catch (e) {
        assert(false, 'GET nonexistent threw an error', e.message);
    }

    // TEST 3: PUT without auth -> 401
    console.log('\n--- Test 3: PUT without Auth Token (401) ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colorTheme: 'midnight' })
        });
        assert(res.status === 401, 'PUT without auth returns 401 Unauthorized');
    } catch (e) {
        assert(false, 'PUT without auth threw error', e.message);
    }

    // TEST 4: PUT with different real user token -> 403 Forbidden
    console.log('\n--- Test 4: PUT with Non-Owner Token (403 Forbidden) ---');
    try {
        const otherRealUser = await User.findOne({ _id: { $ne: testUser._id } });
        let secondToken;
        if (otherRealUser) {
            secondToken = jwt.sign(
                { userId: otherRealUser._id, username: otherRealUser.username, role: otherRealUser.role || 'user' },
                process.env.JWT_SECRET || 'access_secret_key',
                { expiresIn: '1h' }
            );
        } else {
            secondToken = otherUserToken;
        }

        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${secondToken}`
            },
            body: JSON.stringify({ colorTheme: 'midnight' })
        });
        if (otherRealUser) {
            assert(res.status === 403, 'PUT with real non-owner returns 403 Forbidden');
        } else {
            assert(res.status === 403 || res.status === 401, `PUT with non-owner returns ${res.status}`);
        }
    } catch (e) {
        assert(false, 'PUT non-owner threw error', e.message);
    }

    // TEST 5: Reject unknown keys -> 400
    console.log('\n--- Test 5: Reject Unknown Field Keys (400) ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${validToken}`
            },
            body: JSON.stringify({ invalidFieldKey: 'value' })
        });
        assert(res.status === 400, 'Rejects unknown key with 400');
        const json = await res.json();
        assert(json.message && json.message.includes('Unknown field'), 'Error message identifies unknown field');
    } catch (e) {
        assert(false, 'Reject unknown key threw error', e.message);
    }

    // TEST 6: Reject invalid enum values -> 400
    console.log('\n--- Test 6: Reject Invalid Enum Values (400) ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${validToken}`
            },
            body: JSON.stringify({ colorTheme: 'neon-rainbow-explosion' })
        });
        assert(res.status === 400, 'Rejects invalid enum value with 400');
        const json = await res.json();
        assert(json.message && json.message.includes('Invalid value'), 'Error message names invalid value and allowed values');
    } catch (e) {
        assert(false, 'Reject invalid enum threw error', e.message);
    }

    // TEST 7: Reject client-controlled updatedAt/version -> 400
    console.log('\n--- Test 7: Reject Client-Supplied Timestamp/Version (400) ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${validToken}`
            },
            body: JSON.stringify({ updatedAt: '1999-01-01T00:00:00.000Z' })
        });
        assert(res.status === 400, 'Rejects client-supplied updatedAt with 400');
    } catch (e) {
        assert(false, 'Reject client updatedAt threw error', e.message);
    }

    // TEST 8: Full customization update & persistence
    console.log('\n--- Test 8: Full Customization Update & MongoDB Verification ---');
    const updatePayload = {
        designStyle: 'glass',
        colorTheme: 'midnight',
        typography: 'spaceGrotesk',
        borderRadius: 'large',
        shadow: 'elevated',
        spacing: 'relaxed'
    };

    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${validToken}`
            },
            body: JSON.stringify(updatePayload)
        });
        assert(res.status === 200, 'PUT customization returns 200 OK');
        const json = await res.json();
        assert(json.success === true, 'Response indicates success: true');
        assert(json.data.designStyle === 'glass', 'Response has designStyle: glass');
        assert(json.data.colorTheme === 'midnight', 'Response has colorTheme: midnight');
        assert(json.data.typography === 'spaceGrotesk', 'Response has typography: spaceGrotesk');
        assert(json.data.borderRadius === 'large', 'Response has borderRadius: large');
        assert(json.data.shadow === 'elevated', 'Response has shadow: elevated');
        assert(json.data.spacing === 'relaxed', 'Response has spacing: relaxed');

        // Direct DB check
        const dbProfile = await Profile.findOne({ username });
        assert(dbProfile !== null, 'MongoDB profile exists');
        assert(dbProfile.customization.designStyle === 'glass', 'MongoDB has designStyle: glass');
        assert(dbProfile.customization.colorTheme === 'midnight', 'MongoDB has colorTheme: midnight');
        assert(dbProfile.customization.typography === 'spaceGrotesk', 'MongoDB has typography: spaceGrotesk');
        assert(dbProfile.customization.borderRadius === 'large', 'MongoDB has borderRadius: large');
        assert(dbProfile.customization.shadow === 'elevated', 'MongoDB has shadow: elevated');
        assert(dbProfile.customization.spacing === 'relaxed', 'MongoDB has spacing: relaxed');
        assert(dbProfile.customization.version === 1, 'MongoDB has version: 1');
        assert(dbProfile.customization.updatedAt !== undefined, 'MongoDB has server-set updatedAt timestamp');
    } catch (e) {
        assert(false, 'Full update test threw error', e.message);
    }

    // TEST 9: Partial update preserving other 5 fields
    console.log('\n--- Test 9: Partial Update (Only colorTheme changed) ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${validToken}`
            },
            body: JSON.stringify({ colorTheme: 'cyberpunk' })
        });
        assert(res.status === 200, 'Partial update returns 200');

        const dbProfile = await Profile.findOne({ username });
        assert(dbProfile.customization.colorTheme === 'cyberpunk', 'colorTheme updated to cyberpunk');
        assert(dbProfile.customization.designStyle === 'glass', 'designStyle preserved as glass');
        assert(dbProfile.customization.typography === 'spaceGrotesk', 'typography preserved as spaceGrotesk');
        assert(dbProfile.customization.borderRadius === 'large', 'borderRadius preserved as large');
        assert(dbProfile.customization.shadow === 'elevated', 'shadow preserved as elevated');
        assert(dbProfile.customization.spacing === 'relaxed', 'spacing preserved as relaxed');
    } catch (e) {
        assert(false, 'Partial update test threw error', e.message);
    }

    // TEST 10: Verify public GET reflects latest changes
    console.log('\n--- Test 10: Public GET Reflects Updated Persistence ---');
    try {
        const res = await fetch(`${BASE_URL}/profiles/${username}/customization`);
        const json = await res.json();
        assert(res.status === 200, 'Public GET returns 200');
        assert(json.colorTheme === 'cyberpunk', 'Public view sees colorTheme: cyberpunk');
        assert(json.designStyle === 'glass', 'Public view sees designStyle: glass');
    } catch (e) {
        assert(false, 'Public GET verification threw error', e.message);
    }

    console.log('\n======================================================');
    console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Fatal error in tests:', err);
    process.exit(1);
});
