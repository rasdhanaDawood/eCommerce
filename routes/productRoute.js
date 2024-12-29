const express = require('express');
const product_route = express();

product_route.set('view engine', 'ejs');
product_route.set("views", "./views/users");

const userCheck = require('../middleware/checkBlocked');

const auth = require('../middleware/auth');

const productController = require("../controllers/productController");

product_route.get('/product', userCheck.isBlocked, productController.viewProduct);

product_route.get('/shop/search', userCheck.isBlocked, productController.searchProduct);

product_route.get('/shop', auth.isAuthenticated, userCheck.isBlocked, productController.viewAllProducts);

module.exports = product_route;
