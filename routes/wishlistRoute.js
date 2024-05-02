
const express = require('express');
const wishlist_route = express.Router();
const Wishlist = require('../models/wishlistModel');

wishlist_route.get('/:userId', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.params.userId });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

wishlist_route.post('/:userId/add', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.params.userId });
        if (!wishlist) {
            const newWishlist = new Wishlist({
                userId: req.params.userId,
                products: [req.body.productId]
            });
            const savedWishlist = await newWishlist.save();
            res.status(201).json(savedWishlist);
        } else {
            wishlist.products.push(req.body.productId);
            const updatedWishlist = await wishlist.save();
            res.json(updatedWishlist);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

wishlist_route.delete('/:userId/remove/:productId', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.params.userId });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }
        wishlist.products = wishlist.products.filter(product => product != req.params.productId);
        const updatedWishlist = await wishlist.save();
        res.json(updatedWishlist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = wishlist_route;
