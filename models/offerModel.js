// 1. Define the Discount model
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['product', 'category', 'referral'],
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    referral: {
        type: String
    }
});

const ProductOffer = mongoose.model('ProductOffer', offerSchema);
const CategoryOffer = mongoose.model('CategoryOffer', offerSchema);
const ReferralOffer = mongoose.model('ReferralOffer', offerSchema);


module.exports = {
    ProductOffer,
    CategoryOffer
};
