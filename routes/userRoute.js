const express = require('express');
const user_route = express();



user_route.set('view engine', 'ejs');
user_route.set("views", "./views/users");

user_route.use(express.static('public'));

const auth = require('../middleware/auth');

const userCheck = require('../middleware/checkBlocked');

const userController = require("../controllers/userController");
const sendOTP = require('../utils/sendOTP');


user_route.get('/register', auth.isLoggedOut, userController.loadRegister);

user_route.post('/register', sendOTP, userController.postRegister);

user_route.get("/login", auth.isLoggedOut, userController.getUserLogin);

user_route.post("/login", userController.postLogin);

user_route.get('/forget-password', userController.getForgetPassword);

user_route.post('/forget-password', userController.forgetPassword);

user_route.get('/reset-password', userController.getResetPassword);

user_route.post('/reset-password', userController.resetPassword);

user_route.post("/verify", userController.verifyOTP);

user_route.post("/resend-otp", sendOTP, userController.resend);

const populateCart = require('../middleware/populateCartCount');
user_route.use(populateCart);

user_route.get('/home', userController.getHome);

user_route.get("/userAccount", userCheck.isBlocked, userController.userAccount);

user_route.get('/logout', auth.isAuthenticated, userController.logout);

user_route.get('/product', userCheck.isBlocked, userController.viewProduct);

user_route.get('/shop/search', userCheck.isBlocked, userController.searchProduct);

user_route.post('/product', userCheck.isBlocked, userController.addToCart);

user_route.get('/shop', auth.isAuthenticated, userCheck.isBlocked, userController.viewAllProducts);

user_route.get('/cart/:productId', userController.addToCart);

user_route.get('/cart', userController.viewCart)

user_route.delete('/cart/:productId', userController.deleteCartItem);


user_route.get('/about', userCheck.isBlocked, userController.aboutPage);

module.exports = user_route;