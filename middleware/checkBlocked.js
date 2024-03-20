const User = require("../models/userModel");


const isBlocked = async (req, res, next) => {
    if (req.session.user) {

        console.log(req.session.user)
        const userId = req.session.user;
        try {
            const user = await User.findById(userId);

            if (!user) {
                console.log("User not found")
                req.flash("errorMessage", "User not found!!")
                res.redirect('/login');
            }

            if (user.blocked) {
                console.log("User is blocked");
                req.session.destroy();
                res.redirect("/login");

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