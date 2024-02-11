
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
            // if (userData.verified == false) {
            //     const updateUserData = await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } });
            //     console.log(`${updateUserData}`)
            //     req.session.user = updateUserData._id;
            //     req.session.loggedIn = true;
            //     const productData = await Product.find({});

            //     res.render("home", {
            //         user: updateUserData._id,
            //         product: productData
            //     });
            // }
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

        } res.redirect('/verify');
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
        const email = req.body.email;
        const otp = req.body.otp;
        if (!email || !otp) {
            req.flash("errorMessage", "Please fill all fields!!");
            res.redirect("/verify");
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
                res.render("home", {
                    user: user_id,
                    product: productData
                });
            }
            else {
                req.flash("errorMessage", "Email and OTP not match");
                res.redirect("/verify");
                console.log("Email and otp not match")
            }
        }

        else {
            req.flash("errorMessage", "Incorrect email or OTP");
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

const viewProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.find({ _id: id });
        const userData = awaitUser.find();
        console.log(productData);
        res.render('product', { user: userData[0] });
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