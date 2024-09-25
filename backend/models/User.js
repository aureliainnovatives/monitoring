// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    console.log(`Updating password${this.password}`);
    if (!this.isModified('password')) {
        console.log(`Password is not modified`);
        return next();
    }
    console.log(`Password is modified`);
    console.log(bcrypt);
    const salt = await bcrypt.genSalt(10);
    console.log(`Salt: ${salt}`);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);
