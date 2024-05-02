
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Order = require("../models/ordersModel");
const Address = require("../models/addressModel");
const { ProductOffer, CategoryOffer, ReferralOffer } = require("../models/offerModel");
const Wishlist = require("../models/wishlistModel");

const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;
const stripe = require('stripe')(STRIPE_SECRET_KEY)

// const razorpay = new Razorpay({
//     key_id: RAZORPAY_KEY_ID,
//     key_secret: RAZORPAY_KEY_SECRET
// });

const paypal = require('paypal-rest-sdk');

const { PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY } = process.env;

paypal.configure({
    'mode': PAYPAL_MODE,
    'client_id': PAYPAL_CLIENT_KEY,
    'client_secret': PAYPAL_SECRET_KEY
})

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
                rejectUnauthorized: false // This disables SSL certificate verification
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
            // Convert the string to an array with a single element
            addressIds = [req.body.id];
            addressArray = [req.body.address];
            cityArray = [req.body.city];
            stateArray = [req.body.state];
            zipArray = [req.body.zip];
        } else {
            // Use the array as is
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

const viewProduct = async (req, res) => {
    try {
        const id = req.query.id;
        if (id) {
            const productData = await Product.find({ _id: id }).populate('category');
            const userData = req.session.user;
            console.log(userData);
            console.log(productData);
            const allProductsData = await Product.find({ is_Deleted: false });
            res.render('product', {
                user: userData,
                product: productData,
                allProducts: allProductsData
            });
        } else {
            res.redirect('/shop');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const viewAllProducts = async (req, res) => {
    try {
        console.log(req.query);
        const selectedCategory = req.query.category;
        const sortOption = req.query.sort;
        var productData = await Product.find({ is_Deleted: false });

        if (selectedCategory) {
            if (selectedCategory == 'All') {

            } else {
                productData = await Product.find({ category: selectedCategory, is_Deleted: false });
            }
        }
        if (sortOption) {
            switch (sortOption) {
                case 'nameAsc': productData = await Product.find({ is_Deleted: false }).sort({ name: 1 });
                    break;
                case 'nameDesc': productData = await Product.find({ is_Deleted: false }).sort({ name: -1 });
                    break;
                case 'lowToHigh': productData = await Product.find({ is_Deleted: false }).sort({ price: 1 });
                    break;
                case 'highToLow': productData = await Product.find({ is_Deleted: false }).sort({ price: -1 });
                    break;
                case 'rating': productData = await Product.find({ is_Deleted: false }).sort({ rating: -1 });
                    break;
                case 'featured': productData = await Product.find({ is_Deleted: false, is_Featured: true }).sort({ name: 1 });
                    break;
                default: console.log("Something happened");
                    break;
            }
        }
        console.log(productData);
        const userId = req.session.user;
        const userData = await User.find({ _id: userId });
        const categoryData = await Category.find();

        if (req.xhr) {
            res.json(productData);
        } else {
            res.render('shop', {
                user: userId,
                category: categoryData,
                product: productData
            })
        }
    } catch (error) {
        console.log(error.message)
    }
}

const searchProduct = async (req, res) => {

    const userId = req.session.user;
    const userData = await User.find({ _id: userId });
    const categoryData = await Category.find();
    console.log(req.query);
    const search = req.query.name;
    const selectedCategory = req.query.category;
    try {
        // Search for the product in the database
        const productData = await Product.find({
            $or: [{ category: selectedCategory }, {
                name: {
                    $regex: ".*" + search + ".*", $options: "i"
                }
            }]
        });

        if (productData) {
            // If product found, send it in the response
            console.log("found" + productData);
            res.render('shop', {
                user: userData,
                category: categoryData,
                product: productData
            })
        } else {
            // If product not found, send a 404 response
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        // If there's an error, send a 500 response
        console.error('Error searching for product:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                // Delete cart item if product does not exist or stock is <= 0
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
            req.flash("message", "Cart updated Successfully");
            return res.redirect("/cart");
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
            const couponProduct = await ProductOffer.findOne({ product: cartItem.product });
            if (couponProduct) {
                const discount = cartItem.product.price * (couponProduct.amount / 100);
                discountPrice = cartItem.product.price - discount;
                console.log(discountPrice);
                total -= discount * cartItem.quantity;
                couponsApplied.push(couponProduct.code);
                console.log(couponsApplied);
                console.log(couponProduct.code);

            }
            const couponCategory = await CategoryOffer.findOne({ category: cartItem.product.category });
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
            const couponData = await ReferralOffer.findOne({ code: coupon });
            const discount = total * (couponData.amount / 100);
            console.log(discount);
            total -= discount;
            console.log("after deducting discount" + total);
            couponsApplied.push(couponData.code);
            console.log(couponsApplied);
            console.log(couponData.code);
        }
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

const cashOnDelivery = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.body.orderId;
        const orderData = await Order.findOne({ _id: orderId });
        if (orderData) {
            const updateData = await Order.findOneAndUpdate({ _id: orderId }, { $set: { payment: 'cash' } });
            if (updateData) {
                console.log('payment added to database');
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
        res.render('cancelPage', {
            user: user
        });
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
                    product.productStatus = false;
                    console.log(`status of ${productId} set to false`);
                    break;
                }
            }
            req.flash("message", "Product cancelled");
            res.redirect("/listOrders")
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

const viewWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const productData = await Wishlist.findOne({}).populate('items.product');
        res.render('wishlist', {
            user: user,
            wishlistItems: productData.items
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
                    wishlistItems: newData.items
                });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteWishlistItem = async (req, res) => {
    try {
        const productId = req.query.productId;
        const productData = await Wishlist.findOne({ _id: productId });
        if (productData) {
            const deletedData = await Wishlist.findOneAndUpdate({ $pull: { 'products.product': productId } });
            if (deletedData) {
                console.log('item deleted from wishlist')
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
            }

        }
    } catch (error) {
        console.log(error.message);
    }
}

const getOrderPage = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.session.newOrderId;
        const orderDetails = await Order.findOne({
            _id: orderId,
            user: user
        })
            .populate('user')
            .populate('address')
            .populate('products.product');
        res.render("orderPage", {
            user: user,
            order: orderDetails,
            message: req.flash("message")
        });
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
    viewProduct,
    viewAllProducts,
    searchProduct,
    viewCart,
    proceedCheckout,
    getOrderPage,
    placeOrder,
    cashOnDelivery,
    onlinePayment,
    cancelPage,
    successPage,
    cancelProduct,
    cancelAllProducts,
    viewWishlist,
    addToWishlist,
    deleteWishlistItem,
    deleteAllWishlist,
    deleteCartItem,
    updateCart,
    addToCart,
    aboutPage,
    listOrders,
    viewOrderDetails,
    logout
}