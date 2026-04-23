const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true, lowercase: true},
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false},
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpires: { type: Date },
    imageUrl:{type:String}
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;