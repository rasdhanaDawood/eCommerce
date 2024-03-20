const Cart = require("../models/cartModel");

const populateCart = async (req, res, next) => {
    try {
        if (!req.session.user) {
            res.redirect('/login');
        }
        const userId = req.session.user._id;
        if (userId) {
            const cart = await Cart.findOne({ user: userId });
            if (cart) {
                // Set cart data in the response locals
                res.locals.cartItemCount = cart.cartItems.length;
            } else {
                res.locals.cartItemCount = 0;
            }
        } else {
            res.locals.cartItemCount = 0;
        }
        next();
    } catch (error) {
        console.error('Error populating cart:', error);
        next(error);
    }
};

module.exports = populateCart;