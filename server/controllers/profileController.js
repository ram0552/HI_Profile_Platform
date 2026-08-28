const Profile = require('../models/Profile');
const User = require('../models/User');
const { syncSetupSocialLinksToBento } = require('../services/bentoSyncService');
const { enhanceBioWithGemini } = require('../services/geminiService');

/**
 * Helper: Find or create profile for a user
 */
const getOrCreateProfile = async (user) => {
    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
        profile = await Profile.create({
            userId: user._id,
            username: user.username
        });
    }
    return profile;
};

/**
 * POST /api/profile/upload
 * Upload/save profile avatar and picture
 */
const uploadAvatar = async (req, res) => {
    try {
        const { avatar, profileImage } = req.body;

        const profile = await getOrCreateProfile(req.user);

        if (avatar) {
            profile.avatar = {
                type: avatar.type || null,
                data: avatar.data || '',
                transform: avatar.transform || '',
                bg: avatar.bg || ''
            };
            if (avatar.type === 'file' && avatar.data) {
                profile.profileImage = avatar.data;
            }
        }

        if (profileImage) {
            profile.profileImage = profileImage.trim();
        }

        await profile.save();

        // Update User Onboarding State
        const user = await User.findById(req.user._id);
        if (!user.onboarding) {
            user.onboarding = {};
        }

        user.onboarding.stepTracking.upload = true;
        if (!user.onboarding.isCompleted) {
            user.onboarding.currentStep = '/profile';
            const completedCount = Object.values(user.onboarding.stepTracking.toObject ? user.onboarding.stepTracking.toObject() : user.onboarding.stepTracking).filter(Boolean).length;
            user.onboarding.completionPercentage = Math.min(100, Math.max(user.onboarding.completionPercentage || 0, Math.round((completedCount / 4) * 100)));
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile avatar saved successfully',
            data: {
                profile,
                onboarding: user.onboarding
            }
        });
    } catch (error) {
        console.error('[Upload Avatar Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture',
            data: null
        });
    }
};

/**
 * POST /api/profile/bio
 * Update bio and user display name
 */
const updateBio = async (req, res) => {
    try {
        const { bio, fullName } = req.body;

        const profile = await getOrCreateProfile(req.user);

        if (bio !== undefined) {
            profile.bio = bio.trim();
            await profile.save();
        }

        const user = await User.findById(req.user._id);
        if (fullName && fullName.trim()) {
            user.fullName = fullName.trim();
        }

        if (!user.onboarding) {
            user.onboarding = {};
        }

        user.onboarding.stepTracking.profile = true;
        if (!user.onboarding.isCompleted) {
            user.onboarding.currentStep = '/setup';
            const completedCount = Object.values(user.onboarding.stepTracking.toObject ? user.onboarding.stepTracking.toObject() : user.onboarding.stepTracking).filter(Boolean).length;
            user.onboarding.completionPercentage = Math.min(100, Math.max(user.onboarding.completionPercentage || 0, Math.round((completedCount / 4) * 100)));
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile biography updated successfully',
            data: {
                profile,
                onboarding: user.onboarding
            }
        });
    } catch (error) {
        console.error('[Update Bio Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update profile bio',
            data: null
        });
    }
};

/**
 * POST /api/profile/social
 * Update social media links
 */
const updateSocialLinks = async (req, res) => {
    try {
        const { socialLinks } = req.body;

        const profile = await getOrCreateProfile(req.user);

        if (socialLinks && typeof socialLinks === 'object') {
            const currentLinks = profile.socialLinks || {};
            const allowedFields = ['github', 'linkedin', 'website', 'twitter', 'instagram', 'facebook', 'youtube', 'discord', 'telegram', 'dribbble', 'customLinks'];

            allowedFields.forEach(field => {
                if (socialLinks[field] !== undefined) {
                    currentLinks[field] = socialLinks[field];
                }
            });
            profile.socialLinks = currentLinks;
            await profile.save();

            // Automatically sync social handles to Bento blocks if Bento is selected or active template
            if (profile.selectedTemplate === 'bento') {
                await syncSetupSocialLinksToBento(req.user._id);
            }
        }

        const user = await User.findById(req.user._id);
        if (!user.onboarding) {
            user.onboarding = {};
        }

        user.onboarding.stepTracking.setup = true;
        if (!user.onboarding.isCompleted) {
            user.onboarding.currentStep = '/select';
            const completedCount = Object.values(user.onboarding.stepTracking.toObject ? user.onboarding.stepTracking.toObject() : user.onboarding.stepTracking).filter(Boolean).length;
            user.onboarding.completionPercentage = Math.min(100, Math.max(user.onboarding.completionPercentage || 0, Math.round((completedCount / 4) * 100)));
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Social links updated successfully',
            data: {
                profile,
                onboarding: user.onboarding
            }
        });
    } catch (error) {
        console.error('[Update Social Links Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update social links',
            data: null
        });
    }
};

