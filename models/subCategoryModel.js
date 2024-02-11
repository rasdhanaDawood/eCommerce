
const mongoose = require("mongoose");


const subCategorySchema = new mongoose.Schema({

    sub_category: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('SubCategory', subCategorySchema);

