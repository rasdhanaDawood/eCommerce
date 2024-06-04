const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }]
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
