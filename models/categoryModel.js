
const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    toppings: {
        type: Array,
        required: true
    }
});

module.exports = mongoose.model('Category', categorySchema);

