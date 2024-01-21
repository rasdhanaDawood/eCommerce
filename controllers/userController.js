
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const Product = require("../models/productModel");

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
        const productData = await Product.find({});

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
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            req.flash("errorMessage", "Please fill all fields");
            res.redirect("/register");
        }
        let userData = await User.findOne({ email });
        if (userData) {
            if (userData.verified === true) {
                req.flash('errorMessage', "User Already Registered");
                res.redirect('/login');
            } else {
                res.redirect('/verify');
            }
        }
        else {
            const hashedPassword = await securePassword(req.body.password);
            let user = new User({
                name: name,
                password: hashedPassword,
                email: email,
                phone: phone,
                blocked: 0,
                registered: 0,
                is_admin: 0
            });
            console.log(user);
            const saveUser = await user.save();
            console.log(`user saved: ${saveUser}`);
            if (saveUser) {
                res.render("verifyOTP");
            }
            else {
                req.flash('Something went wrong! User not registered')
                res.redirect("/register")
            }
        }
    } catch (error) {
        console.log(error.message);
    }

}

const getOTP = async (req, res) => {
    try {
        res.render('verifyOTP', {
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')
        });
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOTP = async (req, res) => {
    try {
        // const { email, otp } = req.body;
        const email = req.body.email;
        const otp = req.body.otp;
        if (!email || !otp) {
            req.flash("errorMessage", "Please fill all fields!!");
            res.redirect("/verify");
        }
        const findUser = await User.findOne({ email: email })
        const user_id = findUser._id;
        const user = await OTP.findOne({ email: email });
        if (user) {
            if (user.email === email && user.otp === otp) {
                req.session.user = user_id;
                req.session.loggedIn = true;
                console.log("verification success");
                const userData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { verified: true } });
                res.render("home", { user: userData });
            }
            else {
                req.flash("errorMessage", "Email and OTP not match");
                res.redirect("/verify");
                console.log("Email and otp not match")
            }
        }
        else {
            req.flash("errorMessage", "user not found");
            res.redirect("/verify")
            console.log("User not found");
        }
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
                req.flash('errorMessage', "Please verify your email account")
                res.redirect('/register');
            }
            if (userData.blocked === true) {
                req.flash('errorMessage', 'Unable to access your account')
                res.redirect('/login');
            }
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {

                req.session.user = userData;
                res.redirect('/home');

            } else {
                req.flash("errorMessage", "Email/password doesnt match");
                res.redirect('/login');
            }

        }
        else {
            req.flash("errorMessage", "User not found!! Please register first");
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const viewProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.find({ _id: id });
        res.render('product', { product: productData });
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
    getOTP,
    verifyOTP,
    userAccount,
    viewProduct,
    logout
}