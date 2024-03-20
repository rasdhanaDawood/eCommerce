
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");

const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

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

const userAccount = async (req, res) => {
    try {
        res.render('userAccount');
    } catch (error) {
        console.log(error.message);
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
        res.render("resetPassword", {
            message: req.flash('message')
        });


    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        console.log(req.query);
        console.log(req.body);
        console.log(req.params);

        const token = req.query.token;
        const tokenData = await User.findOne({ token: token })
        if (tokenData) {
            const password = req.body.password;
            const newPassword = await securePassword(password);
            const updatedData = await User.findByIdAndUpdate({ _id: tokenData._id }, { $set: { password: newPassword, token: "" } }, { new: true });
            console.log("Password updated successfully");
            console.log(updatedData)
            req.flash('successMessage', 'Password updated successfully!!')
            res.redirect("/login");
        } else {
            console.log("link expired");
        }

    } catch (error) {
        console.log(error.message);
    }
}

const viewProduct = async (req, res) => {
    try {
        console.log(req.query);
        console.log(req.body);
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
                user: userData,
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
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ user: userId }).populate('cartItems.product');

        if (!cart || cart.cartItems.length === 0) {
            res.render('cart', { user: userId, cartItems: [], isEmpty: true });
        }
        const cartItems = cart.cartItems;
        console.log(cartItems);
        console.log(cartItems.length);
        // Iterate over cart items and print as key-value pairs
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
            { user: req.session.user._id }, // Assuming you're using session to identify the user
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
    getOTP,
    verifyOTP,
    resend,
    userAccount,
    viewProduct,
    viewAllProducts,
    searchProduct,
    viewCart,
    deleteCartItem,
    addToCart,
    aboutPage,
    logout
}