/**
 * POST /api/profile/template
 * Update template selection and complete onboarding
 */
const selectTemplate = async (req, res) => {
    try {
        const { selectedTemplate } = req.body;

        const profile = await getOrCreateProfile(req.user);

        if (selectedTemplate) {
            profile.selectedTemplate = selectedTemplate;
            await profile.save();

            // Automatically sync setup social handles into Bento profile blocks when Bento is selected
            if (selectedTemplate === 'bento') {
                await syncSetupSocialLinksToBento(req.user._id);
            }
        }

        const user = await User.findById(req.user._id);
        if (!user.onboarding) {
            user.onboarding = {};
        }

        user.onboarding.stepTracking.select = true;
        user.onboarding.currentStep = 'completed';
        user.onboarding.completionPercentage = 100;
        user.onboarding.isCompleted = true;
        user.onboarding.completedAt = new Date();

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Template selected and onboarding completed successfully',
            data: {
                profile,
                onboarding: user.onboarding
            }
        });
    } catch (error) {
        console.error('[Select Template Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save template selection',
            data: null
        });
    }
};

/**
 * GET /api/profile/me
 * Get current user's profile and onboarding state
 */
const getProfileMe = async (req, res) => {
    try {
        const profile = await getOrCreateProfile(req.user);
        const user = await User.findById(req.user._id).select('-password -loginHistory -failedLoginAttempts -lockoutUntil');

        const enhancementCount = profile.bioEnhancementCount || 0;
        const remainingEnhancements = Math.max(0, 2 - enhancementCount);

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: {
                profile,
                user,
                enhancementCount,
                remainingEnhancements
            }
        });
    } catch (error) {
        console.error('[Get Profile Me Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            data: null
        });
    }
};

/**
 * GET /api/profile/user/:username
 * Get public profile details by username (No sensitive auth data exposed)
 */
const getPublicProfile = async (req, res) => {
    try {
        const username = (req.params.username || '').toLowerCase().trim();
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required',
                data: null
            });
        }

        const profile = await Profile.findOne({ username });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
                data: null
            });
        }

        // Fetch non-sensitive basic user details (fullName)
        const user = await User.findById(profile.userId).select('fullName username role');

        return res.status(200).json({
            success: true,
            message: 'Public profile retrieved',
            data: {
                profile,
                user
            }
        });
    } catch (error) {
        console.error('[Get Public Profile Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve public profile',
            data: null
        });
    }
};

/**
 * PUT /api/profile/me
 * Update full profile details (fullName, username, bio, location, website, profileImage, socialLinks, theme, accentColor)
 */
const updateProfileMe = async (req, res) => {
    try {
        const {
            fullName,
            username,
            bio,
            headline,
            location,
            website,
            profileImage,
            profilePicture,
            avatar,
            socialLinks,
            theme,
            accentColor
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const profile = await getOrCreateProfile(user);

        // Handle username update safely
        if (username && typeof username === 'string') {
            const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
            if (cleanUsername && cleanUsername !== user.username) {
                const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
                if (!usernameRegex.test(cleanUsername)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.'
                    });
                }

                const existingUser = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
                const existingProfile = await Profile.findOne({ username: cleanUsername, userId: { $ne: user._id } });

                if (existingUser || existingProfile) {
                    return res.status(400).json({
                        success: false,
                        message: `Username "@${cleanUsername}" is already taken.`
                    });
                }

                user.username = cleanUsername;
                profile.username = cleanUsername;
            }
        }

        // Update User fields
        if (fullName !== undefined && typeof fullName === 'string') {
            const cleanName = fullName.trim();
            if (cleanName) {
                user.fullName = cleanName;
            }
        }

        // Update Profile fields
        if (bio !== undefined && typeof bio === 'string') {
            profile.bio = bio.trim();
        }

        if (location !== undefined && typeof location === 'string') {
            profile.location = location.trim();
        }

        const imageToSave = profileImage !== undefined ? profileImage : (profilePicture !== undefined ? profilePicture : undefined);
        if (imageToSave !== undefined && typeof imageToSave === 'string') {
            profile.profileImage = imageToSave.trim();
        }

        if (avatar !== undefined && avatar !== null) {
            profile.avatar = avatar;
            if (avatar.type === 'file' && avatar.data) {
                profile.profileImage = avatar.data;
            }
        }

        if (theme !== undefined && typeof theme === 'string') {
            profile.theme = theme;
        }

        if (accentColor !== undefined && typeof accentColor === 'string') {
            profile.accentColor = accentColor.trim();
        }

        const currentLinks = profile.socialLinks || {};
        if (socialLinks && typeof socialLinks === 'object') {
            const allowedFields = ['github', 'linkedin', 'website', 'twitter', 'instagram', 'facebook', 'youtube', 'discord', 'telegram', 'dribbble', 'location', 'customLinks'];

            allowedFields.forEach(field => {
                if (socialLinks[field] !== undefined) {
                    currentLinks[field] = socialLinks[field];
                }
            });
        }

        if (location !== undefined && typeof location === 'string') {
            currentLinks.location = location.trim();
        }

        if (website !== undefined && typeof website === 'string') {
            currentLinks.website = website.trim();
        }

        profile.socialLinks = currentLinks;

        await Promise.all([user.save(), profile.save()]);

        const sanitizedUser = await User.findById(user._id).select('-password -loginHistory -failedLoginAttempts -lockoutUntil');

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile,
                user: sanitizedUser
            }
        });
    } catch (error) {
        console.error('[Update Profile Me Error]', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile',
            data: null
        });
    }
};

