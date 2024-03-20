const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const SubCategory = require("../models/subCategoryModel");

const bcrypt = require("bcrypt");

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
            const productData = await Product.find({ is_Deleted: false }).limit(5);
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
        console.log(req.body)
        const createProduct = await product.save();
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
    logout,
    forgotPassword
}