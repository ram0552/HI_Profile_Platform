const { z } = require('zod');

const registerSchema = z.object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must not exceed 30 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
        errorMap: () => ({ message: 'You must accept the terms and conditions' })
    }),
    reservationId: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

const reserveUsernameSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must not exceed 30 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
});

const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const issueMessages = result.error.issues.map(issue => issue.message);
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            data: null,
            errors: issueMessages
        });
    }
    req.validatedBody = result.data;
    next();
};

module.exports = {
    validateRegister: validateBody(registerSchema),
    validateLogin: validateBody(loginSchema),
    validateForgotPassword: validateBody(forgotPasswordSchema),
    validateResetPassword: validateBody(resetPasswordSchema),
    validateReserveUsername: validateBody(reserveUsernameSchema)
};