/**
 * POST /api/profile/bio/enhance
 * Enhance user bio using Gemini AI (Max 2 times per profile)
 */
const enhanceBio = async (req, res) => {
    try {
        const { bio } = req.body;

        // 1. Validate bio input
        if (!bio || typeof bio !== 'string' || !bio.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Bio content is required for AI enhancement.',
                data: null
            });
        }

        const trimmedBio = bio.trim();
        if (trimmedBio.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Bio exceeds maximum length of 500 characters.',
                data: null
            });
        }

        // 2. Fetch or create profile for authenticated user
        const profile = await getOrCreateProfile(req.user);

        // 3. Server-side 2-enhancement limit check
        const currentCount = profile.bioEnhancementCount || 0;
        if (currentCount >= 2) {
            return res.status(400).json({
                success: false,
                message: 'AI enhancement limit reached. You can continue editing your bio manually.',
                enhancementCount: currentCount,
                remainingEnhancements: 0,
                data: null
            });
        }

        // 4. Call Gemini AI service
        let enhancedBio;
        try {
            enhancedBio = await enhanceBioWithGemini(trimmedBio);
        } catch (geminiErr) {
            console.error('[Gemini Bio Enhancement API Error]', geminiErr);
            // Do NOT increment count if Gemini request fails
            return res.status(500).json({
                success: false,
                message: geminiErr.message || 'Failed to generate enhanced bio with Gemini AI.',
                enhancementCount: currentCount,
                remainingEnhancements: Math.max(0, 2 - currentCount),
                data: null
            });
        }

        if (!enhancedBio || !enhancedBio.trim()) {
            return res.status(500).json({
                success: false,
                message: 'Gemini returned an invalid empty bio response.',
                enhancementCount: currentCount,
                remainingEnhancements: Math.max(0, 2 - currentCount),
                data: null
            });
        }

        // 5. Increment counter ONLY AFTER successful Gemini response
        profile.bioEnhancementCount = currentCount + 1;
        await profile.save();

        const updatedCount = profile.bioEnhancementCount;
        const remaining = Math.max(0, 2 - updatedCount);

        return res.status(200).json({
            success: true,
            message: 'Bio enhanced successfully with AI',
            enhancedBio: enhancedBio.trim(),
            enhancementCount: updatedCount,
            remainingEnhancements: remaining
        });
    } catch (error) {
        console.error('[Enhance Bio Controller Error]', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while enhancing bio.',
            data: null
        });
    }
};

const ALLOWED_CUSTOMIZATION_ENUMS = {
    designStyle: ['classic', 'glass', 'brutalist', 'elevated', 'minimal', 'outline', 'softUI', 'retroTerminal', 'gradientMesh', 'editorial', 'duotone', 'frostedDark'],
    colorTheme: ['default', 'sunset', 'rose', 'skyBreeze', 'sandNeutral', 'mintFresh', 'lavenderMist', 'peachCream', 'midnight', 'cyberpunk', 'emerald', 'royalPurple', 'obsidian', 'crimsonEmber', 'oceanDepth', 'graphiteSteel'],
    typography: ['inter', 'outfit', 'jakarta', 'manrope', 'spaceGrotesk', 'playfair', 'lora', 'cormorant', 'robotoMono', 'jetbrainsMono', 'spaceMono', 'poppins', 'bricolage'],
    borderRadius: ['sharp', 'subtle', 'small', 'medium', 'large', 'extraLarge', 'rounded', 'pill'],
    shadow: ['none', 'whisper', 'soft', 'elevated', 'strong', 'neo3d', 'glow', 'offsetBrutalist'],
    spacing: ['tight', 'compact', 'comfortable', 'relaxed', 'spacious', 'airy']
};

