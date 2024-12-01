const ejs = require("ejs");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const OTP = require("../models/otpModel");
const Wallet = require("../models/walletModel");
const Cart = require("../models/cartModel");
const Order = require("../models/ordersModel");
const Address = require("../models/addressModel");
const {
  ProductOffer,
  CategoryOffer,
  ReferralOffer,
} = require("../models/offerModel");
const Wishlist = require("../models/wishlistModel");

const PDFDocument = require("pdfkit");

const IP = process.env.IP || '127.0.0.1';
const PORT = process.env.PORT || 8080;

const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;
const stripe = require("stripe")(STRIPE_SECRET_KEY);

const sendResetPasswordmail = async (name, email, token) => {
  try {
    let passwordTransporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let mailOptions = await passwordTransporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Reset Password",
      html: `<p> Hi, ${name}, <a href="http://${IP}:${PORT}/reset-Password?token=${token}"> Please  click here to reset your password</a> `,
    });

    passwordTransporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("mail sent for password reset:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
const bcrypt = require("bcrypt");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};


const getHome = async (req, res) => {
  try {
    const user = req.session.user;
    const productData = await Product.find({ is_Deleted: false });

    return res.render("home", {
      user: user,
      product: productData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    return res.render("register", {
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const postRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      req.flash("errorMessage", "Please fill all fields");
      return res.redirect("/register");
    }
    let userData = await User.findOne({ email });
    if (userData) {
      if (userData.verified === true) {
        req.flash("errorMessage", "User Already Registered!!");
        return res.redirect("/login");
      }
    } else {
      const hashedPassword = await securePassword(req.body.password);
      let user = new User({
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
        email: email,
        phone: phone,
        blocked: 0,
        verified: 0,
        is_admin: 0,
      });
      console.log(user);
      const savedUser = await user.save();
      console.log(`user saved: ${savedUser}`);
      if (!savedUser) {
        req.flash("Something went wrong! User not registered");
        return res.redirect("/register");
      }
    }
    return res.render("verifyOTP", {
      email: email,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getOTP = async (req, res) => {
  try {
    console.log(email);
    return res.render("verifyOTP", {
      email: email,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = req.body.otp;
    if (!email || !otp) {
      req.flash("errorMessage", "Please fill all fields!!");
      return res.render("verifyOTP", {
        email: email,
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
      });
    }
    const userData = await User.findOne({ email: email });
    const userId = userData._id;

    const OTPuser = await OTP.findOne({ email: email });
    if (OTPuser) {
      if (OTPuser.email === email && OTPuser.otp === otp) {
        console.log("verification success");
        const updatedData = await User.findByIdAndUpdate(
          { _id: userId },
          { $set: { verified: true } }
        );

        req.session.user = updatedData;
        req.session.loggedIn = true;
        return res.redirect("/home");
      } else {
        req.flash("errorMessage", "Email and OTP not match");
        return res.render("verifyOTP", {
          email: email,
          errorMessage: req.flash("errorMessage"),
          successMessage: req.flash("successMessage"),
        });
        console.log("Email and otp not match");
      }
    } else {
      req.flash("errorMessage", "Incorrect email or OTP");
      return res.render("verifyOTP", {
        email: email,
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
      });
      console.log("User not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const resend = async (req, res) => {
  try {
    console.log(req.body);
    const { email } = req.body;
    return res.render("verifyOTP", {
      email: email,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const userProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.find({ _id: user }).populate("address");

    return res.render("viewUser", {
      user: userData,
      message: req.flash("message"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const userAccount = async (req, res) => {
  try {
    const addressId = req.query.address;
    const userData = await User.find({ _id: req.session.user }).populate(
      "address"
    );
    console.log(userData);
    console.log(userData.firstName);

    console.log(userData[0].firstName);
    const user = req.session.user;
    return res.render("userAccount", {
      user: userData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addDetails = async (req, res) => {
  try {
    const user = req.session.user;
    console.log(req.body);
    var userData = await User.findOne({ _id: user });
    let addressIds, addressArray, cityArray, stateArray, zipArray;
    if (typeof req.body.address === "string") {
      addressIds = [req.body.id];
      addressArray = [req.body.address];
      cityArray = [req.body.city];
      stateArray = [req.body.state];
      zipArray = [req.body.zip];
    } else {
      addressIds = req.body.id;
      addressArray = req.body.address;
      cityArray = req.body.city;
      stateArray = req.body.state;
      zipArray = req.body.zip;
    }
    for (let i = 0; i < addressArray.length; i++) {
      const addressId = addressIds[i];
      const address = addressArray[i];
      const city = cityArray[i];
      const state = stateArray[i];
      const zip = zipArray[i];
      const addressData = await Address.findOne({ _id: addressId });

      if (addressId && address && city && state && zip) {
        const updatedAddressData = await Address.findOneAndUpdate(
          { _id: addressId },
          { $set: { address: address, city: city, state: state, zip: zip } }
        );
        console.log(updatedAddressData);
      } else {
        console.log("missing address data");
      }
    }
    console.log(userData);
    req.flash("message", "Updation successfull!!");
    return res.redirect("/userProfile");
  } catch (error) {
    console.log(error.message);
  }
};

const getNewAddress = async (req, res) => {
  try {
    const user = req.session.user;
    return res.render("newAddress", {
      user: user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addNewAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;
    const userData = await User.findOne({ _id: user });
    const existingAddress = await Address.findOne({
      address: { $regex: "^" + address + "$", $options: "i" },
    });
    if (existingAddress) {
      req.flash("message", "Address already exists!!");
      return res.redirect("/userProfile");
    }
    let addressDetails = new Address({
      address: address,
      city: city,
      state: state,
      zip: zip,
      user: user,
    });
    const addressData = await addressDetails.save();
    console.log(addressData);
    userData.address.push(addressData);
    await userData.save();
    req.flash("Address added successfully!!");
    return res.redirect("/userProfile");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.query.address;
    const user = req.session.user;
    const addressData = await Address.deleteOne({ _id: addressId });

    const userData = await User.findOneAndUpdate(
      { _id: user },
      { $pull: { address: addressId } }
    );
    if (addressData && userData) {
      console.log("Address deleted from address database");
      req.flash("message", "Address deleted successfully!!");
      return res.redirect("/userProfile");
    } else {
      req.flash("message", "Something went wrong!!");
      return res.redirect("/userProfile");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getUserLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
      });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const postLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.verified === false) {
        req.flash("errorMessage", "Please register your email account!!");
        return res.redirect("/register");
      }
      if (userData.blocked === true) {
        req.flash("errorMessage", "Unable to access your account!!");
        return res.redirect("/login");
      }
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        req.session.user = userData;
        return res.redirect("/home");
      } else {
        req.flash("errorMessage", "Email/password doesnt match!!");
        return res.redirect("/login");
      }
    } else {
      req.flash(
        "errorMessage",
        "User not found!! Please register your account!!"
      );
      return res.redirect("/register");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getForgetPassword = async (req, res) => {
  try {
    return res.render("forgetPassword", {
      message: req.flash("message"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      console.log("User not found");
      req.flash("message", "User not found!!");
      return res.redirect("/forget-password");
    } else {
      const token = randomstring.generate();
      const data = await User.updateOne(
        { email: email },
        { $set: { token: token } }
      );
      sendResetPasswordmail(userData.firstName, userData.email, token);
      console.log("check your mails");
      req.flash(
        "message",
        "Please check your mail for the password reset link!!"
      );
      return res.redirect("/forget-password");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getResetPassword = async (req, res) => {
  try {
    const token = req.query.token;
    console.log(token);

    return res.render("resetPassword", {
      message: req.flash("message"),
      token: token,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = req.body.token;
    const tokenData = await User.find({ token: token });
    if (tokenData) {
      const password = req.body.password;
      const newPassword = await securePassword(password);
      const updatedData = await User.findByIdAndUpdate(
        { _id: tokenData[0]._id },
        { $set: { password: newPassword, token: "" } },
        { new: true }
      );
      console.log("Password updated successfully");
      console.log(updatedData);
      req.session.destroy();
      return res.redirect("/login");
    } else {
      console.log("link expired");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getChangePassword = async (req, res) => {
  try {
    const user = req.session.user;
    return res.render("changePassword", {
      user: user,
      message: req.flash("message"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword;
    const password = req.body.password;
    const userData = await User.find({ _id: req.session.user });
    const comparePassword = await bcrypt.compare(
      currentPassword,
      userData[0].password
    );

    if (comparePassword) {
      const newPassword = await securePassword(password);
      const passwordMatch = await bcrypt.compare(
        userData[0].password,
        newPassword
      );
      if (passwordMatch) {
        req.flash("message", "Please enter a new password");
        return res.redirect("/change-password");
      } else {
        const updatedData = await User.findOneAndUpdate(
          { _id: userData[0]._id },
          { $set: { password: newPassword } },
          { new: true }
        );

        console.log(updatedData);
        console.log("Password updated successfully");
        req.flash("message", "Password changed successfully");
        return res.redirect("/userProfile");
      }
    } else {
      req.flash("message", "Incorrect Password");
      return res.redirect("/change-password");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    console.log(req.params);
    const userId = req.session.user._id;
    console.log(userId);

    const productId = req.params.productId;
    console.log(productId);
    const productData = await Product.find({ _id: productId });
    console.log(productData);
    console.log(productData[0].price);
    if (!productId || !userId) {
      req.flash("message", "Product or User not found");
      return res.redirect("/shop");
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        cartItems: [{ product: productId, quantity: 1 }],
      });
    } else {
      const existingCartItem = cart.cartItems.find((item) =>
        item.product.equals(productId)
      );

      if (existingCartItem) {
        existingCartItem.quantity++;
      } else {
        cart.cartItems.push({ product: productId, quantity: 1 });
      }
    }
    const successCart = await cart.save();
    if (successCart) {
      const updateStock = await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: -1 } }
      );
      console.log("stock updation success");
    }
    req.flash("message", "Product added to cart!!");
    return res.redirect("/shop");
  } catch (error) {
    console.log(error.message);
  }
};

const viewCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ user: userId }).populate(
      "cartItems.product"
    );

    if (!cart || cart.cartItems.length === 0) {
      return res.render("cart", {
        user: userId,
        message: req.flash("message"),
        cartItems: [],
        isEmpty: true,
      });
    }
    const cartItems = cart.cartItems;
    console.log(cartItems);
    console.log(cartItems.length);
    console.log("Cart Items:");
    cartItems.forEach((cartItem, index) => {
      console.log(`Item ${index + 1}:`);
      console.log(`Product ID: ${cartItem.product._id}`);
      console.log(`Product Name: ${cartItem.product.name}`);
      console.log(`Quantity: ${cartItem.quantity}`);
      console.log("----------------------");
    });
    let total = 0;
    // let productOfferAmount = 0;
    // let categoryOfferAmount = 0;
    // let productDiscountPrice = 0;
    // let categoryDiscountPrice = 0;

    let discount = 0;
    for (const cartItem of cartItems) {
      const product = cartItem.product;
      total += cartItem.quantity * product.price;
    }
    console.log(total);

    req.session.total = total;
    return res.render("cart", {
      user: userId,
      message: req.flash("message"),
      cartItems: cartItems,
      total: total,
      finalTotal: total,
      isEmpty: false,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const user = req.session.user;
    const productId = req.params.productId;
    const cartData = await Cart.findOne({ user: user });
    for (const item of cartData.cartItems) {
      if (item.product.toString() == productId) {
        const quantity = item.quantity;
        console.log(quantity);
        const cart = await Cart.findOneAndUpdate(
          { user: req.session.user._id },
          { $pull: { cartItems: { product: productId } } },
          { new: true }
        );
        const addStock = await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { stock: quantity } }
        );
        if (addStock) {
          console.log("stock updated success");
        }
        console.log(cart.cartItems.length);
        res.json(cart);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCart = async (req, res) => {
  try {
    let inStock = true;
    console.log(req.body);
    const { total } = req.body;
    console.log(typeof total);
    req.session.total = total;
    const quantities = {};
    const ids = [];

    for (const key in req.body) {
      if (key.startsWith("quantity_")) {
        const productId = key.replace("quantity_", "");
        quantities[productId] = parseInt(req.body[key], 10);
      }
    }

    console.log("Quantities:", quantities);
    console.log("IDs:", ids);
    const userId = req.session.user._id;

    for (const productId in quantities) {
      const quantity = quantities[productId];
      console.log(quantity);
      const productData = await Product.findOne({ _id: productId });

      if (!productData || productData.stock <= 0) {
        await Cart.updateOne(
          { user: userId },
          { $pull: { cartItems: { product: productId } } }
        );
        inStock = false;
        req.flash("message", "Not enough stock");
        return res.redirect("/cart");
      } else if (productData.stock >= quantity) {
        await Cart.updateOne(
          { user: userId, "cartItems.product": productId },
          { $set: { "cartItems.$.quantity": quantity } }
        );
      }
    }
    if (inStock) {
      return res.redirect("/checkout");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getAddress = async (req, res) => {
  try {
    const user = req.session.user;
    return res.render("addAddress", {
      user: user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;
    const userData = await User.findOne({ _id: user });
    const existingAddress = await Address.findOne({
      address: { $regex: "^" + address + "$", $options: "i" },
    });
    if (existingAddress) {
      req.flash("errorMessage", "Address already exists!!");
      return res.redirect("/checkout");
    }
    let addressDetails = new Address({
      address: address,
      city: city,
      state: state,
      zip: zip,
      user: user,
    });
    const addressData = await addressDetails.save();
    console.log(addressData);
    userData.address.push(addressData);
    await userData.save();
    req.flash("successMessage", "Address added successfully!!");
    return res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
  }
};

const proceedCheckout = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user }).populate("address");
    const productData = await Cart.findOne({ user: user }).populate(
      "cartItems.product"
    );

    if (productData) {
      let cartItems = productData.cartItems;
      let total = req.session.total;
      let discount = 0;
      let couponCode = req.query.coupon || "";

      return res.render("checkout", {
        user: userData,
        product: cartItems,
        total: total,
        coupon: couponCode,
        discount: discount,
        finalTotal: total,
        errorMessage: req.flash("errorMessage"),
      });
    } else {
      return res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { code } = req.query;
    const user = req.session.user;
    const productData = await Cart.findOne({ user: user }).populate(
      "cartItems.product"
    );

    if (productData) {
      let total = parseFloat(req.session.total);
      console.log(typeof total);
      let discount = 0;
      console.log("total", total);

      const coupon = await ReferralOffer.findOne({ active: true, code: code });

      if (coupon) {
        discount = total * (coupon.amount / 100);
      }
      console.log("discount", discount);

      req.session.discount = discount;
      res.json({
        success: true,
        total: total,
        discount: discount,
      });
    } else {
      res.json({ success: false, message: "Cart is empty" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const { code } = req.query;
    const user = req.session.user;
    const productData = await Cart.findOne({ user: user }).populate(
      "cartItems.product"
    );

    if (productData) {
      let total = parseFloat(req.session.total);
      console.log(typeof total);
      var discount;
      console.log("total", total);

      const coupon = await ReferralOffer.findOne({ active: true, code: code });

      if (coupon) {
        discount = 0;
      }
      console.log("discount", discount);

      req.session.discount = discount;
      res.json({
        success: true,
        total: total,
        discount: discount,
      });
    } else {
      res.json({ success: false, message: "Cart is empty" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const placeOrder = async (req, res) => {
  try {
    const user = req.session.user;
    const { address, coupon } = req.body;
    const userData = await User.findOne({ _id: user }).populate("address");
    const productData = await Cart.findOne({ user: user }).populate(
      "cartItems.product"
    );

    if (!address) {
      req.flash("errorMessage", "Please choose an address");
      return res.redirect("/checkout");
    }
    if (productData) {
      let productOfferAmount = 0;
      let categoryOfferAmount = 0;

      var discount = 0;
      for (const cartItem of productData.cartItems) {
        const product = cartItem.product;

        const productOffer = await ProductOffer.findOne({
          active: true,
          product: product._id,
        });
        if (productOffer) {
          productOfferAmount +=
            product.price * (productOffer.amount / 100) * cartItem.quantity;
        }

        const categoryOffer = await CategoryOffer.findOne({
          active: true,
          category: product.category,
        });
        if (categoryOffer) {
          categoryOfferAmount +=
            product.price * (categoryOffer.amount / 100) * cartItem.quantity;
        }
      }
      req.session.productOffer = productOfferAmount;
      req.session.categoryOffer = categoryOfferAmount;
      console.log(productOfferAmount);
      console.log(categoryOfferAmount);

      let total = parseFloat(req.session.total);
      if (req.session.discount) {
        discount = req.session.discount;
      }
      console.log("total:", total);
      console.log("discount:", discount);

      const finalTotal =
        total - discount - productOfferAmount - categoryOfferAmount;
      req.session.amount = finalTotal;
      const order = new Order({
        user: user,
        products: productData.cartItems,
        totalPrice: finalTotal,
        address: address,
      });

      const newOrderData = await order.save();
      const addressData = await newOrderData.populate("address");
      console.log(addressData.address);

      return res.render("orderPage", {
        user: userData,
        address: addressData.address,
        order: newOrderData,
        productOfferAmount: productOfferAmount,
        categoryOfferAmount: categoryOfferAmount,
        discount: discount,
        errorMessage: req.flash("errorMessage"),
      });
    } else {
      req.flash("message", "Cart is empty! Add products");
      return res.redirect("/shop");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrder = async (req, res) => {
  try {
    const user = req.session.user;
    const orderId = req.session.orderId||req.query.orderId;
    const orderData = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate("address")
      .populate("products.product");
    const address = orderData.address;
    const addressData = await Address.findOne({ _id: address._id });
    console.log("address:", addressData);
    var discount = 0;
    if (orderData) {
      if (req.session.discount) {
        discount = req.session.discount;
      }
      console.log(discount);
      console.log(req.session.productOffer);
      console.log(req.session.categoryOffer);

      return res.render("orderPage", {
        user: user,
        order: orderData,
        address: addressData,
        productOfferAmount: req.session.productOffer,
        categoryOfferAmount: req.session.categoryOffer,
        discount: discount,
        errorMessage: req.flash("errorMessage"),
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const cashOnDelivery = async (req, res) => {
  try {
    const user = req.session.user;
    const orderId = req.body.orderId;
    const orderData = await Order.findOne({ _id: orderId });
    if (orderData) {
      const priceData = await Order.findOne({
        _id: orderId,
        totalPrice: { $gt: 1000 },
      });
      if (priceData) {
        req.flash(
          "errorMessage",
          "Cash on delivery is not available for orders above 1000"
        );
        return res.redirect(`/viewOrder?id=${orderId}`);
      }
      const updateData = await Order.findOneAndUpdate(
        { _id: orderId },
        { $set: { payment: "cash" } }
      );
      await Cart.deleteOne({ user: user });
      if (updateData) {
        console.log("payment added to database");
        return res.redirect("/orderSuccess");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const onlinePayment = async (req, res) => {
  try {
    const user = req.session.user;
    let fullName = user.firstName + " " + user.lastName;
    console.log(req.body);
    const orderId = req.body.orderId;
    req.session.orderId = orderId;
    const orderData = await Order.findOne({ _id: orderId, user: user });
    if (orderData) {
      const updateData = await Order.findOneAndUpdate(
        { _id: orderId },
        { $set: { payment: "online" } }
      );
      if (updateData) {
        console.log("payment added to database");
      }
      await Cart.deleteOne({ user: user });

      const populatedData = await Order.findOne({ _id: orderId })
        .populate("user")
        .populate("address")
        .populate("products.product");
      console.log(populatedData);
      const productsList = populatedData.products;
      const productImages = [];

      for (const productList of productsList) {
        const product = productList.product;
        console.log(product);
      }

      stripe.customers
        .create({
          email: user.email,
          name: fullName,
        })
        .then((customer) => {
          console.log(customer);
          return stripe.checkout.sessions
            .create({
              payment_method_types: ["card"],
              line_items: productsList.map((productList, index) => {
                // const images = productImages[index] || [];
                return {
                  price_data: {
                    currency: "inr",
                    product_data: {
                      name: productList.product.name,
                      // images: images.length > 0 ? [images] : []
                    },
                    unit_amount: productList.product.price * 100,
                  },
                  quantity: productList.quantity,
                };
              }),
              mode: "payment",
              customer: customer.id,
              billing_address_collection: "required",
              success_url: `http://${IP}:${PORT}/success`,
              cancel_url: `http://${IP}:${PORT}/cancel`,
            })
            .then((session) => {
              console.log(session);
              return res.redirect(session.url);
            })
            .catch((error) => {
              console.log(error.message);
            });
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const walletPayment = async (req, res) => {
  try {
    const user = req.session.user;
    console.log(req.body);
    const orderId = req.body.orderId;
    req.session.orderId = orderId;
    const orderData = await Order.findOne({ _id: orderId, user: user });
    const userData = await User.findOne({ _id: user });
    if (orderData) {
      const price = orderData.totalPrice;
      if (price >= userData.wallet) {
        req.flash("errorMessage", "No sufficient balance in wallet!!");
        return res.redirect("/orderPage");
      }
      const updatedWalletData = await User.findOneAndUpdate(
        { _id: user },
        { $inc: { wallet: -price } }
      );
      const updateData = await Order.findOneAndUpdate(
        { _id: orderId },
        { $set: { payment: "wallet" } }
      );
      if (updateData) {
        console.log("payment added to database");
      }
      await Cart.deleteOne({ user: user });
      return res.redirect("/walletSuccess");
    } else {
      console.log("order details not found!!");
      req.flash("errorMessage", "Order details not found!!");
      return res.redirect("/orderPage");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const successOrder = async (req, res) => {
  try {
    const user = req.session.user;
    return res.render("successPage", {
      user: user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const successOrderWallet = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    const walletBalance = userData.wallet;
    return res.render("successWallet", {
      user: user,
      balance: walletBalance,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const successPage = async (req, res) => {
  try {
    const user = req.session.user;
    const orderId = req.session.orderId;
    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "Processing" } }
    );
    if (order) {
      console.log("status of order updated");
    }
    const orderData = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate("address")
      .populate("products.product");
    console.log(orderId);

    console.log(orderData);

    if (orderData) {
      return res.render("invoice", {
        orders: orderData,
        user: user,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const cancelPage = async (req, res) => {
  try {
    const orderId = req.session.orderId;
    const user = req.session.user;
    const amount = req.session.amount;
    var deductedAmount = 0;
    const order = await Order.findOne({ _id: orderId }).populate(
      "products.product"
    );
    order.products.forEach((product) => {
      product.productStatus = false;
      console.log(product.product.price);

      console.log(typeof product.product.price);
      console.log(typeof product.quantity);

      deductedAmount +=
        parseFloat(product.product.price) * parseFloat(product.quantity);
    });
    console.log(deductedAmount);
    order.status = "Cancelled";
    await order.save();

    const updateData = await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { wallet: amount } }
    );
    console.log(updateData.wallet);
    if (updateData) {
      req.flash("message", "Payment Failed! Your order cancelled!");
      return res.redirect("/listOrders");
    } else {
      console.log("Wallet not updated");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const cancelProduct = async (req, res) => {
  try {
    const productId = req.body.productId;
    const productIdObject = new mongoose.Types.ObjectId(productId);
    const orderId = req.body.orderId;
    const user = req.session.user;
    const orderData = await Order.findOne({
      _id: orderId,
      user: user,
    }).populate("products.product");
    if (orderData) {
      if (orderData.status == "Shipped") {
        req.flash("message", "Cannot cancel shipped products");
        return res.redirect("/listOrders");
      }
    }
    for (const product of orderData.products) {
      if (product.product.equals(productIdObject)) {
        product.productStatus = false;
        console.log(product.product.price);
        var productOfferAmount = 0;
        var categoryOfferAmount = 0;

        const productOffer = await ProductOffer.findOne({
          active: true,
          product: product.product._id,
        });
        if (productOffer) {
          productOfferAmount +=
            product.product.price *
            (productOffer.amount / 100) *
            product.quantity;
        }
        console.log(productOfferAmount);

        const categoryOffer = await CategoryOffer.findOne({
          active: true,
          category: product.product.category,
        });
        if (categoryOffer) {
          categoryOfferAmount +=
            product.product.price *
            (categoryOffer.amount / 100) *
            product.quantity;
          console.log(categoryOfferAmount);
        }

        orderData.totalPrice -= parseFloat(
          product.product.price * product.quantity +
            productOfferAmount +
            categoryOfferAmount
        );
        try {
          await orderData.save();
          const productData = await Product.findOne({ _id: productId });
          console.log(productData.stock);
          productData.stock += product.quantity;
          console.log(productData.stock);
          await productData.save();
          var flag = 0;
          const updatedOrderData = await Order.findOne({
            _id: orderId,
            user: user,
          }).populate("products.product");
          for (const product of updatedOrderData.products) {
            if ((product.productStatus = true)) {
              flag = 1; break;
            }
          }
          if (flag == 0) {
            orderData.status = "Cancelled";
            await orderData.save();
          }
          console.log(`Status of ${productIdObject} set to false`);
          req.flash("errorMessage", "Product cancelled");
          return res.redirect(`/viewOrder?id=${orderId}`);
        } catch (error) {
          console.error("Error updating product status:", error);
          req.flash(
            "message",
            "Product couldn't be cancelled. Something went wrong."
          );
          return res.redirect("/listOrders");
        }
      }
    }
    req.flash("message", "Order not found");
    return res.redirect("/listOrders");
  } catch (error) {
    console.log(error.message);
  }
};

const cancelAllProducts = async (req, res) => {
  try {
    const user = req.session.user;
    const orderId = req.query.orderId;
    const orderData = await Order.findOne({ _id: orderId });
    console.log(orderData.totalPrice);
    if (orderData) {
      if (orderData.status == "Shipped") {
        req.flash("message", "Cannot cancel shipped products");
        return res.redirect("/listOrders");
      }
      if (orderData.status == "Delivered") {
        const updateData = await User.findOneAndUpdate(
          { _id: user._id },
          { $inc: { wallet: orderData.totalPrice } }
        );
        const orderUpdateData = await Order.findOneAndUpdate(
          { user: user, _id: orderId },
          { status: "Returned" }
        );
        console.log(updateData.wallet);
        console.log(orderUpdateData.status);
        console.log("Order returned");
        req.flash(
          "message",
          "Order returned!!Amount credited to your account!!"
        );
        return res.redirect("/listOrders");
      }
      const updateData = await Order.findOneAndUpdate(
        { user: user, _id: orderId },
        { status: "Cancelled" }
      );
      const walletData = await User.findOneAndUpdate(
        { _id: user._id, payment: "online" },
        { $inc: { wallet: orderData.totalPrice } }
      );
      if (updateData) {
        console.log("Order cancelled");
        req.flash("message", "Order cancelled!!");
        return res.redirect("/listOrders");
      } else {
        req.flash("message", "Order couldn't cancelled!!");
        return res.redirect("/listOrders");
      }
    } else {
      req.flash("message", "Order not found!!");
      return res.redirect("/listOrders");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewWishlist = async (req, res) => {
  try {
    const user = req.session.user;
    const productData = await Wishlist.findOne({ user: user }).populate(
      "items.product"
    );
    if (!productData || productData.items.length === 0) {
      return res.render("wishlist", {
        user: user,
        message: req.flash("message"),
        wishlistItems: [],
        isEmpty: true,
      });
    }
    if (productData) {
      return res.render("wishlist", {
        user: user,
        wishlistItems: productData,
        message: req.flash("message"),
        isEmpty: false,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const user = req.session.user;
    const productId = req.query.id;
    const wishlistItem = {
      product: productId,
      quantity: 1,
    };
    console.log(wishlistItem);

    if (user) {
      let wishlistData = await Wishlist.findOne({ user: user._id });
      if (!wishlistData) {
        wishlistData = new Wishlist({
          user: user,
          items: [wishlistItem],
        });
        console.log(wishlistData);
      } else {
        const existingItem = wishlistData.items.find((item) =>
          item.product.equals(productId)
        );
        console.log(existingItem);

        if (existingItem) {
          existingItem.quantity++;
        } else {
          wishlistData.items.push(wishlistItem);
          console.log(wishlistData);
        }
      }
      await wishlistData.save();
      console.log(wishlistData);
      const newData = await wishlistData.populate("items.product");
      if (newData) {
        return res.render("wishlist", {
          user: user,
          wishlistItems: newData,
          message: req.flash("message"),
          isEmpty: false,
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const wishlistToCart = async (req, res) => {
  try {
    console.log(req.query);
    const userId = req.session.user._id;
    console.log(userId);

    const productId = req.query.productId;
    console.log(productId);
    const productData = await Product.findOne({ _id: productId });
    console.log(productData);
    console.log(productData.price);
    if (!productId || !userId) {
      req.flash("message", "Product or User not found");
      return res.redirect("/wishlist");
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        cartItems: [{ product: productId, quantity: 1 }],
      });
    } else {
      const existingCartItem = cart.cartItems.find((item) =>
        item.product.equals(productId)
      );

      if (existingCartItem) {
        existingCartItem.quantity++;
      } else {
        cart.cartItems.push({ product: productId, quantity: 1 });
      }
    }
    const successCart = await cart.save();
    if (successCart) {
      const removeFromWishlist = await Wishlist.findOneAndUpdate(
        { user: userId },
        { $pull: { items: { product: productId } } }
      );
      if (removeFromWishlist) {
        console.log("Item removed from wishlist");
      }
      const updateStock = await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: -1 } }
      );
      if (updateStock) {
        console.log("stock updation success");
      }
    }
    req.flash("message", "Product added to cart!!");
    return res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteWishlistItem = async (req, res) => {
  try {
    const user = req.session.user._id;
    const productId = req.query.productId;
    const products = await Wishlist.findOne({
      user: user,
    });
    var deletedData;
    if (products) {
      for (const item of products.items) {
        if (item.product.toString() == productId) {
          deletedData = await Wishlist.findOneAndUpdate(
            { user: user },
            { $pull: { items: { product: productId } } }
          );
        }
      }
    }
    if (deletedData) {
      console.log("item deleted from wishlist");
      req.flash("message", "Item cleared from Wishlist!!");
      return res.redirect("/wishlist");
    } else {
      req.flash("message", "Product not found!!");
      return res.redirect("/wishlist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAllWishlist = async (req, res) => {
  try {
    const user = req.session.user;
    const wishlistData = await Wishlist.findOne({ user: user });
    if (wishlistData) {
      const deletedData = await Wishlist.deleteOne({ user: user });
      if (deletedData) {
        console.log("wishlist deleted");
        req.flash("message", "Deleted all products from wishlist");
        return res.redirect("/shop");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listOrders = async (req, res) => {
  try {
    const user = req.session.user;
    const allOrdersData = await Order.find({ user: user })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("address");
    if (allOrdersData) {
      for (const order of allOrdersData) {
        if (order.status == "Cancelled") {
          for (const product of order.products) {
            product.productStatus = false;
          }
        }
      }

      await allOrdersData.save;

      var flag = false;
      for (const order of allOrdersData) {
        for (const product of order.products) {
          if (product.productStatus == true) {
            flag = true;
          }
        }
        if (flag == false) {
          order.status = "Cancelled";
        }
      }

      await allOrdersData.save;
      return res.render("listOrders", {
        user: user,
        order: allOrdersData,
        message: req.flash("message"),
      });
    } else {
      req.flash("message", "No Orders Data Available");
      return res.redirect("/viewUser");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrderDetails = async (req, res) => {
  try {
    const user = req.session.user;
    const orderId = req.query.id;
    const orderDetails = await Order.findOne({
      _id: orderId,
      user: user,
    })
      .populate("user")
      .populate("address")
      .populate("products.product");

    console.log(orderDetails);
    console.log(orderDetails.address);
    req.session.amount = orderDetails.totalPrice;
    return res.render("viewOrderDetails", {
      user: user,
      order: orderDetails,
      successMessage: req.flash("successMessage"),
      errorMessage: req.flash("errorMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const wallet = async (req, res) => {
  try {
    const user = req.session.user;
    const order = await Order.find({
      user: user,
      status: "Cancelled",
    }).populate("products.product");
    return res.render("wallet", {
      user: user,
      order: order,
      message: req.flash("message"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const aboutPage = async (req, res) => {
  try {
    const userData = req.session.user;
    return res.render("about", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const contactPage = async (req, res) => {
  try {
    const userData = req.session.user;
    return res.render("contact", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    return res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getHome,
  loadRegister,
  postRegister,
  getUserLogin,
  postLogin,
  getForgetPassword,
  forgetPassword,
  getResetPassword,
  resetPassword,
  getChangePassword,
  changePassword,
  getOTP,
  verifyOTP,
  resend,
  userProfile,
  userAccount,
  addDetails,
  getNewAddress,
  addNewAddress,
  deleteAddress,
  viewCart,
  updateCart,
  proceedCheckout,
  placeOrder,
  applyCoupon,
  removeCoupon,
  viewOrder,
  cashOnDelivery,
  onlinePayment,
  walletPayment,
  cancelPage,
  successOrder,
  successOrderWallet,
  successPage,
  cancelProduct,
  cancelAllProducts,
  viewWishlist,
  addToWishlist,
  wishlistToCart,
  deleteWishlistItem,
  deleteAllWishlist,
  deleteCartItem,
  getAddress,
  addAddress,
  addToCart,
  aboutPage,
  contactPage,
  listOrders,
  viewOrderDetails,
  wallet,
  logout,
};
