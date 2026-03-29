const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true, unique: true },
    isVerified: { type: Boolean, default: false },
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    verificationCode: { type: Number },
});

const User = mongoose.model('User', userSchema);

module.exports = User;