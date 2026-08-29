const User = require('../models/User');
const ProfileBlock = require('../models/ProfileBlock');
const { syncUserBentoData, SUPPORTED_SOCIAL_PLATFORMS } = require('./bentoSyncService');

// Authoritative application timezone
const DEFAULT_TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

/**
 * Get date string (YYYY-MM-DD) in specified timezone
 */
const getTodayDateStringInTimezone = (timezone = DEFAULT_TIMEZONE) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(new Date()); // Outputs YYYY-MM-DD
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
};

/**
 * Calculate milliseconds remaining until the next 02:00:00 AM in the specified timezone
 */
const getMsUntilNext2AM = (timezone = DEFAULT_TIMEZONE) => {
    const now = new Date();
    
    // Get current time components in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const timeMap = {};
    parts.forEach(p => { timeMap[p.type] = parseInt(p.value, 10); });

    // Target hour is 2 AM
    let targetYear = timeMap.year;
    let targetMonth = timeMap.month - 1; // 0-indexed month
    let targetDay = timeMap.day;

    if (timeMap.hour >= 2) {
        // If past 2 AM today, target tomorrow 2 AM
        targetDay += 1;
    }

    // Construct local target Date in target timezone
    const nowTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const targetTz = new Date(targetYear, targetMonth, targetDay, 2, 0, 0);

    let msUntilNext = targetTz.getTime() - nowTz.getTime();
    if (msUntilNext <= 0) {
        msUntilNext += 24 * 60 * 60 * 1000;
    }

    return msUntilNext;
};

/**
 * Core Cron Synchronizer for all active users
 */
const runDailyBentoAutoSync = async () => {
    const startTime = Date.now();
    const timezone = process.env.CRON_TIMEZONE || DEFAULT_TIMEZONE;
    const dateStr = getTodayDateStringInTimezone(timezone);

    console.log(`\n==================================================`);
    console.log(`[CRON STARTED] Daily Bento Auto-Sync`);
    console.log(`[CRON CONFIG] Timezone: ${timezone} | Date: ${dateStr} | Time: ${new Date().toISOString()}`);
    console.log(`==================================================`);

    let totalDiscovered = 0;
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    const failureLogs = [];

    try {
        // Discover users who have active Bento social blocks
        const activeSocialUserIds = await ProfileBlock.distinct('userId', {
            blockType: { $in: SUPPORTED_SOCIAL_PLATFORMS }
        });

        // Also discover all users in the system if social blocks are empty
        const allUsers = await User.find({}).select('_id username email').lean();
        const userMap = new Map();

        allUsers.forEach(u => userMap.set(u._id.toString(), u));

        // Target users with social blocks first, then remaining users
        const targetUserIds = Array.from(new Set([
            ...activeSocialUserIds.map(id => id.toString()),
            ...allUsers.map(u => u._id.toString())
        ]));

        totalDiscovered = targetUserIds.length;
        console.log(`[CRON DISCOVERY] Discovered ${totalDiscovered} total user(s) for Bento data auto-sync.`);

        for (const userId of targetUserIds) {
            totalProcessed++;
            const userObj = userMap.get(userId);
            const userLabel = userObj ? `@${userObj.username}` : userId;

            try {
                console.log(`[CRON PROCESSING ${totalProcessed}/${totalDiscovered}] Syncing Bento data for user: ${userLabel} (${userId})...`);

                // Call central synchronization service
                const result = await syncUserBentoData(userId, {
                    forceRefresh: true,
                    syncSource: 'cron'
                });

                if (result.success) {
                    totalSucceeded++;
                    console.log(`[CRON SUCCESS] User: ${userLabel} synchronized successfully.`);
                } else {
                    totalFailed++;
                    failureLogs.push({
                        userId,
                        userLabel,
                        operation: 'syncUserBentoData',
                        timestamp: new Date().toISOString(),
                        error: 'Returned failure status'
                    });
                }
            } catch (userErr) {
                totalFailed++;
                console.error(`[CRON USER FAILURE] Failed to sync user ${userLabel} (${userId}):`, userErr.message);
                failureLogs.push({
                    userId,
                    userLabel,
                    operation: 'syncUserBentoData',
                    timestamp: new Date().toISOString(),
                    error: userErr.message || 'Unexpected failure'
                });
                // CRITICAL REQUIREMENT 5: Cron MUST NOT stop on one user failure! Proceed to next user.
            }

            // Controlled batching/delay (300ms) between users to avoid hammering Apify
            await new Promise(res => setTimeout(res, 300));
        }

        const durationMs = Date.now() - startTime;
        console.log(`\n==================================================`);
        console.log(`[CRON COMPLETED] Daily Bento Auto-Sync Finished`);
        console.log(`[CRON SUMMARY] Discovered: ${totalDiscovered} | Processed: ${totalProcessed} | Succeeded: ${totalSucceeded} | Failed: ${totalFailed}`);
        console.log(`[CRON SUMMARY] Duration: ${(durationMs / 1000).toFixed(2)}s`);
        if (failureLogs.length > 0) {
            console.log(`[CRON FAILURES DETAILS]`, JSON.stringify(failureLogs, null, 2));
        }
        console.log(`==================================================\n`);
    } catch (globalErr) {
        console.error(`[CRON FATAL ERROR] Daily Bento Auto-Sync execution error:`, globalErr);
    }
};

let cronTimer = null;
let isCronInitialized = false;

/**
 * Initialize daily 2:00 AM Asia/Kolkata Cron Scheduler
 */
const initBentoCronJob = () => {
    if (isCronInitialized) {
        console.log(`[CRON INIT] Bento Daily Cron Job already initialized. Skipping duplicate schedule.`);
        return;
    }

    const timezone = process.env.CRON_TIMEZONE || DEFAULT_TIMEZONE;

    // Try requiring node-cron if installed
    let nodeCron = null;
    try {
        nodeCron = require('node-cron');
    } catch (e) {
        nodeCron = null;
    }

    if (nodeCron) {
        console.log(`[CRON INIT] Scheduling daily cron job using node-cron for 02:00 AM (${timezone})...`);
        nodeCron.schedule('0 2 * * *', () => {
            runDailyBentoAutoSync();
        }, {
            scheduled: true,
            timezone: timezone
        });
        isCronInitialized = true;
    } else {
        // Standard Node.js Timer Scheduler with exact 2:00 AM Asia/Kolkata calculation
        const setupNextSchedule = () => {
            const msUntil2AM = getMsUntilNext2AM(timezone);
            const hours = (msUntil2AM / (1000 * 60 * 60)).toFixed(2);
            console.log(`[CRON INIT] Scheduled next Bento Auto-Sync in ${hours} hours (at 02:00 AM ${timezone}).`);

            cronTimer = setTimeout(async () => {
                await runDailyBentoAutoSync();
                setupNextSchedule(); // Schedule next day's 2 AM run
            }, msUntil2AM);
        };

        setupNextSchedule();
        isCronInitialized = true;
    }
};

module.exports = {
    initBentoCronJob,
    runDailyBentoAutoSync,
    getTodayDateStringInTimezone
};
