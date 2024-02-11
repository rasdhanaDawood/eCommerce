const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: Number,
        required: true
    },
    blocked: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }],
    coupons: Array,
    wallet: {
        type: Number,
        default: 0
    },
    CreatedAt: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model('User', userSchema);