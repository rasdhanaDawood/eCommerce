const express = require("express");
const admin_route = express();
// const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, path.join(__dirname, '../public/img/shop'))
        }
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

admin_route.get("/listCategory", auth.isAuthenticated, adminController.listCategory);

admin_route.get("/editCategory", adminController.getEditCategory);

admin_route.post("/editCategory", adminController.editCategory);

admin_route.get("/deleteCategory", adminController.deleteCategory);

admin_route.get("/listProduct", auth.isAuthenticated, adminController.listProduct);

admin_route.get("/addProduct", adminController.getProduct);

admin_route.post("/addProduct", upload.array('image', 3), adminController.addProduct);

admin_route.get("/editProduct", adminController.getEditProduct);

admin_route.get("/resize", adminController.editImage);

admin_route.post('/resize', upload.single('image'), adminController.resizeImage);

admin_route.post("/editProduct", upload.array('image', 3), adminController.editProduct);

admin_route.get("/deleteProduct", adminController.deleteProduct);

admin_route.get("/editUser", adminController.getUser);

admin_route.get("/updateUser", adminController.editUser);

admin_route.get("/forgotPassword", auth.isLoggedOut, adminController.forgotPassword);

admin_route.get('/logout', auth.isAuthenticated, adminController.logout);

admin_route.get("/*", (req, res) => {
    req.flash('errormessage', 'Please login First')
    res.redirect("/admin/login");
});

module.exports = admin_route; 