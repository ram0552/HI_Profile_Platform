const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const useragent = require('express-useragent');

const User = require('../models/User');
const Profile = require('../models/Profile');
const UsernameReservation = require('../models/UsernameReservation');
const VerificationToken = require('../models/VerificationToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const RefreshToken = require('../models/RefreshToken');

const {
    sendVerificationEmail,
    sendPasswordResetOtpEmail,
    sendPasswordChangedEmail,
    sendAccountLockedEmail
} = require('../services/emailService');

// Helper: Hash token/OTP using SHA256
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper: Generate JWT tokens
const generateTokens = (user, sessionId) => {
    const accessSecret = process.env.JWT_SECRET || 'access_secret_key';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || accessSecret;

    const accessToken = jwt.sign(
        { userId: user._id, role: user.role, sessionId },
        accessSecret,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId: user._id, sessionId },
        refreshSecret,
        { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
};

// Helper: Set cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 min
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

// Helper: Clear cookies
const clearAuthCookies = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};

// Helper: Parse client info
const getClientInfo = (req) => {
    const source = req.headers['user-agent'] || '';
    let ua = {};
    try {
        if (useragent && useragent.useragent && typeof useragent.useragent.parse === 'function') {
            ua = useragent.useragent.parse(source);
        } else if (useragent && typeof useragent.parse === 'function') {
            ua = useragent.parse(source);
        }
    } catch (e) {
        console.error('[UserAgent Parse Error]', e.message);
    }
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';

    return {
        ip: Array.isArray(ip) ? ip[0] : ip,
        device: ua.isMobile ? 'Mobile' : ua.isTablet ? 'Tablet' : 'Desktop',
        browser: (ua.browser && ua.browser !== 'unknown') ? `${ua.browser} ${ua.version || ''}`.trim() : 'Browser',
        operatingSystem: (ua.os && ua.os !== 'unknown') ? ua.os : 'OS'
    };
};

const RESERVED_USERNAMES = new Set([
    'admin', 'administrator', 'root', 'support', 'help', 'api', 'settings', 'config',
    'hiprofile', 'app', 'login', 'register', 'claim', 'dashboard', 'official', 'about',
    'privacy', 'terms', 'security', 'billing', 'status', 'auth', 'user', 'users'
]);

/**
 * GET /api/auth/username-check?username=value
 */
const checkUsername = async (req, res) => {
    try {
        const usernameStr = (req.query.username || '').toString().trim().toLowerCase();
        
        // Format check: 3 to 30 chars, alphanumeric + underscores + hyphens
        if (!usernameStr || usernameStr.length < 3 || usernameStr.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(usernameStr)) {
            return res.status(200).json({
                success: true,
                message: 'Invalid profile name format',
                data: { available: false, username: usernameStr }
            });
        }

        // Check reserved words
        if (RESERVED_USERNAMES.has(usernameStr)) {
            return res.status(200).json({
                success: true,
                message: 'This profile name is reserved',
                data: { available: false, username: usernameStr }
            });
        }

        // Check users collection
        const existingUser = await User.findOne({ username: usernameStr });
        if (existingUser) {
            return res.status(200).json({
                success: true,
                message: 'Profile name already exists',
                data: { available: false, username: usernameStr }
            });
        }

        // Check active reservations
        const activeReservation = await UsernameReservation.findOne({
            username: usernameStr,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        if (activeReservation) {
            return res.status(200).json({
                success: true,
                message: 'Profile name is currently reserved',
                data: { available: false, username: usernameStr }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile name is available',
            data: { available: true, username: usernameStr }
        });
    } catch (error) {
        console.error('[Check Username Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
};

/**
 * POST /api/auth/username-reserve
 */
const reserveUsername = async (req, res) => {
    try {
        const { username } = req.body;
        const usernameStr = (username || '').toString().trim().toLowerCase();

        if (!usernameStr || usernameStr.length < 3 || usernameStr.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(usernameStr)) {
            return res.status(400).json({
                success: false,
                message: 'Profile name must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores',
                data: null
            });
        }

        if (RESERVED_USERNAMES.has(usernameStr)) {
            return res.status(400).json({
                success: false,
                message: 'This profile name is reserved by system',
                data: null
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username: usernameStr });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Profile name already exists',
                data: null
            });
        }

        // Remove old reservation if expired, or check active
        const existingRes = await UsernameReservation.findOne({ username: usernameStr });
        if (existingRes && existingRes.expiresAt > new Date() && existingRes.status === 'reserved') {
            return res.status(409).json({
                success: false,
                message: 'Profile name currently reserved by another request',
                data: null
            });
        }

        if (existingRes) {
            await UsernameReservation.deleteOne({ _id: existingRes._id });
        }

        const reservationId = 'res_' + crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

        const reservation = await UsernameReservation.create({
            username: usernameStr,
            reservationId,
            status: 'reserved',
            expiresAt
        });

        return res.status(201).json({
            success: true,
            message: 'Profile name reserved successfully',
            data: {
                reservationId: reservation.reservationId,
                username: reservation.username,
                expiresAt: reservation.expiresAt
            }
        });
    } catch (error) {
        console.error('[Reserve Username Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reserve profile name',
            data: null
        });
    }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { fullName, username, email, password, reservationId } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase();

        // Check email uniqueness
        const existingEmail = await User.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists',
                data: null
            });
        }

        // Check username uniqueness in User
        const existingUsername = await User.findOne({ username: cleanUsername });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username is already taken',
                data: null
            });
        }

        // Password hash (12 rounds)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with status 'pending' and emailVerified false
        const newUser = await User.create({
            fullName: fullName.trim(),
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword,
            role: 'user',
            emailVerified: false,
            accountStatus: 'pending',
            authenticationProviders: [{
                provider: 'local',
                providerId: cleanEmail,
                linkedAt: new Date()
            }],
            onboarding: {
                currentStep: '/upload',
                completionPercentage: 0,
                isCompleted: false,
                completedAt: null,
                stepTracking: { upload: false, profile: false, setup: false, select: false }
            }
        });

        // Create initial Profile document for the user
        await Profile.create({
            userId: newUser._id,
            username: cleanUsername
        });

        // Mark reservation as claimed if present
        if (reservationId) {
            await UsernameReservation.updateOne(
                { reservationId },
                { status: 'claimed' }
            );
        }

        // Create verification token (24h expiry)
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await VerificationToken.create({
            userId: newUser._id,
            tokenHash,
            expiresAt
        });

        // Verification link
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const verificationLink = `${clientUrl}/verify-email?token=${rawToken}`;

        // Send email
        await sendVerificationEmail(newUser.email, newUser.fullName, verificationLink);

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                userId: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                accountStatus: newUser.accountStatus
            }
        });
    } catch (error) {
        console.error('[Register Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Registration failed due to a server error',
            data: null
        });
    }
};

