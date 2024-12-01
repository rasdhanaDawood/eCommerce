const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const SubCategory = require("../models/subCategoryModel");
const Order = require("../models/ordersModel");
const {
  ProductOffer,
  CategoryOffer,
  ReferralOffer,
} = require("../models/offerModel");

const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const IP = process.env.IP || '127.0.0.1';
const PORT = process.env.PORT || 8080;

const bcrypt = require("bcrypt");

const randomstring = require("randomstring");
const nodemailer = require("nodemailer");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
const sendResetPasswordmail = async (name, email, token) => {
  try {
    let passwordTransporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let mailOptions = await passwordTransporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Reset Password",
      html: `<p> Hi, ${name}, <a href="http://${IP}:${PORT}/admin/reset-Password?token=${token}"> Please  click here to reset your password</a> `,
    });

    passwordTransporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("mail sent for password reset:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.render("signin", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch && userData.is_admin === true) {
        req.session.admin = userData._id;

        return res.redirect("/admin/dashboard");
      } else {
        req.flash("errorMessage", "Incorrect Email/password");
        return res.redirect("/admin/login");
      }
    } else {
      req.flash("errorMessage", "Please register or create an account");
      return res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const dashboard = async (req, res) => {
  try {
    const usersCount = await User.find({}).count();
    console.log(usersCount);
    const ordersCount = await Order.find({}).count();
    console.log(ordersCount);
    const revenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: "$id", total: { $sum: "$totalPrice" } } },
    ]);
    console.log(revenue[0].total);
    total = revenue[0].total;
    const topSellingProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
    ]);

    return res.render("dashboard", {
      product: topSellingProducts,
      userCount: usersCount,
      orderCount: ordersCount,
      revenue: total,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const listProduct = async (req, res) => {
  try {
    var productData = await Product.find({ is_Deleted: false }).populate(
      "category"
    );
    const categoryData = await Category.find({});
    console.log(req.query);
    if (req.query) {
      let category = req.query.category;

      if (category === "all" || category == undefined) {
        productData = await Product.find({ is_Deleted: false }).populate(
          "category"
        );
        console.log(productData);
      } else if (category == "featured") {
        productData = await Product.find({
          is_Featured: true,
          is_Deleted: false,
        }).populate("category");
        console.log(productData);
      } else if (category) {
        const categoryId = new mongoose.Types.ObjectId(category);
        for (const item of categoryData) {
          if (item._id.equals(categoryId)) {
            productData = await Product.find({
              category: categoryId,
              is_Deleted: false,
            }).populate("category");
            console.log(productData);
          }
        }
      } else {
        console.log("Error");
        req.flash("errorMessage", "Category data not found");
        return res.redirect("/admin/dashboard");
      }
    }

    if (productData) {
      if (req.xhr) {
        return res.json(productData);
      } else {
        return res.render("listProduct", {
          product: productData,
          category: categoryData,
          errorMessage: req.flash("errorMessage"),
          successMessage: req.flash("successMessage"),
        });
      }
    } else {
      req.flash("errorMessage", "Product data not found");
      return res.redirect("/admin/listproduct");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewProduct = async (req, res) => {
  try {
    let id = req.query.id;
    const productData = await Product.findById({ _id: id }).populate(
      "category"
    );
    return res.render("viewProduct", {
      Product: productData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getProduct = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    return res.render("addProduct", {
      category: categoryData,
      errorMessage: req.flash("errorMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    const imageFiles = [];
    console.log(req.files);
    console.log(req.body);
    const {
      productname,
      price,
      category,
      shortDesc,
      detailDesc,
      stock,
      isFeatured,
      isDeleted,
    } = req.body;
    if (
      !productname ||!req.files||
      !price ||
      !category ||
      !shortDesc ||
      !detailDesc ||
      !isFeatured ||
      !isDeleted ||
      !stock
    ) {
      req.flash("errorMessage", "Fields should not be empty!!");
      return res.redirect("/admin/addProduct");
    }
    const productData = await Product.findOne({ name: req.body.productname });
    if (productData) {
      req.flash("errorMessage", "Product already exists!!");
      return res.redirect("/admin/listProduct");
    }
    if (req.files) {
      req.files.map((file) => {
        imageFiles.push(file.filename);
      });
    }
    console.log(imageFiles);
    const product = new Product({
      name: productname,
      price: price,
      images: imageFiles,
      short_description: shortDesc,
      detail_description: detailDesc,
      is_Featured: isFeatured,
      is_Deleted: isDeleted,
      category: category,
      stock: stock,
    });
    const createProduct = await product.save();
    console.log(createProduct);

    if (createProduct) {
      req.flash("successMessage", "Product created successfully");
      return res.redirect("/admin/listProduct");
    } else {
      req.flash("errorMessage", "Something went wrong");
      return res.redirect("/admin/listProduct");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    if (id) {
      const productData = await Product.findById({ _id: id });
      const categoryData = await Category.find({});
      return res.render("editProduct", {
        Product: productData,
        Category: categoryData,
        errorMessage: req.flash("errorMessage"),
      });
    } else {
      req.flash("errorMessage", "Something went wrong");
      return res.redirect("/admin/listProduct");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editProduct = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.query);

    let id = req.body.id;
    console.log(req.body);
    let images = [];
    console.log(req.files);
    const {
      name,
      price,
      category,
      shortDesc,
      detailDesc,
      stock,
      isFeatured,
      isDeleted,
    } = req.body;
    if (
      !name ||
      !price ||
      !category ||
      !shortDesc ||
      !detailDesc ||
      !isFeatured ||
      !isDeleted ||
      !stock
    ) {
      req.flash("errorMessage", "Fields should not be empty!!");
      return res.redirect(`/admin/editProduct?id=${id}`);
    }
    if (!req.files.image1) {
      images.push(req.body.image1);
    } else {
      images.push(req.files.image1[0].originalname);
      console.log(req.files.image1[0].originalname);
    }
    if (!req.files.image2) {
      images.push(req.body.image2);
    } else {
      images.push(req.files.image2[0].originalname);
      console.log(req.files.image2[0].originalname);
    }
    if (!req.files.image3) {
      images.push(req.body.image3);
    } else {
      images.push(req.files.image3[0].originalname);
      console.log(req.files.image3[0].originalname);
    }

    console.log(req.body.id);
    const productData = await Product.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: req.body.name,
          price: req.body.price,
          images: images,
          short_description: req.body.shortDesc,
          detail_description: req.body.detailDesc,
          is_Featured: req.body.isFeatured,
          is_Deleted: req.body.isDeleted,
          category: req.body.category,
          stock: req.body.stock,
        },
      }
    );
    if (productData) {
      console.log("Update successfull");
      req.flash("successMessage", "Product updated successfully!!");
      return res.redirect("/admin/listProduct");
    } else {
      req.flash("errorMessage", "Something went wrong!!updation failed!");
      return res.redirect("/admin/listProduct");
    }
  } catch (error) {
    return res.render("error", {
      message: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findOne({ _id: id });
    if (productData) {
      const deleteProduct = await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { is_Deleted: true } }
      );
      req.flash("successMessage", "Product deleted successfully!!");
      return res.redirect("/admin/listProduct");
    } else {
      req.flash("errorMessage", "Something went wrong!!");
      return res.redirect("/admin/listProduct");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const cropImage = (req, res) => {
  try {
    const img = req.query.image;
    return res.render("cropImage", { image: img });
  } catch (error) {
    console.log(error.message);
  }
};

const saveImage = (req, res) => {
  try {
    if (req.files && req.files.image1) {
      console.log(req.files.image1);
      return res.status(200).send("Cropped image uploaded successfully.");
    } else {
      console.log("No image uploaded.");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const add_subcategory = async (req, res) => {
  try {
    const subCategoryData = await SubCategory.find({});
    return res.render("addSubCategory", {
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      subcategory: subCategoryData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const create_subcategory = async (req, res) => {
  try {
    if (req.body) {
      const sub_Category = new SubCategory({
        sub_category: req.body.name,
      });
      const subCatData = await sub_Category.save();
      console.log(subCatData);
      req.flash("successMessage", "Sub Category added!!");
      return res.redirect("/admin/add_subcategory");
    } else {
      req.flash("errorMessage", "Sub Category not added!!");
      return res.redirect("/admin/add_subcategory");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const delete_subcategory = async (req, res) => {
  try {
    const id = req.query.id;
    const subcategoryData = await SubCategory.findOne({ _id: id });
    if (subcategoryData) {
      const deleteSubcategory = await SubCategory.deleteOne({ _id: id });
      console.log("sub category deleted");
      return res.redirect("/admin/add_subcategory");
    } else {
      console.log("sub category not deleted");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listCategory = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    if (categoryData) {
      return res.render("listCategory", {
        category: categoryData,
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
      });
    } else {
      req.flash("errorMessage", "Category data not found");
      return res.redirect("/admin/listCategory");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getCategory = async (req, res) => {
  try {
    const subCategoryData = await SubCategory.find();
    return res.render("addCategory", {
      subCategory: subCategoryData,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const name = req.body.name;
    const availability = req.body.status;
    const toppings = req.body.checkbox;
    if (!name || !availability || !toppings) {
      req.flash("errorMessage", "Please fill all fields");
      return res.redirect("/admin/addCategory");
    }
    const checkCategory = await Category.findOne({ name: name });
    if (checkCategory) {
      req.flash("errorMessage", "Category name already exists!!");
      return res.redirect("/admin/addCategory");
    }
    var status;
    if (availability === "Available") {
      status = true;
    } else {
      status = false;
    }

    const categoryData = await Category.findOne({
      name: { $regex: new RegExp(name, "i") },
    });
    if (categoryData) {
      req.flash("successMessage", "Category already saved");
      return res.redirect("/admin/addCategory");
    } else {
      const category = new Category({
        name: name,
        status: status,
        toppings: toppings,
      });
      const createCategory = await category.save();
      if (createCategory) {
        console.log("category saved successfully", createCategory);
        req.flash("successMessage", "Category saved successfully");
        return res.redirect("/admin/listCategory");
      } else {
        req.flash("errorMessage", "Category not saved. Something happened ");
        return res.redirect("/admin/addCategory");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getForgetPassword = async (req, res) => {
  try {
    return res.render("forgotPassword", {
      message: req.flash("message"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email, is_admin: true });
    if (!userData) {
      console.log("User not an admin");
      req.flash("message", "User not an admin!!");
      return res.redirect("/admin/forgetPassword");
    } else {
      const token = randomstring.generate();
      const data = await User.updateOne(
        { email: email },
        { $set: { token: token } }
      );
      sendResetPasswordmail(userData.firstName, userData.email, token);
      console.log("check your mails");
      req.flash(
        "message",
        "Please check your mail for the password reset link!!"
      );
      return res.redirect("/admin/forgetPassword");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getResetPassword = async (req, res) => {
  try {
    const token = req.query.token;
    console.log(token);

    return res.render("resetPassword", {
      message: req.flash("message"),
      token: token,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const resetPassword = async (req, res) => {
  try {
    const token = req.body.token;
    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      const password = req.body.password;
      const newPassword = await securePassword(password);
      await User.findByIdAndUpdate(
        tokenData._id,
        { $set: { password: newPassword, token: "" } },
        { new: true }
      );

      console.log("Password updated successfully");
      req.flash("successMessage", "Password updated successfully!!");
      return res.redirect("/admin/login");
    } else {
      console.log("Link expired");
      req.flash("errorMessage", "Link expired!! Please try again!!");
      return res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error.message);
    req.flash("message", "An error occurred! Please try again.");
    return res.redirect("/admin/reset-Password");
  }
};

const editCategory = async (req, res) => {
  try {
    const categoryData = await Category.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          status: req.body.status,
          toppings: req.body.checkbox,
        },
      }
    );
    if (categoryData) {
      req.flash("successMessage", "Category updated Successfully");
      return res.redirect("/admin/listCategory");
    } else {
      console.log("Something happened");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById({ _id: id });
    const subcategoryData = await SubCategory.find({});

    if (categoryData) {
      return res.render("editCategory", {
        category: categoryData,
        subcategory: subcategoryData,
      });
    } else {
      req.flash("errorMessage", "Category not found");
      return res.redirect("listCategory");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    await Category.deleteOne({ _id: id });
    req.flash("successMessage", "Deleted Successfully");
    return res.redirect("/admin/listCategory");
  } catch (error) {
    console.log(error.message);
  }
};

const getUser = async (req, res) => {
  try {
    const userData = await User.find({});
    return res.render("editUser", {
      user: userData,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const editUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findOne({ _id: id });
    if (userData) {
      if (userData.blocked === true) {
        userData.blocked = false;
      } else {
        userData.blocked = true;
      }
      const updateData = await User.findByIdAndUpdate(
        { _id: id },
        { $set: { blocked: userData.blocked } }
      );
      console.log(updateData.blocked);
      console.log(updateData);
      console.log(userData.blocked);
      if (userData.blocked === true) {
        req.flash(
          "successMessage",
          userData.firstName +
            " " +
            userData.lastName +
            " is blocked successfully"
        );
        return res.redirect("/admin/editUser");
      } else {
        req.flash(
          "successMessage",
          userData.firstName +
            " " +
            userData.lastName +
            " is unblocked successfully"
        );
        return res.redirect("/admin/editUser");
      }
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listOrders = async (req, res) => {
  try {
    const orderData = await Order.find({})
      .sort({ created_at: -1 })
      .populate("user")
      .populate("products.product");
    return res.render("listOrders", {
      order: orderData,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getUpdateStatusPage = async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await Order.findOne({ _id: orderId });
    return res.render("updateStatus", {
      orders: orderData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    console.log(req.body);
    const orderData = await Order.findOne({ _id: id });
    console.log(orderData);
    if (orderData) {
      const updateOrder = await Order.findOneAndUpdate(
        { _id: id },
        { $set: { status: status } }
      );
      console.log(updateOrder);
      if (status == "Cancelled") {
        for (const product of orderData.products) {
          const productStatus = await Order.findOneAndUpdate(
            { _id: id },
            { $set: { "product.$.productStatus": false } }
          );
          console.log(productStatus);
        }
      }
      req.flash("successMessage", "Order updated successfully!!");
      return res.redirect("/admin/listOrders");
    } else {
      console.log("order not found");
      req.flash("successMessage", "Order not found!!");
      return res.redirect("/admin/listOrders");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listStock = async (req, res) => {
  try {
    const productData = await Product.find({ is_Deleted: false });
    console.log(productData);
    return res.render("listStock", {
      product: productData,
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getAddStock = async (req, res) => {
  try {
    const productData = await Product.find({});
    console.log(productData);
    return res.render("addStock", {
      product: productData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addStock = async (req, res) => {
  try {
    const { type, productId, quantity } = req.body;
    console.log(req.body);
    const productData = await Product.findOne({ _id: productId });
    if (productData) {
      if (type == "purchase") {
        const updatedQuantity =
          parseInt(productData.stock) + parseInt(quantity);

        const updateStock = await Product.findOneAndUpdate(
          { _id: productId },
          { $set: { stock: updatedQuantity } }
        );
        console.log(updateStock);
        if (updateStock) {
          req.flash("successMessage", "Stock updated Successfully");
          return res.redirect("/admin/listStock");
        } else {
          req.flash(
            "errorMessage",
            "Couldnt update stock. Something went wrong!!"
          );
          return res.redirect("/admin/listStock");
        }
      }
      if (type == "sale") {
        if (productData.stock >= quantity) {
          const updatedQuantity =
            parseInt(productData.stock) - parseInt(quantity);
          const updateStock = await Product.findOneAndUpdate(
            { _id: productId },
            { $set: { stock: updatedQuantity } }
          );
          console.log(updateStock);
          if (updateStock) {
            req.flash("successMessage", "Stock updated Successfully");
            return res.redirect("/admin/listStock");
          }
        } else {
          req.flash("errorMessage", "Sufficient quantity is not in stock!!");
          return res.redirect("/admin/listStock");
        }
      }
    } else {
      const newStockData = new Stock({
        type: type,
        product: productId,
        quantity: quantity,
      });
      const savedData = await newStockData.save();
      console.log(savedData);
      if (savedData) {
        req.flash("successMessage", "Stock added successfully!!");
        return res.redirect("/admin/listStock");
      } else {
        req.flash("errorMessage", "Something wrong!!");
        return res.redirect("/admin/listStock");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listCoupons = async (req, res) => {
  try {
    const productOffer = await ProductOffer.find().populate("product");
    const categoryOffer = await CategoryOffer.find().populate("category");
    const referralOffer = await ReferralOffer.find();
    for (item of referralOffer) {
      console.log(item.expiresAt);
      if (item.expiresAt <= Date.now()) {
        const updateData = await ReferralOffer.updateOne(
          { _id: item._id },
          { $set: { active: false } }
        );
      }
    }

    for (item of categoryOffer) {
      if (item.expiresAt <= Date.now()) {
        const updateData = await CategoryOffer.updateOne(
          { _id: item._id },
          { $set: { active: false } }
        );
      }
    }
    for (item of productOffer) {
      console.log(item.expiresAt);
      if (item.expiresAt <= Date.now()) {
        const updateData = await ProductOffer.updateOne(
          { _id: item._id },
          { $set: { active: false } }
        );
      }
    }
    return res.render("listCoupons", {
      successMessage: req.flash("successMessage"),
      errorMessage: req.flash("errorMessage"),
      productOffer,
      categoryOffer,
      referralOffer,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getAddCategoryCouponPage = async (req, res) => {
  try {
    const categoryData = await Category.find();
    return res.render("addCategoryCoupons", {
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      categories: categoryData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getAddProductCouponPage = async (req, res) => {
  try {
    const productsData = await Product.find({ is_Deleted: false });
    return res.render("addProductCoupons", {
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      products: productsData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getAddReferralCouponPage = async (req, res) => {
  try {
    return res.render("addReferralCoupon", {
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategoryCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { code, amount, expiresAt, category } = req.body;
    const type = "category";
    if (!code || !amount || !expiresAt) {
      req.flash("errorMessage", "Please fill all fields");
      return res.redirect("/admin/addCategoryCoupons");
    }
    const existingCode = await CategoryOffer.findOne({ code: code });
    if (existingCode) {
      req.flash("errorMessage", "Code already added!!");
      return res.redirect("/admin/listCoupons");
    }
    if (category) {
      const categoryOffer = new CategoryOffer({
        code: code,
        amount: amount,
        type: type,
        expiresAt: expiresAt,
        category: category,
      });
      const saveData = await categoryOffer.save();
      if (saveData) {
        console.log("Data saved successfully");
        req.flash("successMessage", "Coupon added successfully!!");
        return res.redirect("/admin/listCoupons");
      } else {
        console.log("Data not saved");
        req.flash("errorMessage", "Coupon not added!!");
        return res.redirect("/admin/addCategoryCoupons");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addProductCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { code, amount, expiresAt, product } = req.body;
    const type = "product";
    if (!code || !amount || !expiresAt) {
      req.flash("errorMessage", "Please fill all fields");
      return res.redirect("/admin/addProductCoupons");
    }
    const existingCode = await ProductOffer.findOne({ code: code });
    if (existingCode) {
      req.flash("errorMessage", "Code already added!!");
      return res.redirect("/admin/listCoupons");
    }
    if (product) {
      const productOffer = new ProductOffer({
        code: code,
        amount: amount,
        type: type,
        expiresAt: expiresAt,
        product: product,
      });
      const saveData = await productOffer.save();
      if (saveData) {
        console.log("Data saved successfully");
        req.flash("successMessage", "Coupon added successfully!!");
        return res.redirect("/admin/listCoupons");
      } else {
        console.log("Data not saved");
        req.flash("errorMessage", "Coupon not added!!");
        return res.redirect("/admin/addProductCoupons");
      }
    } else {
      req.flash("errorMessage", "Product not found!!");
      return res.redirect("/admin/addProductCoupons");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addReferralCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { code, amount, expiresAt } = req.body;
    const type = "referral";
    if (!code || !amount || !expiresAt) {
      req.flash("errorMessage", "Please fill all fields");
      return res.redirect("/admin/addProductCoupons");
    }
    const existingCode = await ReferralOffer.findOne({ code: code });
    if (existingCode) {
      req.flash("errorMessage", "Code already added!!");
      return res.redirect("/admin/listCoupons");
    }
    const referralOffer = new ReferralOffer({
      code: code,
      amount: amount,
      type: type,
      expiresAt: expiresAt,
    });
    const saveData = await referralOffer.save();
    if (saveData) {
      console.log("Data saved successfully");
      req.flash("successMessage", "Coupon added successfully!!");
      return res.redirect("/admin/listCoupons");
    } else {
      console.log("Data not saved");
      req.flash("errorMessage", "Coupon not added!!");
      return res.redirect("/admin/addProductCoupons");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCategoryCoupon = async (req, res) => {
  try {
    console.log(req.query);
    const categoryId = req.query.id;
    const categoryData = await CategoryOffer.findOne({ _id: categoryId });
    if (categoryData) {
      const deleteData = await CategoryOffer.deleteOne({ _id: categoryId });
      if (deleteData) {
        console.log(`categoryOffer data of ${categoryId} deleted successfully`);
        req.flash("successMessage", "Offer deleted successfully");
        return res.redirect("/admin/listCoupons");
      } else {
        console.log(`categoryOffer data of ${categoryId} not deleted `);
        req.flash("errorMessage", "Offer not deleted");
        return res.redirect("/admin/listCoupons");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteProductCoupon = async (req, res) => {
  try {
    console.log(req.query);
    const couponId = req.query.id;
    const productCouponData = await ProductOffer.findOne({ _id: couponId });
    if (productCouponData) {
      const deleteData = await ProductOffer.deleteOne({ _id: couponId });
      if (deleteData) {
        console.log(`categoryOffer data of ${couponId} deleted successfully`);
        req.flash("successMessage", "Offer deleted successfully");
        return res.redirect("/admin/listCoupons");
      } else {
        console.log(`categoryOffer data of ${couponId} not deleted `);
        req.flash("errorMessage", "Offer not deleted");
        return res.redirect("/admin/listCoupons");
      }
    } else {
      req.flash("errorMessage", "Product not found");
      return res.redirect("/admin/listCoupons");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteReferralCoupon = async (req, res) => {
  try {
    console.log(req.query);
    const referralId = req.query.id;
    const referralData = await ReferralOffer.findOne({ _id: referralId });
    if (referralData) {
      const deleteData = await ReferralOffer.deleteOne({ _id: referralId });
      if (deleteData) {
        console.log(`referralOffer data of ${referralId} deleted successfully`);
        req.flash("successMessage", "Offer deleted successfully");
        return res.redirect("/admin/listCoupons");
      } else {
        console.log(`referralOffer data of ${referralId} not deleted `);
        req.flash("errorMessage", "Offer not deleted");
        return res.redirect("/admin/listCoupons");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const displaySalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    console.log(startDate, endDate);

    if (startDate && endDate) {
      filter.created_at = { $gte: new Date(startDate), $lt: new Date(endDate) };
    }

    const ordersData = await Order.find({ status: "Delivered" })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("user");

    return res.render("salesReport", {
      order: ordersData,
      startDate,
      endDate,
      errorMessage: req.flash("errorMessage"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const postSalesReport = async (req, res) => {
  try {
    var ordersData;
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      ordersData = await Order.find({
        status: "Delivered",
      })
        .sort({ created_at: -1 })
        .populate("products.product")
        .populate("user");
    } else {
      ordersData = await Order.find({
        status: "Delivered",
        created_at: { $gte: new Date(startDate), $lt: new Date(endDate) },
      })
        .sort({ created_at: -1 })
        .populate("products.product")
        .populate("user");
    }
    if (req.body.show || (!req.body.excel && !req.body.pdf)) {
      return res.render("salesReport", {
        order: ordersData,
        startDate,
        endDate,
        errorMessage: req.flash("errorMessage"),
      });
    }

    if (req.body.excel) {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.columns = [
        { header: "S No", key: "s_no", width: 10 },
        { header: "Customer name", key: "customerName", width: 30 },
        { header: "Product", key: "productName", width: 30 },
        { header: "Quantity", key: "quantity", width: 10 },
        { header: "Unit Price", key: "price", width: 15 },
        { header: "Discount", key: "discount", width: 15 },
        { header: "Total", key: "total", width: 15 },
        { header: "Order Date", key: "createdAt", width: 20 },
        { header: "Status", key: "status", width: 15 },
      ];

      let counter = 1;

      ordersData.forEach((order) => {
        let productTotal = 0;
        order.products.forEach((item) => {
          productTotal += item.product.price * item.quantity;
        });

        const discount = productTotal - order.totalPrice;
        const totalPrice = order.totalPrice;

        order.products.forEach((product, index) => {
          worksheet.addRow({
            s_no: index === 0 ? counter : "",
            customerName: `${order.user.firstName} ${order.user.lastName}`,
            productName: product.product.name,
            quantity: product.quantity,
            price: product.product.price * product.quantity,
            discount: index === 0 ? discount : "",
            total: index === 0 ? totalPrice : "",
            createdAt:
              index === 0
                ? new Date(order.created_at).toLocaleDateString()
                : "",
            status: index === 0 ? order.status : "",
          });
        });

        counter++;
      });

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment;filename=sales.xlsx");

      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    }

    if (req.body.pdf) {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = "sales_report.pdf";
      res.setHeader(
        "Content-disposition",
        'attachment;filename="' + fileName + '"'
      );
      res.setHeader("Content-type", "application/pdf");

      doc.pipe(res);
      doc.fontSize(20).text("Sales Report", { align: "center" });
      doc.moveDown(2);

      let totalDiscount = 0;
      let grandTotal = 0;

      ordersData.forEach(order => {
        totalDiscount += order.products.reduce((sum, item) => sum + item.product.price * item.quantity, 0) - order.totalPrice;
        grandTotal += order.totalPrice;
      });
      
      fromDate = new Date(startDate).toLocaleDateString();
      toDate = new Date(endDate).toLocaleDateString();
      totalDiscount = totalDiscount.toFixed(2);
      grandTotal = grandTotal.toFixed(2);
      doc
      .fontSize(12)
      .text(`Total Sales      :${grandTotal}`, { align: "left" })
      .text(`Total Discount :${totalDiscount}`, { align: "left" })
      .text(`From Date       :${fromDate}`, { align: "left" })
      .text(`To Date           :${toDate}`, { align: "left" });
    doc.moveDown(2);
    let y = 200;
    
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("S No", 30, y, { width: 40, align: "left" })
        .text("Customer Name", 70, y, { width: 100, align: "left" })
        .text("Order Date", 170, y, { width: 100, align: "left" })
        .text("Product", 250, y, { width: 100, align: "left" })
        .text("Quantity", 310, y, { width: 70, align: "right" })
        .text("Unit Price", 380, y, { width: 70, align: "right" })
        .text("Discount", 440, y, { width: 70, align: "right" })
        .text("Total", 510, y, { width: 70, align: "right" });

      doc.moveDown(1);

      let serialNo = 1;
      let total = 0;
  
        ordersData.forEach((order) => {
          const date = new Date(order.created_at).toLocaleDateString();
          const discount =
            order.products.reduce(
              (sum, item) => sum + item.product.price * item.quantity,
              0
            ) - order.totalPrice;
          total += order.totalPrice;
          let y = doc.y;

        order.products.forEach((product, index) => {
          doc
            .font("Helvetica")
            .fontSize(10)
            .text(product.product.name, 250, y, { width: 100, align: "left" })
            .text(product.quantity, 310, y, { width: 70, align: "right" })
            .text(product.product.price.toFixed(2), 380, y, {
              width: 70,
              align: "right",
            });

          if (index === 0) {
            doc
              .text(serialNo, 30, y, { width: 40, align: "left" })
              .text(`${order.user.firstName} ${order.user.lastName}`, 70, y, {
                width: 100,
                align: "left",
              })
              .text(date, 170, y, { width: 100, align: "left" })
              .text(discount.toFixed(2), 440, y, { width: 70, align: "right" })
              .text(order.totalPrice.toFixed(2), 510, y, {
                width: 70,
                align: "right",
              });
          }

          y += 20;
        });

        doc
          .moveTo(30, y)
          .lineTo(590, y)
          .strokeColor("#aaaaaa")
          .lineWidth(1)
          .stroke();

        doc.moveDown(1.5);

        serialNo++;
      });

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total", 400, doc.y, { width: 40, align: "right" })
        .text(total.toFixed(2), 530, doc.y - 10, { width: 40, align: "left" });

      doc.end();
    }
  } catch (error) {
    console.log(error.message);
  }
};

const yearlySales = async (req, res) => {
  try {
    const startYear = 2020;
    const endYear = 2024;

    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(endYear + 1, 0, 1);
    const yearlySalesData = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          created_at: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
          },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);
    console.log(yearlySalesData);
    res.json(yearlySalesData);
  } catch (error) {
    console.log(error.message);
  }
};

const monthlySales = async (req, res) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const monthlySalesData = await Order.aggregate([
      { $match: { status: "Delivered", created_at: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" },
          },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    console.log(monthlySalesData);
    res.json(monthlySalesData);
  } catch (error) {
    console.log(error.message);
  }
};

const weeklySales = async (req, res) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1);

    const weeklySalesData = await Order.aggregate([
      { $match: { status: "Delivered", created_at: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            week: { $isoWeek: "$created_at" },
          },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    console.log(weeklySalesData);
    res.json(weeklySalesData);
  } catch (error) {
    console.log(error.message);
  }
};

const dailySales = async (req, res) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1);

    const dailySalesData = await Order.aggregate([
      { $match: { status: "Delivered", created_at: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" },
            day: { $dayOfMonth: "$created_at" },
          },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
    console.log(dailySalesData);
    res.json(dailySalesData);
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    console.log("logout");
    req.session.destroy();
    console.log(req.session);
    return res.redirect("/admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  getForgetPassword,
  forgetPassword,
  resetPassword,
  getResetPassword,
  dashboard,
  listProduct,
  viewProduct,
  getProduct,
  addProduct,
  getEditProduct,
  editProduct,
  deleteProduct,
  cropImage,
  saveImage,
  add_subcategory,
  create_subcategory,
  delete_subcategory,
  listCategory,
  getCategory,
  addCategory,
  getEditCategory,
  editCategory,
  deleteCategory,
  getUser,
  editUser,
  listOrders,
  getUpdateStatusPage,
  updateStatus,
  listStock,
  getAddStock,
  addStock,
  listCoupons,
  getAddCategoryCouponPage,
  addCategoryCoupon,
  getAddProductCouponPage,
  addProductCoupon,
  getAddReferralCouponPage,
  addReferralCoupon,
  deleteCategoryCoupon,
  deleteProductCoupon,
  deleteReferralCoupon,
  displaySalesReport,
  postSalesReport,
  yearlySales,
  monthlySales,
  weeklySales,
  dailySales,
  logout,
};
