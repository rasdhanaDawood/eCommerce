const express = require('express');
const user_route = express();

user_route.set('view engine', 'ejs');
user_route.set("views", "./views/users");

user_route.use(express.static('public'));

const auth = require('../middleware/auth');
const userController = require("../controllers/userController");

const sendOTP = require('../utils/sendOTP');

user_route.get('/home', userController.getHome);

user_route.get('/register', auth.isLoggedOut, userController.loadRegister);

user_route.post('/register', sendOTP, userController.postRegister);

user_route.get("/login", auth.isLoggedOut, userController.getUserLogin);

user_route.post("/login", userController.postLogin);

user_route.get("/verify", userController.getOTP);

user_route.post("/verify", userController.verifyOTP);

user_route.get("/userAccount", userController.userAccount);

user_route.get('/logout', auth.isAuthenticated, userController.logout);

user_route.get('/product', userController.viewProduct);


module.exports = user_route;