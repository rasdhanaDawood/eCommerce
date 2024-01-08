const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    short_description: {
        type: String,
        required: true
    },
    detail_description: {
        type: String,
        required: true
    },
    is_Featured: {
        type: Boolean,
        required: true
    },
    is_Deleted: {
        type: Boolean,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    stock: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);