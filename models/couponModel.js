const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

    code: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    expiration_date: {
        type: Date,
        required: true
    },
    usage_limit: {
        type: Number,
        required: true
    },
    used_count: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    },
    created_at: {
        type: Date,
        required: true
    },
    updated_at: {
        type: Date,
        required: true
    },
    restrictions: {
        min_purchase_amount: {
            type: Number,
            required: true
        },
        applicable_products: {
            type: Array,
            required: true
        }
    }
});

const coupon = mongoose.model('Coupon', couponSchema);
module.exports = coupon;