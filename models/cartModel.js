const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }, // Reference to the user who owns the cart
    created_at: {
        type: Date,
        required: true
    },
    cartItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }]
});

const cart = mongoose.model('cart', cartSchema);

module.exports = cart;