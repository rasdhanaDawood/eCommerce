const User = require("../models/userModel");

const isBlocked = async (req, res, next) => {
    if (req.session.user) {

        const userId = req.session.user;
        try {
            const user = await User.findById(userId);

            if (!user) {
                console.log("User not found")
                req.flash("errorMessage", "User not found!!")
                return res.redirect('/login');
            }

            if (user.blocked) {
                console.log("You dont have access to this page!!");
                req.flash("errorMessage", "You dont have access to this page!!")
                return res.redirect("/login");
                req.session.destroy();

            }
            next();
        } catch (err) {
            console.error("Error checking blocked status:", err);
            res.status(500).send("Internal Server Error");
        }
    };
}


module.exports = {
    isBlocked
}