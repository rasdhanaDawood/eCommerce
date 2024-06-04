
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        next();
    } else {
        req.flash("errorMessage", "Please log in to access the page.");
        return res.redirect("/admin/login");
    }
}

const isLoggedOut = (req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect("/admin/dashboard");
    } else {
        next();
    }
}

module.exports = {
    isAuthenticated,
    isLoggedOut
}