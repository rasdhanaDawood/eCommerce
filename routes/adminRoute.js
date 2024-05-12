const express = require("express");
const admin_route = express();

admin_route.set('view engine', 'ejs');
admin_route.set("views", "./views/admin");

const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");

const { upload } = require("../utils/multer");
const { editedUploads } = require("../utils/multer");

admin_route.get("/login", auth.isLoggedOut, adminController.loadLogin);

admin_route.post("/login", adminController.verifyLogin);

admin_route.get("/dashboard", auth.isAuthenticated, adminController.dashboard);

admin_route.get("/addCategory", adminController.getCategory);

admin_route.post("/addCategory", adminController.addCategory);

admin_route.get("/listCategory", auth.isAuthenticated, adminController.listCategory);

admin_route.get("/editCategory", adminController.getEditCategory);

admin_route.post("/editCategory", adminController.editCategory);

admin_route.get("/deleteCategory", adminController.deleteCategory);

admin_route.get('/add_subcategory', adminController.add_subcategory);

admin_route.get("/delete_subcategory", adminController.delete_subcategory);

admin_route.post('/add_subcategory', adminController.create_subcategory);

admin_route.get("/listProduct", auth.isAuthenticated, adminController.listProduct);

admin_route.get("/viewProduct", adminController.viewProduct);

admin_route.get("/addProduct", adminController.getProduct);

admin_route.post("/addProduct", upload, adminController.addProduct);

admin_route.get("/editProduct", adminController.getEditProduct);

admin_route.post("/editProduct", editedUploads, adminController.editProduct);

admin_route.get("/deleteProduct", adminController.deleteProduct);

admin_route.get('/crop_image', adminController.cropImage);

admin_route.get("/listOrders", auth.isAuthenticated, adminController.listOrders);

admin_route.get("/updateStatus", auth.isAuthenticated, adminController.getUpdateStatusPage);

admin_route.post("/updateStatus", auth.isAuthenticated, adminController.updateStatus);

admin_route.get("/listStock", auth.isAuthenticated, adminController.listStock);

admin_route.get("/addStock", auth.isAuthenticated, adminController.getAddStock);

admin_route.post("/addStock", auth.isAuthenticated, adminController.addStock);

admin_route.get("/listCoupons", adminController.listCoupons);

admin_route.get("/addCategoryCoupons", adminController.getAddCategoryCouponPage);

admin_route.post("/addCategoryCoupons", adminController.addCategoryCoupon);

admin_route.get("/addProductCoupons", adminController.getAddProductCouponPage);

admin_route.post("/addProductCoupons", adminController.addProductCoupon);

admin_route.get("/addReferralCoupons", adminController.getAddReferralCouponPage);

admin_route.post("/addReferralCoupons", adminController.addReferralCoupon);

admin_route.get('/deleteProductCoupon', adminController.deleteProductCoupon);

admin_route.get('/deleteCategoryCoupon', adminController.deleteCategoryCoupon);

admin_route.get('/deleteReferralCoupon', adminController.deleteReferralCoupon);

admin_route.get('/salesReport', adminController.displaySalesReport);

admin_route.get("/editUser", adminController.getUser);

admin_route.get("/updateUser", adminController.editUser);

admin_route.get('/viewChart', adminController.chartData);

admin_route.get('/exportSalesExcel', adminController.exportDataExcel);

admin_route.get("/forgotPassword", auth.isLoggedOut, adminController.forgotPassword);

admin_route.get('/logout', auth.isAuthenticated, adminController.logout);

admin_route.get("/new", async (req, res) => {

    res.render("new");
});

// admin_route.get("/*", (req, res) => {
//     req.flash('errormessage', 'Please login First')
//     res.redirect("/admin/login");
// });

module.exports = admin_route; 