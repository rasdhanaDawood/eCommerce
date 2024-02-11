const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        added_at: {
            type: Date,
            required: true

        },
    }],
    created_at: {
        type: Date,
        required: true
    },
    updated_at: {
        type: Date,
        required: true
    }

});

const wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = wishlist;