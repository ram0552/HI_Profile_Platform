const Profile = require('../models/Profile');
const User = require('../models/User');
const { syncSetupSocialLinksToBento } = require('../services/bentoSyncService');

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

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: {
                profile,
                user
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

module.exports = {
    uploadAvatar,
    updateBio,
    updateSocialLinks,
    selectTemplate,
    getProfileMe,
    getPublicProfile,
    updateProfileMe
};
