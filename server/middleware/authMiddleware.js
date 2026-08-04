const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token missing',
            data: null
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'access_secret_key');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists',
                data: null
            });
        }

        if (user.accountStatus === 'suspended' || user.accountStatus === 'locked') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.accountStatus}`,
                data: null
            });
        }

        req.user = user;
        req.sessionId = decoded.sessionId || '';
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token invalid or expired',
            data: null
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'User role not authorized to access this resource',
                data: null
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