const DEFAULT_CUSTOMIZATION_DATA = {
    designStyle: 'classic',
    colorTheme: 'default',
    typography: 'inter',
    borderRadius: 'medium',
    shadow: 'soft',
    spacing: 'comfortable',
    version: 1
};

/**
 * GET /api/profiles/:username/customization (or /api/profile/:username/customization)
 * Public endpoint to fetch Bento design customization for a profile
 */
const getCustomization = async (req, res) => {
    try {
        const rawUsername = req.params.username || '';
        const username = rawUsername.toLowerCase().trim().replace(/^@/, '');

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required',
                data: null
            });
        }

        const profile = await Profile.findOne({ username });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
                data: null
            });
        }

        const rawCust = profile.customization || {};
        const customization = {
            designStyle: rawCust.designStyle || DEFAULT_CUSTOMIZATION_DATA.designStyle,
            colorTheme: rawCust.colorTheme || DEFAULT_CUSTOMIZATION_DATA.colorTheme,
            typography: rawCust.typography || DEFAULT_CUSTOMIZATION_DATA.typography,
            borderRadius: rawCust.borderRadius || DEFAULT_CUSTOMIZATION_DATA.borderRadius,
            shadow: rawCust.shadow || DEFAULT_CUSTOMIZATION_DATA.shadow,
            spacing: rawCust.spacing || DEFAULT_CUSTOMIZATION_DATA.spacing,
            updatedAt: rawCust.updatedAt || profile.updatedAt || new Date().toISOString(),
            version: rawCust.version || 1
        };

        return res.status(200).json({
            success: true,
            message: 'Customization retrieved successfully',
            data: customization,
            ...customization
        });
    } catch (error) {
        console.error('[Get Customization Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile customization',
            data: null
        });
    }
};

/**
 * PUT/PATCH /api/profiles/:username/customization (or /api/profile/:username/customization)
 * Authenticated owner endpoint to partially or fully update Bento design customization
 */
const updateCustomization = async (req, res) => {
    try {
        const rawUsername = req.params.username || '';
        const username = rawUsername.toLowerCase().trim().replace(/^@/, '');

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required',
                data: null
            });
        }

        // 1. Find the profile to be updated
        const profile = await Profile.findOne({ username });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found',
                data: null
            });
        }

        // 2. Enforce strict ownership check: profile owner must match authenticated user
        const isOwner = (profile.userId && profile.userId.toString() === req.user._id.toString()) ||
                        (req.user.username && req.user.username.toLowerCase() === username);

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to modify this profile customization',
                data: null
            });
        }

        // 3. Validate request body
        const bodyKeys = Object.keys(req.body || {});
        const allowedKeys = Object.keys(ALLOWED_CUSTOMIZATION_ENUMS);

        // Disallow unknown keys
        for (const key of bodyKeys) {
            if (key === 'updatedAt' || key === 'version') {
                return res.status(400).json({
                    success: false,
                    message: `'${key}' is server-controlled and cannot be supplied by the client`,
                    data: null
                });
            }
            if (!allowedKeys.includes(key)) {
                return res.status(400).json({
                    success: false,
                    message: `Unknown field: '${key}'. Allowed fields are: ${allowedKeys.join(', ')}`,
                    data: null
                });
            }
        }

        // Validate enum values for provided fields
        for (const key of bodyKeys) {
            const val = req.body[key];
            if (val !== undefined) {
                if (typeof val !== 'string' || !ALLOWED_CUSTOMIZATION_ENUMS[key].includes(val)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid value '${val}' for field '${key}'. Allowed values: ${ALLOWED_CUSTOMIZATION_ENUMS[key].join(', ')}`,
                        data: null
                    });
                }
            }
        }

        // 4. Merge partial or full updates into profile.customization
        if (!profile.customization) {
            profile.customization = { ...DEFAULT_CUSTOMIZATION_DATA };
        }

        allowedKeys.forEach(key => {
            if (req.body[key] !== undefined) {
                profile.customization[key] = req.body[key];
            }
        });

        // Server-controlled timestamp & version
        profile.customization.updatedAt = new Date();
        profile.customization.version = 1;

        // Mark modified to guarantee Mongoose persistence on nested subdocument
        profile.markModified('customization');
        await profile.save();

        const savedCust = profile.customization.toObject ? profile.customization.toObject() : profile.customization;

        return res.status(200).json({
            success: true,
            message: 'Customization updated successfully',
            data: savedCust,
            ...savedCust
        });
    } catch (error) {
        console.error('[Update Customization Error]', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update customization',
            data: null
        });
    }
};

module.exports = {
    uploadAvatar,
    updateBio,
    updateSocialLinks,
    selectTemplate,
    getProfileMe,
    getPublicProfile,
    updateProfileMe,
    enhanceBio,
    getCustomization,
    updateCustomization
};
