

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        req.flash("errorMessage", "Please log in to access the page.");
        res.redirect("/login");
    }
}

const isLoggedOut = (req, res, next) => {
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