
const mongoose = require("mongoose");

const db = async () => {
    try {
        const con = await mongoose.connect("mongodb+srv://rasdhana:Sairabanu903@cluster0.rcca6um.mongodb.net/Project1");
        console.log(`MongoDB connected: ${con.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error}`);
    }
};

module.exports = db;