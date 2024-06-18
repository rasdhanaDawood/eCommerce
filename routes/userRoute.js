const express = require("express");
const user_route = express();

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

user_route.use(express.static("public"));

const auth = require("../middleware/auth");

const invoice = require("../utils/invoice");

const userCheck = require("../middleware/checkBlocked");

const userController = require("../controllers/userController");
const sendOTP = require("../utils/sendOTP");

user_route.get('/', auth.isLoggedOut, userController.getHome);

user_route.get("/register", auth.isLoggedOut, userController.loadRegister);

user_route.post("/register", sendOTP, userController.postRegister);

user_route.get("/login", auth.isLoggedOut, userController.getUserLogin);

user_route.post("/login", userController.postLogin);

user_route.get("/forget-password", userController.getForgetPassword);

user_route.post("/forget-password", userController.forgetPassword);

user_route.get("/reset-password", userController.getResetPassword);

user_route.post("/reset-password", userController.resetPassword);

user_route.get("/change-password", userController.getChangePassword);

user_route.post("/change-password", userController.changePassword);

user_route.post("/verify", userController.verifyOTP);

user_route.post("/resend-otp", sendOTP, userController.resend);

const populateCart = require("../middleware/populateCartCount");
user_route.use(populateCart);

user_route.get(
  "/home",
  auth.isAuthenticated,
  userCheck.isBlocked,
  userController.getHome
);

user_route.get("/userProfile", userCheck.isBlocked, userController.userProfile);

user_route.get("/userAccount", userCheck.isBlocked, userController.userAccount);

user_route.post("/userAccount", userCheck.isBlocked, userController.addDetails);

user_route.get(
  "/addNewAddress",
  userCheck.isBlocked,
  userController.getNewAddress
);

user_route.post(
  "/addNewAddress",
  userCheck.isBlocked,
  userController.addNewAddress
);

user_route.get("/addAddress", userCheck.isBlocked, userController.getAddress);

user_route.post("/addAddress", userCheck.isBlocked, userController.addAddress);

user_route.get(
  "/deleteAddress",
  userCheck.isBlocked,
  userController.deleteAddress
);

user_route.get("/logout", auth.isAuthenticated, userController.logout);

user_route.post("/product", userCheck.isBlocked, userController.addToCart);

user_route.get(
  "/cart/:productId",
  userCheck.isBlocked,
  userController.addToCart
);

user_route.get(
  "/cart",
  auth.isAuthenticated,
  userCheck.isBlocked,
  userController.viewCart
);

user_route.delete(
  "/cart/:productId",
  userCheck.isBlocked,
  userController.deleteCartItem
);

user_route.post("/cart", userCheck.isBlocked, userController.updateCart);

user_route.get(
  "/addToCart",
  userCheck.isBlocked,
  userController.wishlistToCart
);
user_route.get("/checkout", userController.proceedCheckout);

user_route.post("/checkout", userController.placeOrder);

user_route.get("/applyCoupon", userController.applyCoupon);

user_route.get("/removeCoupon", userController.removeCoupon);

user_route.get("/orderPage", userController.viewOrder);

user_route.post("/cashOnDelivery", userController.cashOnDelivery);

user_route.post("/onlinePayment", userController.onlinePayment);

user_route.post("/walletPayment", userController.walletPayment);

user_route.get("/generate-invoice", invoice);

user_route.get("/viewOrder", userController.viewOrderDetails);

user_route.get("/orderSuccess", userController.successOrder);

user_route.get("/walletSuccess", userController.successOrderWallet);

user_route.get("/success", userController.successPage);

user_route.get("/cancel", userController.cancelPage);

user_route.post("/cancelProduct", userController.cancelProduct);

user_route.get("/cancelAllProducts", userController.cancelAllProducts);

user_route.get("/wishlist", userController.viewWishlist);

user_route.get("/addToWishlist", userController.addToWishlist);

user_route.get("/deleteItem", userController.deleteWishlistItem);

user_route.get("/clearWishlist", userController.deleteAllWishlist);

user_route.get("/listOrders", userController.listOrders);

user_route.get("/wallet", userController.wallet);

user_route.get("/about", userCheck.isBlocked, userController.aboutPage);

user_route.get("/contact", userCheck.isBlocked, userController.contactPage);

module.exports = user_route;
