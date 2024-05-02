const express = require('express');
const sales_route = express.Router();
const Sales = require("../models/salesModel");

// Generate daily sales report
sales_route.get('/daily', async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const dailySales = await Sales.find({ date: { $gte: startOfDay, $lt: endOfDay } });
        res.json(dailySales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate weekly sales report
sales_route.get('/weekly', async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
        const weeklySales = await Sales.find({ date: { $gte: startOfWeek, $lt: endOfWeek } });
        res.json(weeklySales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate yearly sales report
sales_route.get('/yearly', async (req, res) => {
    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
        const yearlySales = await Sales.find({ date: { $gte: startOfYear, $lt: endOfYear } });
        res.json(yearlySales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Generate sales report for custom date range
sales_route.get('/custom', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const customSales = await Sales.find({ date: { $gte: startDate, $lt: endDate } });
        res.json(customSales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = sales_route;
