
const User = require("../models/userModel");

const isAuthenticated = async (req, res, next) => {
    console.log(req.session.user);
    if (req.session && req.session.user) {
        next();
    } else {
        req.flash("errorMessage", "Please log in to access the page.");
        res.redirect("/login");
    }
}

const isLoggedOut = (req, res, next) => {
    console.log(req.session.user);

    if (req.session && req.session.user) {
        res.redirect("/home");
    } else {
        next();

    }

}


module.exports = {
    isAuthenticated,
    isLoggedOut
}