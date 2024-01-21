const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

const bcrypt = require("bcrypt");



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        if (!req.session.admin) {
            res.render('Signin', {
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
                req.flash('errorMessage', 'Email/password');
                res.redirect('/admin/login');
            }
        }
        else {
            req.flash('errorMessage', 'Please register before login')
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const dashboard = async (req, res) => {
    try {
        if (req.session.admin) {
            res.render('dashboard');
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

const listProduct = async (req, res) => {
    try {
        if (req.session.admin) {
            const productData = await Product.find({ is_Deleted: false }).populate("category");

            if (productData) {
                res.render('listProduct', {
                    product: productData,
                    errorMessage: req.flash("errorMessage"),
                    successMessage: req.flash("successMessage")
                });
            }
            else {
                req.flash("errorMessage", "Product data not found")
                res.redirect('/admin/listproduct');
            }
        }

    } catch (error) {
        console.log(error.message);
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
        // const basePath = `${req.protocol}://${req.get('host')}/public/img/shop/`;
        console.log(req.files);
        if (req.files) {
            req.files.map(file => {
                imageFiles.push(file.filename);
            });
        }
        console.log(imageFiles);
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
        console.log(req.body)
        const createProduct = await product.save();
        if (createProduct) {
            console.log("Product Created", createProduct);
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

const editImage = async (req, res) => {
    try {
        console.log(req.query.id);

        const productData = await Product.find({ _id: req.query.id });
        console.log(productData.images[0])

        res.render('resizeImage', { product: productData });
    } catch (error) {
        console.log(error);
    }
}

const resizeImage = async (req, res) => {
    try {
        const resizedImageBuffer = await sharp(req.file.buffer).resize(Number(req.body.width), Number(req.body.height)).toBuffer();
        console.log(resizedImageBuffer);
        res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Disposition": 'attachment;filename="resized_image.png"'
        })
        res.end(resizedImageBuffer)
    }
    catch (error) {
        console.log(error)
    }
}

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;

        const productData = await Product.findById({ _id: id })
        const categoryData = await Category.find({});
        res.render('editProduct', {
            product: productData,
            category: categoryData
        })
    } catch (error) {
        console.log(error.message);
    }
}

const editProduct = async (req, res) => {
    try {
        const imageFiles = [];
        // const basePath = `${req.protocol}://${req.get('host')}/public/img/shop/`;
        console.log(req.files);
        if (req.files) {
            req.files.map(file => {
                imageFiles.push(file.filename);
            });
        }
        console.log(req.body);
        const productData = await Product.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                name: req.body.name,
                price: req.body.price,
                images: imageFiles,
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
        console.log(error.message);
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
        res.render("addCategory", {
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
        var status;
        if (availability === 'Available') {
            status = true;
        } else {
            status = false;
        }
        let categoryData = await Category.findOne({ name });
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
        if (categoryData) {
            res.render('editCategory', { category: categoryData });
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
                req.flash('successMessage', userData.name + ' is blocked successfully');
                res.redirect('/admin/editUser');
            } else {

                req.flash('successMessage', userData.name + ' is unblocked successfully');
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

const logout = async (req, res) => {
    try {
        console.log("logout");

        req.session.destroy();
        console.log(req.session);
        res.redirect("/admin");


    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    dashboard,
    listProduct,
    getProduct,
    addProduct,
    getEditProduct,
    editProduct,
    editImage,
    resizeImage,
    deleteProduct,
    listCategory,
    getCategory,
    addCategory,
    getEditCategory,
    editCategory,
    deleteCategory,
    getUser,
    editUser,
    logout,
    forgotPassword
}