require('dotenv').config();

const mongoose = require("mongoose");

const db = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`MongoDB connected: ${con.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error}`);
    }
};

module.exports = db;