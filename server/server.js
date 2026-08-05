// Load environment variables FIRST, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const blockRoutes = require('./routes/blockRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const socialRoutes = require('./routes/socialRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Security & Parser Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Payload Limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Routes (Support both /api/v1/ and /api/ prefixes for maximum compatibility)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/v1/profile-blocks', blockRoutes);
app.use('/api/profile-blocks', blockRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/social', socialRoutes);

app.get('/', (req, res) => {
    res.send('Hi-Profile API is running...');
});

// Connect to DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('\n[Startup] MongoDB connection failed. Express server was NOT started.');
    console.error('[Startup] Resolve the database connection issue and save a file to trigger nodemon restart.\n');
});