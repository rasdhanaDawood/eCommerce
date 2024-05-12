const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const SubCategory = require("../models/subCategoryModel");
const Order = require("../models/ordersModel");
const { ProductOffer, CategoryOffer, ReferralOffer } = require("../models/offerModel");
const Sales = require("../models/salesModel");
const excelJS = require('exceljs')

const bcrypt = require("bcrypt");

const loadLogin = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.render('signin', {
                errorMessage: req.flash("errorMessage"),
                successMessage: req.flash("successMessage")
            });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_admin === true) {
                req.session.admin = userData._id;

                res.redirect('/admin/dashboard');
            }
            else {
                req.flash('errorMessage', 'Incorrect Email/password');
                res.redirect('/admin/login');
            }
        }
        else {
            req.flash('errorMessage', 'Please register or create an account')
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const dashboard = async (req, res) => {
    try {
        if (req.session.admin) {
            const productData = await Product.find({ is_Deleted: false }).sort({ rating: -1 }).limit(10);
            res.render('dashboard', { product: productData });
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const listProduct = async (req, res) => {
    try {
        var productData = await Product.find({ is_Deleted: false }).populate('category');
        const categoryData = await Category.find({})
        if (req.query) {
            console.log(req.query);
            let category = req.query.category;
            let featured = req.query.featured;

            console.log(`Categories selected: ${category}`)
            if (category) {
                if (featured) {
                    productData = await Product.find({ category: category, is_Featured: true, is_Deleted: false }).populate('category');
                    console.log(productData)
                } else {
                    productData = await Product.find({ category: category, is_Deleted: false }).populate('category');
                    console.log(productData)
                }
            } else if (featured == 'true') {
                productData = await Product.find({ is_Featured: true, is_Deleted: false }).populate('category');
                console.log(productData)
            } else {
                productData = await Product.find({ is_Deleted: false }).populate('category');
                console.log(productData)
            }
        }
        if (productData) {
            res.render('listProduct', {
                product: productData,
                category: categoryData,
                errorMessage: req.flash("errorMessage"),
                successMessage: req.flash("successMessage")
            })
        }
        else {
            req.flash("errorMessage", "Product data not found")
            res.redirect('/admin/listproduct');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const viewProduct = async (req, res) => {
    try {
        let id = req.query.id;
        const productData = await Product.findById({ _id: id }).populate('category');
        res.render('viewProduct', {
            Product: productData
        })
    } catch (error) {
        console.log(error.message)
    }
}

const getProduct = async (req, res) => {
    try {
        const categoryData = await Category.find({});
        res.render('addProduct', { category: categoryData });
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async (req, res) => {
    try {
        const imageFiles = [];
        console.log(req.files);
        console.log(req.body);
        const productData = await Product.findOne({ name: req.body.productname });
        if (productData) {
            req.flash("errorMessage", "Product already exists!!")
            res.redirect('/admin/listProduct');
        }
        if (req.files) {
            req.files.map(file => {
                imageFiles.push(file.filename);
            });
        }
        console.log(imageFiles)

        const product = new Product({
            name: req.body.productname,
            price: req.body.price,
            images: imageFiles,
            short_description: req.body.shortDesc,
            detail_description: req.body.detailDesc,
            is_Featured: req.body.isFeatured,
            is_Deleted: req.body.isDeleted,
            rating: req.body.rating,
            category: req.body.category,
            stock: req.body.stock
        });
        const createProduct = await product.save();
        console.log(createProduct);

        if (createProduct) {
            req.flash("successMessage", "Product created successfully")
            res.redirect('/admin/listProduct');
        }
        else {
            req.flash("errorMessage", "Something went wrong")
            res.redirect('/admin/listProduct');
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id);
        if (id) {
            const productData = await Product.findById({ _id: id })
            const categoryData = await Category.find({});
            res.render('editProduct', {
                Product: productData,
                Category: categoryData
            })
        }
        else {
            req.flash("errorMessage", "Something went wrong")
            res.redirect("/admin/listProduct");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editProduct = async (req, res) => {
    try {
        console.log(req.body);
        console.log(req.query);

        let id = req.body.id;
        console.log(req.body);
        let images = [];
        console.log(req.files)
        if (!req.files.image1) {
            images.push(req.body.image1);
        } else {
            images.push(req.files.image1[0].originalname);
            console.log(req.files.image1[0].originalname)

        }
        if (!req.files.image2) {
            images.push(req.body.image2);
        } else {
            images.push(req.files.image2[0].originalname);
            console.log(req.files.image2[0].originalname)

        }
        if (!req.files.image3) {
            images.push(req.body.image3);
        } else {
            images.push(req.files.image3[0].originalname);
            console.log(req.files.image3[0].originalname)

        }

        console.log(req.body.id);
        const productData = await Product.findByIdAndUpdate({ _id: id }, {
            $set: {
                name: req.body.name,
                price: req.body.price,
                images: images,
                short_description: req.body.shortDesc,
                detail_description: req.body.detailDesc,
                is_Featured: req.body.isFeatured,
                is_Deleted: req.body.isDeleted,
                rating: req.body.rating,
                category: req.body.category,
                stock: req.body.stock
            }
        });
        if (productData) {
            console.log("Update successfull");
            req.flash("successMessage", "Product updated successfully!!");
            res.redirect('/admin/listProduct');
        }
        else {
            req.flash("errorMessage", "Something went wrong!!updation failed!")
            res.redirect('/admin/listProduct');
        }
    } catch (error) {
        res.render("error", {
            message: error.message
        });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findOne({ _id: id });
        if (productData) {
            const deleteProduct = await Product.findByIdAndUpdate({ _id: id }, { $set: { is_Deleted: true } });
            req.flash("successMessage", "Product deleted successfully!!")
            res.redirect('/admin/listProduct');
        } else {
            req.flash("errorMessage", "Something went wrong!!");
            res.redirect('/admin/listProduct');
        }
    } catch (error) {
        console.log(error.message)
    }
}
const cropImage = async (req, res) => {
    try {
        const img = req.query.image;
        console.log(img);
        res.render('cropImage', { image: img });
    } catch (error) {
        console.log(error.message);
    }
}


const add_subcategory = async (req, res) => {
    try {
        const subCategoryData = await SubCategory.find({});
        res.render('addSubCategory', {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            subcategory: subCategoryData
        });

    } catch (error) {
        console.log(error.message)
    }
}

const create_subcategory = async (req, res) => {
    try {
        if (req.body) {
            const sub_Category = new SubCategory({
                sub_category: req.body.name
            });
            const subCatData = await sub_Category.save();
            console.log(subCatData);
            req.flash("successMessage", "Sub Category added!!");
            res.redirect('/admin/add_subcategory');
            console.log("subcategory saved successfully")
        } else {
            req.flash("errorMessage", "Sub Category not added!!");
            res.redirect('/admin/add_subcategory');
        }
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

const delete_subcategory = async (req, res) => {
    try {
        const id = req.query.id;
        const subcategoryData = await SubCategory.findOne({ _id: id });
        if (subcategoryData) {
            const deleteSubcategory = await SubCategory.deleteOne({ _id: id });
            console.log("sub category deleted")
            res.redirect('/admin/add_subcategory');
        } else {
            console.log("sub category not deleted")
        }
    } catch (error) {
        console.log(error.message)
    }
}

const listCategory = async (req, res) => {
    try {
        const categoryData = await Category.find({});
        if (categoryData) {
            res.render('listCategory', {
                category: categoryData,
                errorMessage: req.flash("errorMessage"),
                successMessage: req.flash("successMessage")
            });
        }
        else {
            req.flash("errorMessage", "Category data not found")
            res.redirect('/admin/listCategory');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getCategory = async (req, res) => {
    try {
        const subCategoryData = await SubCategory.find();
        res.render("addCategory", {
            subCategory: subCategoryData,
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage")
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const addCategory = async (req, res) => {
    try {
        const name = req.body.name;
        const availability = req.body.status
        const toppings = req.body.checkbox;
        if (!name || !availability || !toppings) {
            req.flash("errorMessage", "Please fill all fields");
            res.redirect("/admin/addCategory")
        }
        const checkCategory = await Category.find({ name: name });
        if (checkCategory) {
            req.flash("errorMessage", "Category name already exists!!");
            res.redirect("/admin/addCategory")
        }
        var status;
        if (availability === 'Available') {
            status = true;
        } else {
            status = false;
        }


        const categoryData = await Category.findOne({
            name: { $regex: new RegExp(name, 'i') }
        });
        if (categoryData) {
            req.flash("successMessage", "Category already saved");
            res.redirect("/admin/addCategory")
        }
        else {
            const category = new Category({
                name: name,
                status: status,
                toppings: toppings
            });
            const createCategory = await category.save();
            if (createCategory) {
                console.log("category saved successfully", createCategory);
                req.flash("successMessage", "Category saved successfully")
                res.redirect("/admin/listCategory")
            }
            else {
                req.flash("errorMessage", "Category not saved. Something happened ")
                res.redirect("/admin/addCategory")
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const forgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword');

    }
    catch (error) {
        console.log(error.message);
    }
}

const editCategory = async (req, res) => {
    try {
        const categoryData = await Category.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, status: req.body.status, toppings: req.body.checkbox } });
        if (categoryData) {
            req.flash("successMessage", "Category updated Successfully")
            res.redirect('/admin/listCategory');

        }
        else {
            console.log("Something happened")
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getEditCategory = async (req, res) => {
    try {

        const id = req.query.id;
        const categoryData = await Category.findById({ _id: id })
        const subcategoryData = await SubCategory.find({})

        if (categoryData) {
            res.render('editCategory', {
                category: categoryData,
                subcategory: subcategoryData
            });
        }
        else {
            req.flash("errorMessage", "Category not found")
            res.redirect('listCategory')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCategory = async (req, res) => {
    try {

        const id = req.query.id;
        await Category.deleteOne({ _id: id });
        req.flash("successMessage", "Deleted Successfully");
        res.redirect('/admin/listCategory');
    } catch (error) {
        console.log(error.message);
    }
}

const getSubCategory = async (req, res) => {
    try {
        // res.render('addSubCategory');
    } catch (error) {
        console.log(error);
    }
}
const getUser = async (req, res) => {
    try {
        const userData = await User.find({});
        res.render('editUser', {
            user: userData,
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')

        });
    } catch (error) {
        console.log(error.message)
    }
}

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
            const updateData = await User.findByIdAndUpdate({ _id: id }, { $set: { blocked: userData.blocked } });
            console.log(updateData.blocked);
            console.log(updateData);
            console.log(userData.blocked);
            if (userData.blocked === true) {
                req.flash('successMessage', userData.firstName + ' ' + userData.lastName + ' is blocked successfully');
                res.redirect('/admin/editUser');
            } else {

                req.flash('successMessage', userData.firstName + ' ' + userData.lastName + ' is unblocked successfully');
                res.redirect('/admin/editUser');
            }
        }
        else {
            console.log("User not found")
        }

    } catch (error) {
        console.log(error.message)
    }
}

const listOrders = async (req, res) => {
    try {
        const orderData = await Order.find({}).populate('user').populate('products.product');
        console.log(orderData);
        res.render("listOrders", {
            order: orderData,
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')
        });

    } catch (error) {
        console.log(error.message);
    }
}

const getUpdateStatusPage = async (req, res) => {
    try {
        const orderId = req.query.id;
        const orderData = await Order.findOne({ _id: orderId });
        //  const productsWithFalseStatus = await Order.aggregate([
        //     { $match: { _id: mongoose.Types.ObjectId(orderId) } }, // Match the order by its ID
        //     { $unwind: '$products' }, // Unwind the products array
        //     { $match: { 'products.status': false } }, // Match products with status as false
        //     { $project: { _id: 0, product: '$products' } } // Project only the product fields
        // ]);
        res.render("updateStatus", {
            orders: orderData
        })
    } catch (error) {
        console.log(error.message);
    }
}

const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        console.log(req.body);
        const orderData = await Order.findOne({ _id: id });
        console.log(orderData);
        if (orderData) {
            const updateOrder = await Order.findOneAndUpdate({ _id: id }, { $set: { status: status } });
            console.log(updateOrder);
            req.flash("successMessage", "Order updated successfully!!");
            res.redirect("/admin/listOrders");
        } else {
            console.log("order not found");
            req.flash("successMessage", "Order not found!!");
            res.redirect("/admin/listOrders");
        }

    } catch (error) {
        console.log(error.message);
    }
}

const listStock = async (req, res) => {
    try {
        const productData = await Product.find({ is_Deleted: false });
        console.log(productData);
        res.render("listStock", {
            product: productData,
            errorMessage: req.flash('errorMessage'),
            successMessage: req.flash('successMessage')
        });
    } catch (error) {
        console.log(error.message);
    }
}

const getAddStock = async (req, res) => {
    try {
        const productData = await Product.find({});
        console.log(productData);
        res.render("addStock", {
            product: productData
        });
    } catch (error) {
        console.log(error.message);
    }
}

const addStock = async (req, res) => {
    try {
        const { type, productId, quantity } = req.body;
        console.log(req.body);
        const productData = await Product.findOne({ _id: productId });
        if (productData) {
            if (type == 'purchase') {
                const updatedQuantity = parseInt(productData.stock) + parseInt(quantity);

                const updateStock = await Product.findOneAndUpdate({ _id: productId }, { $set: { stock: updatedQuantity } });
                console.log(updateStock);
                if (updateStock) {
                    req.flash("successMessage", "Stock updated Successfully");
                    res.redirect("/admin/listStock");
                }
                else {
                    req.flash("errorMessage", "Couldnt update stock. Something went wrong!!");
                    res.redirect("/admin/listStock");
                }
            }
            if (type == 'sale') {
                if (productData.stock >= quantity) {
                    const updatedQuantity = productData.quantity - quantity;
                    const updateStock = await Product.findOneAndUpdate({ _id: productId }, { $set: { stock: updatedQuantity } });
                    console.log(updateStock);
                    if (updateStock) {
                        req.flash("successMessage", "Stock updated Successfully");
                        res.redirect("/admin/listStock");
                    }
                }
                else {
                    req.flash("errorMessage", "Sufficient quantity is not in stock!!");
                    res.redirect("/admin/listStock");
                }
            }
        } else {
            const newStockData = new Stock({
                type: type,
                product: productId,
                quantity: quantity
            });
            const savedData = await newStockData.save();
            console.log(savedData);
            if (savedData) {
                req.flash("successMessage", "Stock added successfully!!")
                res.redirect("/admin/listStock")
            } else {
                req.flash("errorMessage", "Something wrong!!")
                res.redirect("/admin/listStock")
            }

        }

    } catch (error) {
        console.log(error.message);
    }
}

const listCoupons = async (req, res) => {

    try {
        const productOffer = await ProductOffer.find().populate('product');
        const categoryOffer = await CategoryOffer.find().populate('category');
        const referralOffer = await ReferralOffer.find();
        for (item of referralOffer) {
            console.log(item.expiresAt);
            if (item.expiresAt <= Date.now()) {
                const updateData = await ReferralOffer.updateOne({ _id: item._id }, { $set: { active: false } });
            }
        }

        for (item of categoryOffer) {
            if (item.expiresAt <= Date.now()) {
                const updateData = await CategoryOffer.updateOne({ _id: item._id }, { $set: { active: false } });
            }
        }
        for (item of productOffer) {
            console.log(item.expiresAt);
            if (item.expiresAt <= Date.now()) {
                const updateData = await ProductOffer.updateOne({ _id: item._id }, { $set: { active: false } });
            }
        }
        res.render('listCoupons', {
            successMessage: req.flash('successMessage'),
            errorMessage: req.flash('errorMessage'),
            productOffer,
            categoryOffer,
            referralOffer
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const getAddCategoryCouponPage = async (req, res) => {
    try {
        const categoryData = await Category.find();
        res.render("addCategoryCoupons", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            categories: categoryData
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const getAddProductCouponPage = async (req, res) => {
    try {
        const productsData = await Product.find();
        res.render("addProductCoupons", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            products: productsData
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const getAddReferralCouponPage = async (req, res) => {
    try {
        res.render("addReferralCoupon", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage")
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

const addCategoryCoupon = async (req, res) => {
    try {
        console.log(req.body);
        const { code, amount, type, expiresAt, category } = req.body;
        if (!code || !amount || !type || !expiresAt) {
            req.flash("errorMessage", "Please fill all fields");
            res.redirect('/admin/addCategoryCoupons')
        }
        const existingCode = await CategoryOffer.findOne({ code: code });
        if (existingCode) {
            req.flash("errorMessage", "Code already added!!");
            res.redirect('/admin/listCoupons')
        }
        if (category && type == 'category') {
            const categoryOffer = new CategoryOffer({
                code: code,
                amount: amount,
                type: type,
                expiresAt: expiresAt,
                category: category
            });
            const saveData = await categoryOffer.save();
            if (saveData) {
                console.log("Data saved successfully");
                req.flash('successMessage', 'Coupon added successfully!!')
                res.redirect('/admin/listCoupons')

            } else {
                console.log("Data not saved");
                req.flash('errorMessage', 'Coupon not added!!')
                res.redirect('/admin/addCategoryCoupons')

            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const addProductCoupon = async (req, res) => {
    try {
        console.log(req.body);
        const { code, amount, type, expiresAt, product } = req.body;
        if (!code || !amount || !type || !expiresAt) {
            req.flash("errorMessage", "Please fill all fields");
            res.redirect('/admin/addProductCoupons')
        }
        const existingCode = await ProductOffer.findOne({ code: code });
        if (existingCode) {
            req.flash("errorMessage", "Code already added!!");
            res.redirect('/admin/listCoupons')
        }
        if (product && type == 'product') {
            const productOffer = new ProductOffer({
                code: code,
                amount: amount,
                type: type,
                expiresAt: expiresAt,
                product: product
            });
            const saveData = await productOffer.save();
            if (saveData) {
                console.log("Data saved successfully");
                req.flash('successMessage', 'Coupon added successfully!!')
                res.redirect('/admin/listCoupons')
            }
            else {
                console.log("Data not saved");
                req.flash('errorMessage', 'Coupon not added!!')
                res.redirect('/admin/addProductCoupons')

            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const addReferralCoupon = async (req, res) => {
    try {
        console.log(req.body);
        const { code, amount, type, expiresAt } = req.body;
        if (!code || !amount || !type || !expiresAt) {
            req.flash("errorMessage", "Please fill all fields");
            res.redirect('/admin/addProductCoupons')
        }
        const existingCode = await ReferralOffer.findOne({ code: code });
        if (existingCode) {
            req.flash("errorMessage", "Code already added!!");
            res.redirect('/admin/listCoupons')
        }
        const referralOffer = new ReferralOffer({
            code: code,
            amount: amount,
            type: type,
            expiresAt: expiresAt
        });
        const saveData = await referralOffer.save();
        if (saveData) {
            console.log("Data saved successfully");
            req.flash('successMessage', 'Coupon added successfully!!')
            res.redirect('/admin/listCoupons')
        }
        else {
            console.log("Data not saved");
            req.flash('errorMessage', 'Coupon not added!!')
            res.redirect('/admin/addProductCoupons')
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const deleteCategoryCoupon = async (req, res) => {
    try {
        console.log(req.query);
        const categoryId = req.query.id;
        const categoryData = await CategoryOffer.findOne({ category: categoryId });
        if (categoryData) {
            const deleteData = await CategoryOffer.deleteOne({ category: categoryId });
            if (deleteData) {
                console.log(`categoryOffer data of ${categoryId} deleted successfully`)
                req.flash('successMessage', "Offer deleted successfully");
                res.redirect('/admin/listCoupons')
            }
            else {
                console.log(`categoryOffer data of ${categoryId} not deleted `)
                req.flash('errorMessage', "Offer not deleted");
                res.redirect('/admin/listCoupons')
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const deleteProductCoupon = async (req, res) => {
    try {
        console.log(req.query);
        const productId = req.query.id;
        const productData = await ProductOffer.findOne({ product: productId });
        if (productData) {
            const deleteData = await ProductOffer.deleteOne({ product: productId });
            if (deleteData) {
                console.log(`categoryOffer data of ${categoryId} deleted successfully`)
                req.flash('successMessage', "Offer deleted successfully");
                res.redirect('/admin/listCoupons')
            }
            else {
                console.log(`categoryOffer data of ${categoryId} not deleted `)
                req.flash('errorMessage', "Offer not deleted");
                res.redirect('/admin/listCoupons')
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const deleteReferralCoupon = async (req, res) => {
    try {
        console.log(req.query);
        const referralId = req.query.id;
        const referralData = await ReferralOffer.findOne({ _id: referralId });
        if (referralData) {
            const deleteData = await ReferralOffer.deleteOne({ _id: referralId });
            if (deleteData) {
                console.log(`referralOffer data of ${referralId} deleted successfully`)
                req.flash('successMessage', "Offer deleted successfully");
                res.redirect('/admin/listCoupons')
            }
            else {
                console.log(`referralOffer data of ${referralId} not deleted `)
                req.flash('errorMessage', "Offer not deleted");
                res.redirect('/admin/listCoupons')
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}


const displaySalesReport = async (req, res) => {
    try {
        const ordersData = await Order.find({ status: 'Delivered' }).populate('products.product').populate('user');
        res.render('salesReport', {
            order: ordersData
        });
    } catch (error) {
        console.log(error.message);
    }
}

const chartData = async (req, res) => {
    try {
        const filter = req.query.filter;
        let data;
        const sales = await Order.find({ status: 'Delivered' });


        if (filter === 'weekly') {

            const today = new Date();
            const startOfWeek = new Date(today);
            console.log(startOfWeek)
            startOfWeek.setDate(startOfWeek.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            console.log(startOfWeek)

            const endOfWeek = new Date(today);
            console.log(endOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            endOfWeek.setHours(23, 59, 59, 999);
            console.log(endOfWeek)
            const weeklySales = await Order.find({ created_at: { $gte: startOfWeek, $lt: endOfWeek } });
            console.log(weeklySales)
            data = {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                values: [10, 20, 15, 25]
            };
        } else if (filter === 'monthly') {

            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            console.log(startOfMonth)
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            console.log(endOfMonth)
            const monthlySales = await Order.find({
                createdAt: { $gte: startOfMonth, $lt: endOfMonth }
            });
            console.log(monthlySales)
            data = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                values: [30, 25, 40, 35]
            };
        }
        else if (filter === 'yearly') {

            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            startOfYear.setHours(0, 0, 0, 0);
            console.log(startOfYear)
            const endOfYear = new Date(today.getFullYear(), 12, 0);
            endOfYear.setHours(23, 59, 59, 999);
            console.log(endOfYear)
            const yearlySales = await YourModel.find({
                createdAt: { $gte: startOfYear, $lt: endOfYear }
            });
            console.log(yearlySales)
            data = {
                labels: ['2020', '2021', '2022', '2023', '2024'],
                values: [30, 25, 40, 35, 25]
            };
        }
        res.json(data);
    }

    catch (error) {
        console.log(error.message);
    }
}

const exportDataExcel = async (req, res) => {
    try {
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
        worksheet.columns = [
            { header: 'S No', key: 's_no' },
            { header: 'Customer name', key: 'customerName' },
            { header: 'Product', key: 'productName' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Order Date', key: 'createdAt' },
            { header: 'Status', key: 'status' },
        ];

        let counter = 1;
        const salesData = await Order.find({ status: 'Delivered' }).populate('products.product').populate('user');
        salesData.forEach((sale) => {
            sale.products.forEach((product) => {
                worksheet.addRow({
                    s_no: counter,
                    customerName: `${sale.user.firstName} ${sale.user.lastName}`,
                    productName: product.product.name,
                    quantity: product.quantity,
                    createdAt: sale.created_at,
                    status: sale.status
                });
                counter++;
            });
        });
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        res.setHeader(
            "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment;filename=sales.xlsx");

        return workbook.xlsx.write(res).then(() => {
            res.status(200);
        });

    }
    catch (error) {
        console.log(error.message);
    }
}



const logout = async (req, res) => {
    try {
        console.log("logout");
        req.session.destroy();
        console.log(req.session);
        res.redirect("/admin/login");

    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    dashboard,
    listProduct,
    viewProduct,
    getProduct,
    addProduct,
    getEditProduct,
    editProduct,
    deleteProduct,
    cropImage,
    add_subcategory,
    create_subcategory,
    delete_subcategory,
    listCategory,
    getCategory,
    addCategory,
    getEditCategory,
    editCategory,
    deleteCategory,
    getSubCategory,
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
    chartData,
    exportDataExcel,
    logout,
    forgotPassword
}