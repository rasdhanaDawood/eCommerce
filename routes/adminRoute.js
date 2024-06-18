const express = require("express");
const admin_route = express();

admin_route.set('view engine', 'ejs');
admin_route.set("views", "./views/admin");

const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");

const { upload } = require("../utils/multer");
const { editedUploads } = require("../utils/multer");

admin_route.get("/login", auth.isLoggedOut, adminController.loadLogin);

admin_route.post("/login", auth.isLoggedOut, adminController.verifyLogin);

admin_route.get('/forgetPassword', auth.isLoggedOut, adminController.getForgetPassword);

admin_route.post('/forgetPassword',auth.isLoggedOut, adminController.forgetPassword);

admin_route.get('/reset-Password', auth.isLoggedOut, adminController.getResetPassword);

admin_route.post('/reset-Password',auth.isLoggedOut, adminController.resetPassword);

admin_route.get("/dashboard",auth.isAuthenticated, adminController.dashboard);

admin_route.get("/addCategory",auth.isAuthenticated, adminController.getCategory);

admin_route.post("/addCategory",auth.isAuthenticated, adminController.addCategory);

admin_route.get("/listCategory",auth.isAuthenticated, adminController.listCategory);

admin_route.get("/editCategory",auth.isAuthenticated, adminController.getEditCategory);

admin_route.post("/editCategory",auth.isAuthenticated, adminController.editCategory);

admin_route.get("/deleteCategory",auth.isAuthenticated, adminController.deleteCategory);

admin_route.get('/add_subcategory',auth.isAuthenticated, adminController.add_subcategory);

admin_route.get("/delete_subcategory",auth.isAuthenticated, adminController.delete_subcategory);

admin_route.post('/add_subcategory',auth.isAuthenticated, adminController.create_subcategory);

admin_route.get("/listProduct", auth.isAuthenticated, adminController.listProduct);

admin_route.get("/listProduct/:categoryId", auth.isAuthenticated, adminController.listProduct);

admin_route.get("/viewProduct", auth.isAuthenticated, adminController.viewProduct);

admin_route.get("/addProduct",auth.isAuthenticated, adminController.getProduct);

admin_route.post("/addProduct",auth.isAuthenticated, upload, adminController.addProduct);

admin_route.get("/editProduct",auth.isAuthenticated, adminController.getEditProduct);

admin_route.post("/editProduct",auth.isAuthenticated, editedUploads, adminController.editProduct);

admin_route.get("/deleteProduct",auth.isAuthenticated, adminController.deleteProduct);

admin_route.get('/crop_image',auth.isAuthenticated, adminController.cropImage);

admin_route.post('/save-cropped-image', auth.isAuthenticated, editedUploads, adminController.saveImage);

admin_route.get("/listOrders", auth.isAuthenticated, adminController.listOrders);

admin_route.get("/updateStatus", auth.isAuthenticated, adminController.getUpdateStatusPage);

admin_route.post("/updateStatus", auth.isAuthenticated, adminController.updateStatus);

admin_route.get("/listStock", auth.isAuthenticated, adminController.listStock);

admin_route.get("/addStock", auth.isAuthenticated, adminController.getAddStock);

admin_route.post("/addStock", auth.isAuthenticated, adminController.addStock);

admin_route.get("/listCoupons",auth.isAuthenticated, adminController.listCoupons);

admin_route.get("/addCategoryCoupons",auth.isAuthenticated, adminController.getAddCategoryCouponPage);

admin_route.post("/addCategoryCoupons",auth.isAuthenticated, adminController.addCategoryCoupon);

admin_route.get("/addProductCoupons",auth.isAuthenticated, adminController.getAddProductCouponPage);

admin_route.post("/addProductCoupons",auth.isAuthenticated, adminController.addProductCoupon);

admin_route.get("/addReferralCoupons",auth.isAuthenticated, adminController.getAddReferralCouponPage);

admin_route.post("/addReferralCoupons",auth.isAuthenticated, adminController.addReferralCoupon);

admin_route.get('/deleteProductCoupon',auth.isAuthenticated, adminController.deleteProductCoupon);

admin_route.get('/deleteCategoryCoupon',auth.isAuthenticated, adminController.deleteCategoryCoupon);

admin_route.get('/deleteReferralCoupon', auth.isAuthenticated, adminController.deleteReferralCoupon);

admin_route.get('/salesReport',auth.isAuthenticated, adminController.displaySalesReport);

admin_route.post('/salesReport',auth.isAuthenticated, adminController.postSalesReport);

admin_route.get("/editUser",auth.isAuthenticated, adminController.getUser);

admin_route.get("/updateUser",auth.isAuthenticated, adminController.editUser);

admin_route.get('/sales/yearly',auth.isAuthenticated, adminController.yearlySales);

admin_route.get('/sales/monthly',auth.isAuthenticated, adminController.monthlySales);

admin_route.get('/sales/weekly',auth.isAuthenticated, adminController.weeklySales);

admin_route.get('/sales/daily',auth.isAuthenticated, adminController.dailySales);

admin_route.get('/logout', auth.isAuthenticated, adminController.logout);

module.exports = admin_route; 