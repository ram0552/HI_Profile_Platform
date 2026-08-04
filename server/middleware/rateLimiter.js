const rateLimit = require('express-rate-limit');

const formatResponse = (message, code = 'RATE_LIMIT_EXCEEDED') => ({
    success: false,
    code,
    message,
    data: null,
    errors: ['Rate limit exceeded. Please try again later.']
});

const isProd = process.env.NODE_ENV === 'production';

const usernameCheckLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many username check requests. Please try again in 15 minutes.')
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many registration attempts from this IP. Please try again after an hour.')
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many login attempts from this IP. Please try again in 15 minutes.')
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many password reset requests. Please try again in 30 minutes.')
});

const resetPasswordLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many password reset attempts. Please try again in 30 minutes.')
});

const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 15 : 60, // Relaxed in dev to prevent Strict Mode / refresh lockouts
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many verification attempts from this IP. Please wait a few minutes before trying again.', 'RATE_LIMIT_EXCEEDED')
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse('Too many token refresh attempts. Please try again in 15 minutes.')
});

module.exports = {
    usernameCheckLimiter,
    registerLimiter,
    loginLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    verificationLimiter,
    refreshLimiter
};
