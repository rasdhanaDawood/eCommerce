// const pdf = require('pdf-creator-node')
const fs = require('fs');
const path = require('path');
const User = require("../models/userModel");
const Product = require("../models/productModel");
const OTP = require("../models/otpModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Order = require("../models/ordersModel");
const Address = require("../models/addressModel");
const { ProductOffer, CategoryOffer, ReferralOffer } = require("../models/offerModel");
const Wishlist = require("../models/wishlistModel");
const options = require('../middleware/options');
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');

const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;
const stripe = require('stripe')(STRIPE_SECRET_KEY)

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
                rejectUnauthorized: false
            }
        });

        let mailOptions = await passwordTransporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: "Reset Password",
            html: `<p> Hi, ${name}, <a href="http://127.0.0.1:3000/reset-Password?token=${token}"> Please  click here to reset your password</a> `
        });

        passwordTransporter.sendMail(mailOptions, function (error, info) {

            if (error) {
                console.log(error);
            }
            else {
                console.log("mail sent for password reset:", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}
const bcrypt = require('bcrypt');

const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

const getHome = async (req, res) => {
    try {
        const user = req.session.user;
        const productData = await Product.find({ is_Deleted: false });

        res.render('home', {
            user: user,
            product: productData
        });
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('register', {
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')

        });
    } catch (error) {
        console.log(error.message);
    }
}

const postRegister = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            req.flash("errorMessage", "Please fill all fields");
            res.redirect('/register')
        }
        let userData = await User.findOne({ email });
        if (userData) {
            if (userData.verified === true) {
                req.flash('errorMessage', "User Already Registered!!");
                res.redirect('/login');
            }
        }
        else {
            const hashedPassword = await securePassword(req.body.password);
            let user = new User({
                firstName: firstName,
                lastName: lastName,
                password: hashedPassword,
                email: email,
                phone: phone,
                blocked: 0,
                verified: 0,
                is_admin: 0
            });
            console.log(user);
            const savedUser = await user.save();
            console.log(`user saved: ${savedUser}`);
            if (!savedUser) {
                req.flash('Something went wrong! User not registered')
                res.redirect("/register")
            }
        }
        res.render('verifyOTP', {
            email: email,
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')
        });
    } catch (error) {
        console.log(error.message);
    }

}

const getOTP = async (req, res) => {
    try {
        console.log(email);
        res.render('verifyOTP', {
            email: email,
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')
        });
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOTP = async (req, res) => {
    try {
        const email = req.body.email;
        const otp = req.body.otp;
        if (!email || !otp) {
            req.flash("errorMessage", "Please fill all fields!!");
            res.render('verifyOTP', {
                email: email,
                errorMessage: req.flash('errorMessage'),
                successMessage: req.flash('successMessage')
            });
        }
        const userData = await User.findOne({ email: email });
        const userId = userData._id;

        const OTPuser = await OTP.findOne({ email: email });
        if (OTPuser) {

            if (OTPuser.email === email && OTPuser.otp === otp) {

                console.log("verification success");
                const updatedData = await User.findByIdAndUpdate({ _id: userId }, { $set: { verified: true } });
                const productData = await Product.find({});
                const user_id = updatedData._id;

                req.session.user = user_id;
                req.session.loggedIn = true;
                res.redirect("/home");
            }
            else {
                req.flash("errorMessage", "Email and OTP not match");
                res.render('verifyOTP', {
                    email: email,
                    errorMessage: req.flash('errorMessage'),
                    successMessage: req.flash('successMessage')
                });
                console.log("Email and otp not match")
            }
        }

        else {
            req.flash("errorMessage", "Incorrect email or OTP");
            res.render('verifyOTP', {
                email: email,
                errorMessage: req.flash('errorMessage'),
                successMessage: req.flash('successMessage')
            });
            console.log("User not found");
        }
    } catch (error) {
        console.log(error.message);
    }
}
const resend = async (req, res) => {
    try {
        console.log(req.body);
        const { email } = req.body
        res.render('verifyOTP', {
            email: email,
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')
        });

    } catch (error) {
        console.log(error.message);
    }
}

const userProfile = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.find({ _id: user }).populate('address');

        res.render('viewUser', {
            user: userData,
            message: req.flash('message')
        });

    } catch (error) {
        console.log(error.message);
    }
}

