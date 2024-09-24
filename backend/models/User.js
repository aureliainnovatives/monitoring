// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: false
    },
    keywords: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Keyword',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
        default: null,
    },
    lastNotifiedAt: { type: Date, default: null },  // This tracks when the last email was sent

});

// Hash the password before saving the user
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    console.log(`Updating password${this.password} and salt: ${salt}`);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log(`Hashed password: ${hashedPassword}`);
    this.password = hashedPassword;
    console.log(this.password);
    next();
});

module.exports = mongoose.model('User', UserSchema);
