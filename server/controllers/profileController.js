const Profile = require('../models/Profile');
const User = require('../models/User');

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

module.exports = {
    uploadAvatar,
    updateBio,
    updateSocialLinks,
    selectTemplate,
    getProfileMe,
    getPublicProfile
};