const userAccount = async (req, res) => {
    try {
        const addressId = req.query.address;
        const userData = await User.find({ _id: req.session.user }).populate('address');
        console.log(userData);
        console.log(userData.firstName)

        console.log(userData[0].firstName)
        const user = req.session.user;
        res.render('userAccount', {
            user: userData
        });
    } catch (error) {
        console.log(error.message);
    }
}

const addDetails = async (req, res) => {
    try {
        const user = req.session.user;
        console.log(req.body);
        var userData = await User.findOne({ _id: user });
        let addressIds, addressArray, cityArray, stateArray, zipArray;
        if (typeof req.body.address === 'string') {
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
            const addressId = addressIds[i]
            const address = addressArray[i];
            const city = cityArray[i];
            const state = stateArray[i];
            const zip = zipArray[i];
            const addressData = await Address.findOne({ _id: addressId });

            if (addressId && address && city && state && zip) {
                const updatedAddressData = await Address.findOneAndUpdate({ _id: addressId }, { $set: { address: address, city: city, state: state, zip: zip } });
                console.log(updatedAddressData)
            } else {
                console.log("missing address data");
            }
        }
        console.log(userData);
        req.flash("message", "Updation successfull!!");
        res.redirect("/userProfile");
    }
    catch (error) {
        console.log(error.message);
    }
}

const getNewAddress = async (req, res) => {
    try {
        const user = req.session.user;
        res.render("newAddress", {
            user: user
        });

    } catch (error) {
        console.log(error.message);
    }
}

const addNewAddress = async (req, res) => {
    try {
        const user = req.session.user;
        const address = req.body.address;
        const city = req.body.city;
        const state = req.body.state;
        const zip = req.body.zip;
        const userData = await User.findOne({ _id: user })
        const existingAddress = await Address.findOne({ address: { $regex: '^' + address + '$', $options: 'i' } })
        if (existingAddress) {
            req.flash("message", "Address already exists!!")
            res.redirect("/userProfile")
        }
        let addressDetails = new Address({
            address: address,
            city: city,
            state: state,
            zip: zip,
            user: user
        });
        const addressData = await addressDetails.save();
        console.log(addressData)
        userData.address.push(addressData);
        await userData.save();
        req.flash("Address added successfully!!");
        res.redirect("/userProfile");

    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.query.address;
        const user = req.session.user;
        const addressData = await Address.deleteOne({ _id: addressId });

        const userData = await User.findOneAndUpdate({ _id: user }, { $pull: { address: addressId } });
        if (addressData && userData) {
            console.log("Address deleted from address database");
            req.flash("message", "Address deleted successfully!!");
            res.redirect("/userProfile")
        } else {
            req.flash("message", "Something went wrong!!");
            res.redirect("/userProfile")
        }
    } catch (error) {
        console.log(error.message)
    }
}

const getUserLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            res.render('login', {
                errorMessage: req.flash("errorMessage"),
                successMessage: req.flash("successMessage")
            });
        }
        else {
            res.redirect('/home');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const postLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.verified === false) {
                req.flash('errorMessage', "Please register your email account!!")
                res.redirect('/register');
            }
            if (userData.blocked === true) {
                req.flash('errorMessage', 'Unable to access your account!!')
                res.redirect('/login');
            }
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {

                req.session.user = userData;
                res.redirect('/home');

            } else {
                req.flash("errorMessage", "Email/password doesnt match!!");
                res.redirect('/login');
            }

        }
        else {
            req.flash("errorMessage", "User not found!! Please register your account!!");
            res.redirect('/register');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getForgetPassword = async (req, res) => {
    try {
        res.render('forgetPassword', {
            message: req.flash('message')
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const userData = await User.findOne({ email })
        if (!userData) {
            console.log("User not found");
            req.flash("message", "User not found!!");
            res.redirect('/forget-password');
        }
        else {
            const token = randomstring.generate();
            const data = await User.updateOne({ email: email }, { $set: { token: token } });
            sendResetPasswordmail(userData.firstName, userData.email, token);
            console.log("check your mails");
            req.flash("message", "Please check your mail for the password reset link!!");
            res.redirect('/forget-password');
        }
    }
    catch (error) {
        console.log(error.message)
    }
}

const getResetPassword = async (req, res) => {
    try {
        const token = req.query.token;
        console.log(token)

        res.render("resetPassword", {
            message: req.flash('message'),
            token: token
        });


    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {

        const token = req.body.token;
        const tokenData = await User.find({ token: token })
        if (tokenData) {
            const password = req.body.password;
            const newPassword = await securePassword(password);
            const updatedData = await User.findByIdAndUpdate({ _id: tokenData[0]._id }, { $set: { password: newPassword, token: "" } }, { new: true });
            console.log("Password updated successfully");
            console.log(updatedData)
            req.session.destroy();
            res.redirect("/login");
        } else {
            console.log("link expired");
        }

    } catch (error) {
        console.log(error.message);
    }
}

const getChangePassword = async (req, res) => {
    try {
        const user = req.session.user;
        res.render("changePassword", {
            user: user,
            message: req.flash('message')
        });
    } catch (error) {
        console.log(error.message);
    }
}

const changePassword = async (req, res) => {
    try {
        const currentPassword = req.body.currentPassword;
        const password = req.body.password;
        const userData = await User.find({ _id: req.session.user });
        const comparePassword = await bcrypt.compare(currentPassword, userData[0].password)

        if (comparePassword) {
            const newPassword = await securePassword(password);
            const passwordMatch = await bcrypt.compare(userData[0].password, newPassword);
            if (passwordMatch) {
                req.flash("message", "Please enter a new password")
                res.redirect("/change-password");
            }
            else {
                const updatedData = await User.findOneAndUpdate({ _id: userData[0]._id }, { $set: { password: newPassword } }, { new: true });

                console.log(updatedData)
                console.log("Password updated successfully");
                req.flash("message", "Password changed successfully")
                res.redirect("/userProfile");
            }
        } else {
            req.flash("message", "Incorrect Password");
            res.redirect("/change-password");
        }

    } catch (error) {
        console.log(error.message);
    }
}


const addToCart = async (req, res) => {
    try {
        console.log(req.params);
        const userId = req.session.user._id;
        console.log(userId);

        const productId = req.params.productId;
        console.log(productId);
        const productData = await Product.find({ _id: productId });
        console.log(productData);
        console.log(productData[0].price)
        if (!productId || !userId) {
            return res.status(404).json({ message: 'Product or User not found' });
        }


        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                cartItems: [{ product: productId, quantity: 1 }]
            });
        } else {
            const existingCartItem = cart.cartItems.find(item => item.product.equals(productId));

            if (existingCartItem) {
                existingCartItem.quantity++;
            } else {
                cart.cartItems.push({ product: productId, quantity: 1 });
            }
        }
        await cart.save();

        res.redirect("back");
    } catch (error) {
        console.log(error.message);
    }
}

const viewCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');

        if (!cart || cart.cartItems.length === 0) {
            res.render('cart', {
                user: userId,
                message: req.flash("message"),
                cartItems: [],
                isEmpty: true
            });
        }
        const cartItems = cart.cartItems;
        console.log(cartItems);
        console.log(cartItems.length);
        console.log('Cart Items:');
        cartItems.forEach((cartItem, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`Product ID: ${cartItem.product._id}`);
            console.log(`Product Name: ${cartItem.product.name}`);
            console.log(`Quantity: ${cartItem.quantity}`);
            console.log('----------------------');
        });
        res.render('cart', {
            user: userId,
            message: req.flash("message"),
            cartItems: cartItems,
            isEmpty: false
        })
    }
    catch (error) {
        console.log(error.message);
    }
}