/**
 * GET /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
    try {
        const token = (req.query.token || req.body.token || '').toString().trim();

        if (!token) {
            console.log('[Verify Email] Missing token in request');
            return res.status(400).json({
                success: false,
                code: 'TOKEN_MISSING',
                message: 'Verification token is required',
                data: null
            });
        }

        const tokenHash = hashToken(token);
        console.log(`[Verify Email] Verifying token hash: ${tokenHash.substring(0, 10)}...`);

        const tokenDoc = await VerificationToken.findOne({ tokenHash });

        if (!tokenDoc) {
            console.log(`[Verify Email] Token doc not found in DB for hash: ${tokenHash.substring(0, 10)}...`);
            return res.status(400).json({
                success: false,
                code: 'TOKEN_INVALID_OR_ALREADY_USED',
                message: 'This verification link is invalid or has already been used. If your account is already verified, please log in.',
                data: null
            });
        }

        if (tokenDoc.expiresAt < new Date()) {
            console.log(`[Verify Email] Token expired at ${tokenDoc.expiresAt}`);
            await VerificationToken.deleteOne({ _id: tokenDoc._id });
            return res.status(400).json({
                success: false,
                code: 'TOKEN_EXPIRED',
                message: 'Verification link has expired. Please request a new verification email.',
                data: null
            });
        }

        // Find user
        const user = await User.findById(tokenDoc.userId);
        if (!user) {
            console.log(`[Verify Email] Associated user ${tokenDoc.userId} not found`);
            await VerificationToken.deleteOne({ _id: tokenDoc._id });
            return res.status(404).json({
                success: false,
                code: 'USER_NOT_FOUND',
                message: 'User associated with token not found',
                data: null
            });
        }

        // Idempotency: User is already verified
        if (user.emailVerified && user.accountStatus === 'active') {
            console.log(`[Verify Email] User ${user.email} is already verified`);
            await VerificationToken.deleteOne({ _id: tokenDoc._id });
            return res.status(200).json({
                success: true,
                code: 'EMAIL_ALREADY_VERIFIED',
                message: 'Your email address is already verified. You can log in.',
                data: {
                    userId: user._id,
                    email: user.email,
                    emailVerified: true,
                    accountStatus: user.accountStatus
                }
            });
        }

        // Activate user
        user.emailVerified = true;
        user.accountStatus = 'active';
        user.verifiedAt = new Date();
        await user.save();

        // Delete token
        await VerificationToken.deleteOne({ _id: tokenDoc._id });

        console.log(`[Verify Email Success] Activated account for user: ${user.email}`);

        return res.status(200).json({
            success: true,
            code: 'VERIFICATION_SUCCESS',
            message: 'Email successfully verified! Your account is now active.',
            data: {
                userId: user._id,
                email: user.email,
                emailVerified: true,
                accountStatus: user.accountStatus
            }
        });
    } catch (error) {
        console.error('[Verify Email Error]', error);
        return res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Email verification failed due to an internal server error',
            data: null
        });
    }
};

/**
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
                data: null
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account with this email exists, a verification link has been sent.',
                data: null
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'This account email is already verified.',
                data: null
            });
        }

        // Delete old token
        await VerificationToken.deleteMany({ userId: user._id });

        // Generate new token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await VerificationToken.create({
            userId: user._id,
            tokenHash,
            expiresAt
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const verificationLink = `${clientUrl}/verify-email?token=${rawToken}`;

        await sendVerificationEmail(user.email, user.fullName, verificationLink);

        return res.status(200).json({
            success: true,
            message: 'A new verification email has been sent.',
            data: null
        });
    } catch (error) {
        console.error('[Resend Verification Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend verification email',
            data: null
        });
    }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                data: null
            });
        }

        // Check if account is locked
        if (user.accountStatus === 'locked') {
            if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                const remainingMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
                return res.status(403).json({
                    success: false,
                    message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMins} minute(s).`,
                    data: null
                });
            } else {
                // Lockout period expired, unlock account
                user.accountStatus = user.emailVerified ? 'active' : 'pending';
                user.failedLoginAttempts = 0;
                user.lockoutUntil = null;
                await user.save();
            }
        }

        // Check if suspended
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended. Please contact support.',
                data: null
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.accountStatus = 'locked';
                user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                await user.save();

                // Send email notification
                await sendAccountLockedEmail(user.email, user.fullName);

                return res.status(403).json({
                    success: false,
                    message: 'Maximum 5 failed attempts reached. Your account is locked for 15 minutes.',
                    data: null
                });
            }
            await user.save();
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                data: null
            });
        }

        // Check email verification
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in.',
                data: { emailVerified: false }
            });
        }

        // Successful login: reset failed attempts
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
        user.lastLogin = new Date();

        // Create session ID and Tokens
        const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
        const { accessToken, refreshToken } = generateTokens(user, sessionId);

        // Store hashed Refresh Token
        const clientInfo = getClientInfo(req);
        const refreshTokenHash = hashToken(refreshToken);

        await RefreshToken.create({
            userId: user._id,
            tokenHash: refreshTokenHash,
            sessionId,
            device: clientInfo.device,
            browser: clientInfo.browser,
            ip: clientInfo.ip,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        // Append login history (Never overwrite)
        user.loginHistory.push({
            provider: 'local',
            loginTime: new Date(),
            ip: clientInfo.ip,
            device: clientInfo.device,
            browser: clientInfo.browser,
            operatingSystem: clientInfo.operatingSystem,
            location: '',
            sessionId
        });

        await user.save();

        // Set Cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Return user data sans password
        const userObject = user.toObject();
        delete userObject.password;

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userObject,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('[Login Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Login failed due to a server error',
            data: null
        });
    }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is missing',
                data: null
            });
        }

        const accessSecret = process.env.JWT_SECRET || 'access_secret_key';
        const refreshSecret = process.env.JWT_REFRESH_SECRET || accessSecret;

        let decoded;
        try {
            decoded = jwt.verify(incomingRefreshToken, refreshSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is invalid or expired',
                data: null
            });
        }

        const tokenHash = hashToken(incomingRefreshToken);
        const existingTokenDoc = await RefreshToken.findOne({ tokenHash });

        if (!existingTokenDoc) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token has been revoked or used',
                data: null
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user || user.accountStatus === 'suspended' || user.accountStatus === 'locked') {
            await RefreshToken.deleteOne({ _id: existingTokenDoc._id });
            clearAuthCookies(res);
            return res.status(403).json({
                success: false,
                message: 'User account is inactive or not found',
                data: null
            });
        }

        // Delete old refresh token doc (Rotation)
        await RefreshToken.deleteOne({ _id: existingTokenDoc._id });

        // Issue new session ID and new token pair
        const newSessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user, newSessionId);

        const clientInfo = getClientInfo(req);
        const newTokenHash = hashToken(newRefreshToken);

        await RefreshToken.create({
            userId: user._id,
            tokenHash: newTokenHash,
            sessionId: newSessionId,
            device: clientInfo.device,
            browser: clientInfo.browser,
            ip: clientInfo.ip,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        setAuthCookies(res, newAccessToken, newRefreshToken);

        return res.status(200).json({
            success: true,
            message: 'Tokens successfully refreshed',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        console.error('[Refresh Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            data: null
        });
    }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (incomingRefreshToken) {
            const tokenHash = hashToken(incomingRefreshToken);
            await RefreshToken.deleteOne({ tokenHash });
        } else if (req.sessionId) {
            await RefreshToken.deleteOne({ sessionId: req.sessionId });
        }

        clearAuthCookies(res);

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
            data: null
        });
    } catch (error) {
        console.error('[Logout Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed',
            data: null
        });
    }
};

/**
 * POST /api/auth/logout-all
 */
