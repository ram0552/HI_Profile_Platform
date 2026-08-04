const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.MAIL_SERVER || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_USE_TLS === 'false' ? false : (Number(process.env.MAIL_PORT) === 465),
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
        }
    });
};

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = createTransporter();
        const from = process.env.EMAIL_FROM || process.env.MAIL_USERNAME || 'noreply@hiprofile.bio';
        const mailOptions = {
            from: `"HiProfile" <${from}>`,
            to,
            subject,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
        // Do not crash execution if SMTP credentials fail in development environment
        return null;
    }
};

const sendVerificationEmail = async (email, fullName, verificationLink) => {
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="color: #3B82F6; font-size: 28px; font-weight: 800;">hiprofile</span>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify your email address</h2>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
                Hello ${fullName},<br><br>
                Thank you for creating an account on HiProfile. Please click the button below to verify your email address and activate your account.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
                <a href="${verificationLink}" style="background-color: #3B82F6; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 8px; display: inline-block; font-size: 15px;">Verify Email Address</a>
            </div>
            <p style="color: #6B7280; font-size: 13px; line-height: 1.4; margin-bottom: 16px;">
                If the button above doesn't work, copy and paste this URL into your web browser:<br>
                <a href="${verificationLink}" style="color: #3B82F6; word-break: break-all;">${verificationLink}</a>
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
                This link will expire in 24 hours. If you did not request this, please ignore this email.
            </p>
        </div>
    </div>
    `;
    return sendEmail({ to: email, subject: 'Verify your HiProfile Account', html });
};

const sendPasswordResetOtpEmail = async (email, otp) => {
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="color: #3B82F6; font-size: 28px; font-weight: 800;">hiprofile</span>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Reset Your Password</h2>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                We received a request to reset your password for your HiProfile account. Use the OTP code below to set a new password:
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <div style="background-color: #F3F4F6; border: 2px dashed #3B82F6; border-radius: 8px; padding: 16px 24px; display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #111827;">
                    ${otp}
                </div>
            </div>
            <p style="color: #6B7280; font-size: 13px; line-height: 1.4; margin-bottom: 16px;">
                This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
                If you did not request a password reset, please secure your account immediately.
            </p>
        </div>
    </div>
    `;
    return sendEmail({ to: email, subject: 'HiProfile Password Reset OTP', html });
};

const sendPasswordChangedEmail = async (email, fullName) => {
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="color: #3B82F6; font-size: 28px; font-weight: 800;">hiprofile</span>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Successfully Changed</h2>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                Hello ${fullName},<br><br>
                Your HiProfile account password has been successfully updated. All active sessions have been invalidated for security.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
                If you did not perform this change, please contact support immediately.
            </p>
        </div>
    </div>
    `;
    return sendEmail({ to: email, subject: 'Your HiProfile Password Has Been Changed', html });
};

const sendAccountLockedEmail = async (email, fullName) => {
    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="color: #EF4444; font-size: 28px; font-weight: 800;">hiprofile</span>
            </div>
            <h2 style="color: #DC2626; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Account Temporarily Locked</h2>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                Hello ${fullName},<br><br>
                Your HiProfile account has been temporarily locked due to 5 consecutive failed login attempts.
            </p>
            <p style="color: #4B5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                For your security, login access will be restricted for <strong>15 minutes</strong>.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
                If you did not attempt these logins, please reset your password once your lockout period expires.
            </p>
        </div>
    </div>
    `;
    return sendEmail({ to: email, subject: 'Security Notice: Account Temporarily Locked', html });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetOtpEmail,
    sendPasswordChangedEmail,
    sendAccountLockedEmail
};
