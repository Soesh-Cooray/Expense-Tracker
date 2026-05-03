const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/users');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
});

const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
    const user = process.env.SMTP_USER || process.env.MAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

    return { host, port, user, pass };
};

const createMailer = () => {
    const { host, port, user, pass } = getSmtpConfig();

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        auth: {
            user,
            pass,
        },
    });
};


router.post('/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ username, password: hashedPassword, name });
        await user.save();
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ 
            message: 'Login successful', 
            token, // Mobile app needs this for protected routes
            user: { id: user._id, username: user.username, name: user.name, imageUrl: user.imageUrl } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ username: normalizedEmail });

        if (!user) {
            return res.json({ message: 'If an account exists for that email, an OTP has been sent.' });
        }

        const otp = String(crypto.randomInt(100000, 1000000));
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        user.resetPasswordOtp = otpHash;
        user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const mailer = createMailer();

        if (!mailer) {
            return res.status(500).json({
                message: 'Email service is not configured on the server',
            });
        }

        const { user: smtpUser } = getSmtpConfig();

        try {
            // Verify SMTP connectivity first to fail fast and provide clearer logs
            try {
                await mailer.verify();
            } catch (verifyError) {
                console.error('SMTP verify failed:', verifyError);
                return res.status(500).json({
                    message: 'SMTP verification failed. Check SMTP settings on the server.',
                });
            }

            await mailer.sendMail({
                from: smtpUser,
                to: normalizedEmail,
                subject: 'Reset your password',
                text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
                html: `
                    <p>You requested a password reset from the smart expense app.</p>
                    <p>Your OTP is: <strong>${otp}</strong></p>
                    <p>This OTP expires in 10 minutes.</p>
                `,
            });
        } catch (mailError) {
            console.error('Password reset email failed:', mailError);
            return res.status(500).json({
                message: 'Failed to send reset email. Check SMTP settings on the server.',
            });
        }

        res.json({ message: 'If an account exists for that email, an OTP has been sent.' });
    } catch (error) {
        console.error('Reset password request failed:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset-password/confirm', async (req, res) => {
    try {
        const { otp, email, password } = req.body;

        if (!otp || !email || !password) {
            return res.status(400).json({ message: 'OTP, email, and new password are required' });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({ message: 'OTP must be a 6-digit code' });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');

        const user = await User.findOne({
            username: normalizedEmail,
            resetPasswordOtp: otpHash,
            resetPasswordOtpExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/change-profile-picture', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Profile image file is required' });
        }

        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ message: 'Cloudinary is not configured on the server' });
        }

        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const uploadedImage = await cloudinary.uploader.upload(base64Image, {
            folder: 'profile-pictures',
            resource_type: 'image',
            public_id: `user-${req.user.id}-${Date.now()}`,
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { imageUrl: uploadedImage.secure_url },
            { returnDocument: 'after' }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile picture updated successfully',
            imageUrl: user.imageUrl,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name && !email) {
            return res.status(400).json({ message: 'At least one field (name or email) is required' });
        }

        const updateData = {};

        if (name) {
            updateData.name = String(name).trim();
        }

        if (email) {
            const normalizedEmail = String(email).trim().toLowerCase();
            const existingUser = await User.findOne({ username: normalizedEmail, _id: { $ne: req.user.id } });

            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }

            updateData.username = normalizedEmail;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
            returnDocument: 'after',
            runValidators: true,
        }).select('-password -resetPasswordOtp -resetPasswordOtpExpires');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
