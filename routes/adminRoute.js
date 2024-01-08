const express = require("express");
const admin_route = express();
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/img/shop'))
    },
    filename: function (req, file, cb) {
        const name = file.originalname;
        cb(null, name);
    }
});
const upload = multer({ storage: storage })

admin_route.set('view engine', 'ejs');
admin_route.set("views", "./views/admin");

const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");

admin_route.get("/login", auth.isLoggedOut, adminController.loadLogin);

admin_route.post("/login", adminController.verifyLogin);

admin_route.get("/dashboard", auth.isAuthenticated, adminController.dashboard);


admin_route.get("/addCategory", adminController.getCategory);

admin_route.post("/addCategory", adminController.addCategory);

admin_route.get("/listCategory", adminController.listCategory);

admin_route.get("/editCategory", adminController.getEditCategory);

admin_route.post("/editCategory", adminController.editCategory);

admin_route.post("deleteCategory", adminController.deleteCategory);

admin_route.get("/listProduct", adminController.listProduct);

admin_route.get("/addProduct", adminController.getProduct);

admin_route.post("/addProduct", upload.single('image'), adminController.addProduct);

admin_route.get("/editProduct", adminController.getEditProduct);

admin_route.post("/editProduct", adminController.editProduct);

admin_route.get("/forgotPassword", adminController.forgotPassword);

admin_route.get("/*", (req, res) => {
    req.flash('errormessage', 'Please login First')
    res.redirect("/admin/login");

});

module.exports = admin_route; 