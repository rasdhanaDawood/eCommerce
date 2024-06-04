const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        productStatus: {
            type: Boolean,
            default: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: 'Pending',
    },
    payment: {
        type: String,
        enum: ['cash', 'online']
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const order = mongoose.model('Order', orderSchema);

module.exports = order;