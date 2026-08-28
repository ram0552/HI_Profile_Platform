// Standalone idempotent migration script to backfill default Bento design customization to profiles missing the subdocument
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const { connectDB } = require('../config/db');

const DEFAULT_CUSTOMIZATION = {
    designStyle: 'classic',
    colorTheme: 'default',
    typography: 'inter',
    borderRadius: 'medium',
    shadow: 'soft',
    spacing: 'comfortable',
    version: 1
};

const ALLOWED_ENUMS = {
    designStyle: ['classic', 'glass', 'brutalist', 'elevated', 'minimal', 'outline', 'softUI', 'retroTerminal', 'gradientMesh', 'editorial', 'duotone', 'frostedDark'],
    colorTheme: ['default', 'sunset', 'rose', 'skyBreeze', 'sandNeutral', 'mintFresh', 'lavenderMist', 'peachCream', 'midnight', 'cyberpunk', 'emerald', 'royalPurple', 'obsidian', 'crimsonEmber', 'oceanDepth', 'graphiteSteel'],
    typography: ['inter', 'outfit', 'jakarta', 'manrope', 'spaceGrotesk', 'playfair', 'lora', 'cormorant', 'robotoMono', 'jetbrainsMono', 'spaceMono', 'poppins', 'bricolage'],
    borderRadius: ['sharp', 'subtle', 'small', 'medium', 'large', 'extraLarge', 'rounded', 'pill'],
    shadow: ['none', 'whisper', 'soft', 'elevated', 'strong', 'neo3d', 'glow', 'offsetBrutalist'],
    spacing: ['tight', 'compact', 'comfortable', 'relaxed', 'spacious', 'airy']
};

const LEGACY_MAPPINGS = {
    typography: {
        'robotomono': 'robotoMono',
        'jetbrainsmono': 'jetbrainsMono',
        'spacemono': 'spaceMono',
        'spacegrotesk': 'spaceGrotesk',
        'playfairdisplay': 'playfair',
        'cormorantgaramond': 'cormorant'
    },
    shadow: {
        'medium': 'soft',
        'large': 'elevated',
        'small': 'whisper'
    }
};

function sanitizeField(category, value) {
    if (!value) return DEFAULT_CUSTOMIZATION[category];
    if (ALLOWED_ENUMS[category].includes(value)) return value;
    const lower = String(value).toLowerCase().trim();
    if (LEGACY_MAPPINGS[category] && LEGACY_MAPPINGS[category][lower]) {
        return LEGACY_MAPPINGS[category][lower];
    }
    const matched = ALLOWED_ENUMS[category].find(e => e.toLowerCase() === lower);
    if (matched) return matched;
    return DEFAULT_CUSTOMIZATION[category];
}

async function runMigration() {
    console.log('\n[Migration] Starting Bento Customization backfill migration...');
    
    try {
        await connectDB();
        
        const totalProfiles = await Profile.countDocuments();
        console.log(`[Migration] Total profile documents found: ${totalProfiles}`);

        const allProfiles = await Profile.find({});
        let updatedCount = 0;

        for (const profile of allProfiles) {
            const existing = profile.customization || {};
            
            const sanitized = {
                designStyle: sanitizeField('designStyle', existing.designStyle),
                colorTheme: sanitizeField('colorTheme', existing.colorTheme),
                typography: sanitizeField('typography', existing.typography),
                borderRadius: sanitizeField('borderRadius', existing.borderRadius),
                shadow: sanitizeField('shadow', existing.shadow),
                spacing: sanitizeField('spacing', existing.spacing),
                updatedAt: existing.updatedAt || new Date(),
                version: existing.version || 1
            };

            const isDifferent = !profile.customization ||
                profile.customization.designStyle !== sanitized.designStyle ||
                profile.customization.colorTheme !== sanitized.colorTheme ||
                profile.customization.typography !== sanitized.typography ||
                profile.customization.borderRadius !== sanitized.borderRadius ||
                profile.customization.shadow !== sanitized.shadow ||
                profile.customization.spacing !== sanitized.spacing;

            if (isDifferent) {
                profile.customization = sanitized;
                profile.markModified('customization');
                await profile.save();
                updatedCount++;
            }
        }

        console.log(`[Migration] Successfully updated ${updatedCount} profiles.`);
        console.log(`[Migration] Profiles already conforming: ${totalProfiles - updatedCount}.`);
        console.log('[Migration] Bento Customization backfill migration completed successfully.\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('[Migration Error]', error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
}

runMigration();