const logoutAll = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                data: null
            });
        }

        // Delete all refresh tokens for this user
        await RefreshToken.deleteMany({ userId: req.user._id });
        clearAuthCookies(res);

        return res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully',
            data: null
        });
    } catch (error) {
        console.error('[Logout All Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Logout all devices failed',
            data: null
        });
    }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        // Response string for preventing account enumeration
        const genericMessage = 'If an account with that email exists, a 6-digit OTP has been sent.';

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage,
                data: null
            });
        }

        // Delete existing reset tokens for this email
        await PasswordResetToken.deleteMany({ email: cleanEmail });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = hashToken(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await PasswordResetToken.create({
            email: cleanEmail,
            otpHash,
            expiresAt
        });

        await sendPasswordResetOtpEmail(user.email, otp);

        return res.status(200).json({
            success: true,
            message: genericMessage,
            data: null
        });
    } catch (error) {
        console.error('[Forgot Password Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process forgot password request',
            data: null
        });
    }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const otpHash = hashToken(otp.trim());
        const resetTokenDoc = await PasswordResetToken.findOne({ email: cleanEmail, otpHash });

        if (!resetTokenDoc) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code',
                data: null
            });
        }

        if (resetTokenDoc.expiresAt < new Date()) {
            await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new password reset.',
                data: null
            });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User account not found',
                data: null
            });
        }

        // Update password with bcrypt hash
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
        if (user.accountStatus === 'locked') {
            user.accountStatus = user.emailVerified ? 'active' : 'pending';
        }

        await user.save();

        // Delete reset token
        await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });

        // Invalidate ALL active refresh tokens (Logout all devices)
        await RefreshToken.deleteMany({ userId: user._id });
        clearAuthCookies(res);

        // Send confirmation email
        await sendPasswordChangedEmail(user.email, user.fullName);

        return res.status(200).json({
            success: true,
            message: 'Password has been successfully reset. Please log in with your new password.',
            data: null
        });
    } catch (error) {
        console.error('[Reset Password Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Password reset failed',
            data: null
        });
    }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
    try {
        const userObj = req.user.toObject();
        delete userObj.password;

        return res.status(200).json({
            success: true,
            message: 'Current user profile retrieved',
            data: userObj
        });
    } catch (error) {
        console.error('[Get Me Error]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            data: null
        });
    }
};