const deleteCartItem = async (req, res) => {
    try {
        const productId = req.params.productId;
        const cart = await Cart.findOneAndUpdate(
            { user: req.session.user._id },
            { $pull: { cartItems: { product: productId } } },
            { new: true }
        );
        console.log(cart.cartItems.length);
        res.json(cart);
    }
    catch (error) {
        console.log(error.message);
    }
}

const updateCart = async (req, res) => {
    try {
        let inStock = true;
        console.log(req.body);
        const quantities = {};
        const ids = [];

        for (const key in req.body) {
            if (key.startsWith('quantity_')) {
                const productId = key.replace('quantity_', '');
                quantities[productId] = parseInt(req.body[key], 10);
            }
        }

        console.log('Quantities:', quantities);
        console.log('IDs:', ids);
        const userId = req.session.user._id;

        for (const productId in quantities) {
            const quantity = quantities[productId];
            console.log(quantity)
            const productData = await Product.findOne({ _id: productId });

            if (!productData || productData.stock <= 0) {
                await Cart.updateOne(
                    { user: userId },
                    { $pull: { cartItems: { product: productId } } }
                );
                inStock = false;
                req.flash("message", "Not enough stock");
                res.redirect("/cart");
            } else if (productData.stock >= quantity) {
                await Cart.updateOne(
                    { user: userId, 'cartItems.product': productId },
                    { $set: { 'cartItems.$.quantity': quantity } }
                );
            }
        }
        if (inStock) {
            res.redirect("/checkout");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const proceedCheckout = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ _id: user }).populate('address');
        const productData = await Cart.findOne({ user: user }).populate('cartItems.product');
        if (productData) {
            console.log(productData.cartItems);
            let cartItems = productData.cartItems;
            console.log(cartItems[0].product);
            let total = 0;
            for (const cartItem of cartItems) {
                console.log(`Product Stock(before): ${cartItem.product.stock}`);
                console.log(`Product ID: ${cartItem.product._id}`);
                console.log(`Product Name: ${cartItem.product.name}`);
                console.log(`Quantity: ${cartItem.quantity}`);
                console.log(`Price: ${cartItem.product.price}`);
                console.log('----------------------');
                total += cartItem.quantity * cartItem.product.price;
                const stockUpdated = await Product.updateOne({ _id: cartItem.product._id }, { $inc: { stock: -cartItem.quantity } });

            }
            console.log(total)

            res.render('checkout', {
                user: userData,
                product: cartItems,
                total: total,

                errorMessage: req.flash("errorMessage")
            });
        } else {
            res.redirect('/cart')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const placeOrder = async (req, res) => {
    try {
        const user = req.session.user;
        const productData = await Cart.findOne({ user: user }).populate('cartItems.product');
        let cartItems = productData.cartItems;
        var total = 0;
        console.log(req.body);
        const { address, coupon } = req.body;
        if (!address) {
            req.flash("errorMessage", "Please choose an address");
            res.redirect("/checkout");
        }
        let discountPrice = 0;
        let couponsApplied = [];
        for (const cartItem of cartItems) {
            total += cartItem.quantity * cartItem.product.price;
            console.log(total)
            const couponProduct = await ProductOffer.findOne({ active: true, product: cartItem.product });
            if (couponProduct) {
                const discount = cartItem.product.price * (couponProduct.amount / 100);
                discountPrice = cartItem.product.price - discount;
                console.log(discountPrice);
                total -= discount * cartItem.quantity;
                couponsApplied.push(couponProduct.code);
                console.log(couponsApplied);
                console.log(couponProduct.code);

            }
            const couponCategory = await CategoryOffer.findOne({ active: true, category: cartItem.product.category });
            if (couponCategory) {
                const discount = cartItem.product.price * (couponCategory.amount / 100);
                console.log(discount);
                total -= discount * cartItem.quantity;
                console.log("after deducting discount" + total);
                couponsApplied.push(couponCategory.code);
                console.log("coupon applied:" + couponsApplied);
                console.log("code:" + couponCategory.code);
            }
        }
        if (coupon) {
            const couponData = await ReferralOffer.findOne({ active: true, code: coupon });
            const discount = total * (couponData.amount / 100);
            console.log(discount);
            total -= discount;
            console.log("after deducting discount" + total);
            couponsApplied.push(couponData.code);
            console.log(couponsApplied);
            console.log(couponData.code);
        }
        req.session.amount = total;
        console.log(req.session.amount);
        const userData = await User.findOne({ _id: user, address: address });

        if (userData) {
            const order = new Order({
                user: user,
                products: cartItems,
                totalPrice: total.toFixed(2),
                address: address
            });
            console.log(order.totalPrice);
            const newOrderData = await order.save();
            if (newOrderData) {
                console.log(newOrderData)
                console.log("Order saved successfully")
            } else {
                console.log("Something went wrong")
            }
            req.session.orderId = newOrderData._id;
            console.log(req.session.orderId);
            const deletedCart = await Cart.deleteOne({ user: user });
            console.log("Cart data deleted", deletedCart);

            const populatedData = await Order.findOne({ _id: newOrderData._id })
                .populate('user')
                .populate('address')
                .populate('products.product');
            console.log(populatedData);
            res.render("orderPage", {
                user: user,
                order: populatedData,
                message: req.flash("message")
            });
        }
        else {
            console.log("User with this address not found!!");
            req.flash('errorMessage', 'User with this address not found!!');
            res.redirect('/checkout')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const viewOrder = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.session.orderId;
        const orderData = await Order.findOne({ _id: orderId }).populate('user').populate('address').populate('products.product');;
        if (orderData) {
            res.render("orderPage", {
                user: user,
                order: orderData,
                message: req.flash("message")
            });
        }
    } catch (error) {
        console.log(error.message);
        res.render('error', { message: error });
    }
}

const cashOnDelivery = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.body.orderId;
        const orderData = await Order.findOne({ _id: orderId });
        if (orderData) {
            const priceData = await Order.findOne({ totalPrice: { $gt: 1000 } });
            if (priceData) {
                req.flash("message", 'Cash on delivery is not available for orders above 1000');
                res.redirect('/orderPage');
            }
            const updateData = await Order.findOneAndUpdate({ _id: orderId }, { $set: { payment: 'cash' } });
            if (updateData) {
                console.log('payment added to database');
                re.redirect('/success');
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const onlinePayment = async (req, res) => {
    try {
        const user = req.session.user;
        let fullName = user.firstName + ' ' + user.lastName;
        console.log(req.body);
        const orderId = req.body.orderId;

        const orderData = await Order.findOne({ _id: orderId, user: user });
        if (orderData) {
            const updateData = await Order.findOneAndUpdate({ _id: orderId }, { $set: { payment: 'online' } });
            if (updateData) {
                console.log('payment added to database');
            }

            const populatedData = await Order.findOne({ _id: orderId })
                .populate('user')
                .populate('address')
                .populate('products.product');
            console.log(populatedData);
            const productsList = populatedData.products
            const productImages = [];

            for (const productList of productsList) {
                const product = productList.product;
                console.log(product);
                if (product && product.images && product.images.length > 0) {
                    productImages.push('http://127.0.0.1:3000/img/shop/' + product.images[0]);
                }
            };

            console.log(productImages);

            stripe.customers.create({
                email: user.email,
                name: fullName
            }).then((customer) => {
                console.log(customer);
                return stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: productsList.map((productList, index) => {
                        const images = productImages[index] || [];
                        return {
                            price_data: {
                                currency: 'inr',
                                product_data: {
                                    name: productList.product.name,
                                    images: images.length > 0 ? [images] : []
                                },
                                unit_amount: productList.product.price * 100,
                            },
                            quantity: productList.quantity
                        }
                    }),
                    mode: 'payment',
                    customer: customer.id,
                    billing_address_collection: 'required',
                    success_url: 'http://127.0.0.1:3000/success',
                    cancel_url: 'http://127.0.0.1:3000/cancel'

                }).then((session) => {
                    console.log(session);
                    res.redirect(session.url);
                }).catch((error) => {
                    console.log(error.message)
                })
            }).catch((error) => {
                console.log(error.message)
            })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const successPage = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.session.orderId;
        const orderData = await Order.findOne({ _id: orderId }).populate('user').populate('address').populate('products.product');;
        console.log(orderData)
        if (orderData) {
            res.render("successPage", {
                user: user,
                message: req.flash("message")
            });
        }
        res.render('successPage', {
            user: user
        });
    }
    catch (error) {
        console.log(error.message);
    }

}

const cancelPage = async (req, res) => {
    try {
        const user = req.session.user;
        const amount = req.session.amount;
        const updateData = await User.findOneAndUpdate({ _id: user._id }, { $inc: { wallet: amount } });
        console.log(updateData.wallet);
        if (updateData) {
            req.flash('message', 'Payment Failed! Your order cancelled!');
            res.redirect('/listOrders');
        } else {
            console.log('Wallet not updated');
        }
    }
    catch (error) {
        console.log(error.message);
    }

}

const cancelProduct = async (req, res) => {
    try {
        const productId = req.body.productId;
        const orderId = req.body.orderId;
        const user = req.session.user;
        const orderData = await Order.findOne({ _id: orderId, user: user });
        if (orderData) {
            if (orderData.status == 'Shipped') {
                req.flash("message", "Cannot cancel shipped products");
                res.redirect("/listOrders")
            }
            for (const product of orderData.products) {
                console.log(product.product)
                console.log(productId)
                if (product.product.equals(productId)) {
                    const updateData = await Order.findOneAndUpdate({ _id: orderId }, { $set: { 'product.productStatus': false } });
                    if (updateData) {
                        console.log(`status of ${productId} set to false`);
                        req.flash("message", "Product cancelled");
                        res.redirect("/listOrders")
                    }
                    else {
                        req.flash("message", "Product couldn't cancel!Something went wrong!!");
                        res.redirect("/listOrders")
                    }
                }
            }
        }
        else {
            req.flash("message", "Order not found");
            res.redirect("/listOrders")
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const cancelAllProducts = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.body.orderId;
        const orderData = await Order.findOne({ _id: orderId })
        if (orderData) {
            if (orderData.status == 'Shipped') {
                req.flash("message", "Cannot cancel shipped products");
                res.redirect("/listOrders")
            }
            const updateData = await Order.findOneAndUpdate({ user: user, _id: orderId }, { status: "Cancelled" });
            if (updateData) {
                console.log("Order cancelled");
                req.flash('message', "Order cancelled!!");
                res.redirect('/listOrders');
            }
            else {
                req.flash('message', "Order couldn't cancelled!!");
                res.redirect('/listOrders');
            }
        } else {
            req.flash('message', "Order not found!!");
            res.redirect('/listOrders');
        }

    } catch (error) {
        console.log(error.message);
    }
}

(async function () {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent('<h1>hello</h1>');
        await page.emulateMedia('screen');
        await page.pdf({
            path: 'myInvoice.pdf',
            format: 'A4',
            printBackground: true
        });

        console.log('done');
        await browser.close();
        process.exit();
    } catch (error) {
        console.log(error.message);
    }
})

const generatePdf = async (req, res) => {
    try {
        // const html = fs.readFileSync(path.join(__dirname, '../views/template.html'), 'utf-8');
        // const filename = Math.random() + '_doc' + '.pdf';
        // let array = [];
        // const orderId = req.session.orderId
        // console.log(req.session.orderId);
        // const orderData = await Order.findOne({ _id: orderId }).populate('products.product');;
        // if (orderData) {
        //     const orderItems = orderData.products;
        //     orderItems.forEach((item) => {
        //         const product = {
        //             name: item.product.name,
        //             quantity: item.quantity,
        //             price: item.product.price,
        //             total: item.product.price * item.quantity
        //         }
        //         console.log(array);
        //         array.push(product);
        //     });
        //     const subTotal = orderData.totalPrice;
        //     const grandTotal = subTotal;
        //     const obj = {
        //         productList: array,
        //         subTotal,
        //         gtotal: grandTotal
        //     }
        //     console.log(obj)
        //     const document = {
        //         html: html,
        //         data: { products: obj },
        //         path: './docs/' + filename,
        //         options: options
        //     }
        //     const pdfBuffer = await pdf.create(document);
        //     fs.writeFileSync(document.path, pdfBuffer);
        //     // pdf.create(document, options)
        //     //     .then(res => {
        //     //         console.log(res);
        //     //     }).catch(error => {
        //     //         console.log(error);
        //     //     });
        //     const filepath = 'http://127.0.0.1:3000/docs/' + filename;
        //     res.render('download', {
        //         path: filepath
        //     })
        // }
    }
    catch (error) {
        console.log(error.message);
    }
}

const viewWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const productData = await Wishlist.findOne({}).populate('items.product');
        res.render('wishlist', {
            user: user,
            wishlistItems: productData.items,
            message: req.flash('message')
        });
    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const productId = req.query.id;
        const wishlistItem = {
            product: productId,
            quantity: 1
        };
        console.log(wishlistItem);

        if (user) {
            let wishlistData = await Wishlist.findOne({ user: user._id });
            if (!wishlistData) {
                wishlistData = new Wishlist({
                    user: user,
                    items: [wishlistItem]
                });
                console.log(wishlistData)
            } else {
                const existingItem = wishlistData.items.find(item => item.product.equals(productId));
                console.log(existingItem)

                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    wishlistData.items.push(wishlistItem);
                    console.log(wishlistData)

                }
            }
            await wishlistData.save();
            console.log(wishlistData)
            const newData = await wishlistData.populate('items.product');
            if (newData) {
                res.render('wishlist', {
                    user: user,
                    wishlistItems: newData.items,
                    message: req.flash('message')
                });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteWishlistItem = async (req, res) => {
    try {
        const user = req.session.user;
        const productId = req.query.productId;
        const productData = await Wishlist.findOne({ user: user }, { 'items.product': productId });
        if (productData) {
            const deletedData = await Wishlist.findOneAndUpdate({ user: user }, { $pull: { 'items.product': productId } });
            if (deletedData) {
                console.log('item deleted from wishlist')
                req.flash('message', 'Item cleared from Wishlist!!')
                res.redirect('/wishlist');
            }
            else {
                req.flash('message', 'Product not found!!')
                res.redirect('/wishlist');
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteAllWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const wishlistData = await Wishlist.findOne({ user: user });
        if (wishlistData) {
            const deletedData = await Wishlist.deleteOne({ user: user });
            if (deletedData) {
                console.log('wishlist deleted')
                res.redirect('/shop');
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


const listOrders = async (req, res) => {
    try {
        const user = req.session.user;
        const allOrdersData = await Order.find({ user: user }).sort({ created_at: -1 }).populate('products.product').populate('address');
        if (allOrdersData) {
            res.render('listorders', {
                user: user,
                order: allOrdersData,
                message: req.flash("message"),
            });
        }
        else {
            req.flash("message", "No Orders Data Available");
            res.redirect("/viewUser");
        }
    }
    catch (error) {

    }
}

const viewOrderDetails = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.query.id;
        const orderDetails = await Order.findOne({
            _id: orderId,
            user: user
        })
            .populate('user')
            .populate('address')
            .populate('products.product');
        res.render("viewOrderDetails", {
            user: user,
            order: orderDetails,
            successMessage: req.flash("successMessage"),
            errorMessage: req.flash("errorMessage")
        });
    } catch (error) {
        console.log(error.message);
    }
}

const aboutPage = async (req, res) => {
    try {
        const userData = req.session.user;
        res.render('about', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/home');
    } catch (error) {
        console.log(error.message);
    }
}

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
    viewOrder,
    cashOnDelivery,
    onlinePayment,
    cancelPage,
    successPage,
    generatePdf,
    cancelProduct,
    cancelAllProducts,
    viewWishlist,
    addToWishlist,
    deleteWishlistItem,
    deleteAllWishlist,
    deleteCartItem,
    addToCart,
    aboutPage,
    listOrders,
    viewOrderDetails,
    logout
}