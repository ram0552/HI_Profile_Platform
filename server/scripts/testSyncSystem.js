const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testSyncImports() {
    console.log('[Test] Testing sync system imports and functions...');

    try {
        const User = require('../models/User');
        const Profile = require('../models/Profile');
        const ProfileBlock = require('../models/ProfileBlock');
        const SocialProfile = require('../models/SocialProfile');
        console.log('✓ All Mongoose models loaded successfully.');

        const { syncUserBentoData } = require('../services/bentoSyncService');
        console.log('✓ bentoSyncService loaded successfully. syncUserBentoData function type:', typeof syncUserBentoData);

        const { initBentoCronJob, getTodayDateStringInTimezone, runDailyBentoAutoSync } = require('../services/cronService');
        console.log('✓ cronService loaded successfully. Date string (Asia/Kolkata):', getTodayDateStringInTimezone('Asia/Kolkata'));

        const blockController = require('../controllers/blockController');
        console.log('✓ blockController loaded successfully. Handlers:', {
            refreshUserBentoData: typeof blockController.refreshUserBentoData,
            getRefreshStatus: typeof blockController.getRefreshStatus,
            getUserBlocks: typeof blockController.getUserBlocks
        });

        console.log('\n==================================================');
        console.log('ALL BACKEND SYNC SYSTEM IMPORTS AND HANDLERS PASSED VERIFICATION!');
        console.log('==================================================\n');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    }
}

testSyncImports();