// Helper: Get OAuth Callback URL matching request prefix
const getOAuthRedirectUri = (req, provider) => {
    const envUri = provider === 'google' ? process.env.GOOGLE_CALLBACK_URL : process.env.GITHUB_CALLBACK_URL;
    if (envUri) return envUri;

    const host = req.headers.host || 'localhost:3001';
    const protocol = req.protocol || 'http';
    const prefix = req.baseUrl || '/api/v1/auth';
    return `${protocol}://${host}${prefix}/${provider}/callback`;
};

/**
 * GET /api/v1/auth/google & /api/auth/google
 */
const googleAuth = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getOAuthRedirectUri(req, 'google');

    console.log(`[Google OAuth Initiated] Redirecting to Google. Client ID: ${clientId ? 'Configured' : 'MISSING'}, Callback URI: ${redirectUri}`);

    if (!clientId) {
        return res.status(500).json({
            success: false,
            message: 'Google Client ID is not configured on the server',
            data: null
        });
    }

    const scope = encodeURIComponent('openid email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&prompt=select_account`;

    return res.redirect(authUrl);
};

/**
 * GET /api/v1/auth/google/callback & /api/auth/google/callback
 */
const googleCallback = async (req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
        const { code, error: googleError } = req.query;
        if (googleError) {
            console.error(`[Google OAuth Error] Access denied or error: ${googleError}`);
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google login canceled or failed')}`);
        }

        if (!code) {
            console.error('[Google OAuth Error] Missing authorization code');
            return res.redirect(`${clientUrl}/login?error=Google authentication failed (missing code)`);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = getOAuthRedirectUri(req, 'google');

        console.log(`[Google OAuth Code Received] Exchanging code for access token... Callback URI: ${redirectUri}`);

        // Token exchange
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('[Google OAuth Token Error]', tokenData);
            return res.redirect(`${clientUrl}/login?error=Failed to retrieve access token from Google`);
        }

        // User info fetch
        console.log('[Google OAuth Token Acquired] Fetching Google user profile...');
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const googleUser = await userRes.json();

        const { id: googleId, email, name, picture } = googleUser;
        if (!email) {
            console.error('[Google OAuth Profile Error] Email missing from profile', googleUser);
            return res.redirect(`${clientUrl}/login?error=Email permission required from Google`);
        }

        console.log(`[Google OAuth Profile Fetched] email=${email}, googleId=${googleId}`);

        let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

        if (user) {
            console.log(`[Google OAuth Login] Found existing user: ${user.email}`);
            if (!user.googleId) {
                user.googleId = googleId;
            }

            // Ensure Profile document exists
            let profile = await Profile.findOne({ userId: user._id });
            if (!profile) {
                profile = await Profile.create({
                    userId: user._id,
                    username: user.username,
                    profileImage: picture || ''
                });
            } else if (!profile.profileImage && picture) {
                profile.profileImage = picture;
                await profile.save();
            }

            const existingProvider = user.authenticationProviders.find(p => p.provider === 'google');
            if (!existingProvider) {
                user.authenticationProviders.push({
                    provider: 'google',
                    providerId: googleId,
                    linkedAt: new Date()
                });
            }

            user.emailVerified = true; // OAuth emails are pre-verified
            user.accountStatus = 'active';
            user.lastLogin = new Date();

            const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
            const { accessToken, refreshToken } = generateTokens(user, sessionId);
            const clientInfo = getClientInfo(req);

            await RefreshToken.create({
                userId: user._id,
                tokenHash: hashToken(refreshToken),
                sessionId,
                device: clientInfo.device,
                browser: clientInfo.browser,
                ip: clientInfo.ip,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            user.loginHistory.push({
                provider: 'google',
                loginTime: new Date(),
                ip: clientInfo.ip,
                device: clientInfo.device,
                browser: clientInfo.browser,
                operatingSystem: clientInfo.operatingSystem,
                sessionId
            });

            await user.save();
            setAuthCookies(res, accessToken, refreshToken);

            const targetStep = (user.onboarding && user.onboarding.isCompleted) ? '/bento' : (user.onboarding?.currentStep || '/upload');
            console.log(`[Google OAuth Success] Redirecting user ${user.email} to frontend ${targetStep}`);
            return res.redirect(`${clientUrl}${targetStep}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
        } else {
            console.log(`[Google OAuth New User] User ${email} does not exist. Redirecting to /register prefill`);
            const redirectParams = new URLSearchParams({
                oauth: 'google',
                googleId,
                email,
                fullName: name || '',
                picture: picture || ''
            });
            return res.redirect(`${clientUrl}/register?${redirectParams.toString()}`);
        }
    } catch (error) {
        console.error('[Google Callback Error]', error);
        return res.redirect(`${clientUrl}/login?error=Google callback error`);
    }
};

/**
 * GET /api/v1/auth/github & /api/auth/github
 */
const githubAuth = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = getOAuthRedirectUri(req, 'github');

    console.log(`[GitHub OAuth Initiated] Redirecting to GitHub. Client ID: ${clientId ? 'Configured' : 'MISSING'}, Callback URI: ${redirectUri}`);

    if (!clientId) {
        return res.status(500).json({
            success: false,
            message: 'GitHub Client ID is not configured on the server',
            data: null
        });
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    return res.redirect(authUrl);
};

/**
 * GET /api/v1/auth/github/callback & /api/auth/github/callback
 */
const githubCallback = async (req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
        const { code, error: githubError } = req.query;
        if (githubError) {
            console.error(`[GitHub OAuth Error] Access denied: ${githubError}`);
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('GitHub login canceled or failed')}`);
        }

        if (!code) {
            console.error('[GitHub OAuth Error] Missing authorization code');
            return res.redirect(`${clientUrl}/login?error=GitHub authentication failed (missing code)`);
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        const redirectUri = getOAuthRedirectUri(req, 'github');

        console.log(`[GitHub OAuth Code Received] Exchanging code for access token... Callback URI: ${redirectUri}`);

        // Exchange code for token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('[GitHub OAuth Token Error]', tokenData);
            return res.redirect(`${clientUrl}/login?error=Failed to retrieve access token from GitHub`);
        }

        console.log('[GitHub OAuth Token Acquired] Fetching GitHub user profile...');
        // Get GitHub user profile
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'User-Agent': 'HiProfile-App'
            }
        });
        const ghUser = await userRes.json();

        let email = ghUser.email;
        if (!email) {
            // Fetch primary email if private
            const emailRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    'User-Agent': 'HiProfile-App'
                }
            });
            const emails = await emailRes.json();
            if (Array.isArray(emails)) {
                const primaryObj = emails.find(e => e.primary && e.verified) || emails[0];
                if (primaryObj) email = primaryObj.email;
            }
        }

        const githubId = ghUser.id ? ghUser.id.toString() : '';
        const fullName = ghUser.name || ghUser.login || 'GitHub User';
        const picture = ghUser.avatar_url || '';

        if (!email) {
            console.error('[GitHub OAuth Error] Email missing from GitHub account');
            return res.redirect(`${clientUrl}/login?error=No email associated with GitHub account`);
        }

        console.log(`[GitHub OAuth Profile Fetched] email=${email}, githubId=${githubId}`);

        let user = await User.findOne({ $or: [{ githubId }, { email: email.toLowerCase() }] });

        if (user) {
            console.log(`[GitHub OAuth Login] Found existing user: ${user.email}`);
            if (!user.githubId) user.githubId = githubId;

            // Ensure Profile document exists
            let profile = await Profile.findOne({ userId: user._id });
            if (!profile) {
                profile = await Profile.create({
                    userId: user._id,
                    username: user.username,
                    profileImage: picture || ''
                });
            } else if (!profile.profileImage && picture) {
                profile.profileImage = picture;
                await profile.save();
            }

            const existingProvider = user.authenticationProviders.find(p => p.provider === 'github');
            if (!existingProvider) {
                user.authenticationProviders.push({
                    provider: 'github',
                    providerId: githubId,
                    linkedAt: new Date()
                });
            }

            user.emailVerified = true;
            user.accountStatus = 'active';
            user.lastLogin = new Date();

            const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
            const { accessToken, refreshToken } = generateTokens(user, sessionId);
            const clientInfo = getClientInfo(req);

            await RefreshToken.create({
                userId: user._id,
                tokenHash: hashToken(refreshToken),
                sessionId,
                device: clientInfo.device,
                browser: clientInfo.browser,
                ip: clientInfo.ip,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            user.loginHistory.push({
                provider: 'github',
                loginTime: new Date(),
                ip: clientInfo.ip,
                device: clientInfo.device,
                browser: clientInfo.browser,
                operatingSystem: clientInfo.operatingSystem,
                sessionId
            });

            await user.save();
            setAuthCookies(res, accessToken, refreshToken);

            const targetStep = (user.onboarding && user.onboarding.isCompleted) ? '/bento' : (user.onboarding?.currentStep || '/upload');
            console.log(`[GitHub OAuth Success] Redirecting user ${user.email} to frontend ${targetStep}`);
            return res.redirect(`${clientUrl}${targetStep}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
        } else {
            console.log(`[GitHub OAuth New User] User ${email} does not exist. Redirecting to /register prefill`);
            const redirectParams = new URLSearchParams({
                oauth: 'github',
                githubId,
                email,
                fullName,
                picture
            });
            return res.redirect(`${clientUrl}/register?${redirectParams.toString()}`);
        }
    } catch (error) {
        console.error('[GitHub Callback Error]', error);
        return res.redirect(`${clientUrl}/login?error=GitHub callback error`);
    }
};

module.exports = {
    checkUsername,
    reserveUsername,
    register,
    verifyEmail,
    resendVerification,
    login,
    refresh,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    getMe,
    googleAuth,
    googleCallback,
    githubAuth,
    githubCallback
};
