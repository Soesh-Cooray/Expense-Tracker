const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
    const user = process.env.SMTP_USER || process.env.MAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

    return { host, port, user, pass };
};

const getMissingSmtpVars = () => {
    const { host, user, pass } = getSmtpConfig();
    const missing = [];

    if (!host) missing.push('SMTP_HOST');
    if (!user) missing.push('SMTP_USER');
    if (!pass) missing.push('SMTP_PASS');

    return missing;
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
            user: { id: user._id, username: user.username, name: user.name } 
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

        const { user: smtpUser } = getSmtpConfig();

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

        res.json({ message: 'If an account exists for that email, an OTP has been sent.' });
    } catch (error) {
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

module.exports = router;
