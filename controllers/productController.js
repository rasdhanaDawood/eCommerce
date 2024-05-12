const Product = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");

const viewProduct = async (req, res) => {
    try {
        const id = req.query.id;
        if (id) {
            const productData = await Product.find({ _id: id }).populate('category');
            const userData = req.session.user;
            console.log(userData);
            console.log(productData);
            const allProductsData = await Product.find({ is_Deleted: false });
            res.render('product', {
                user: userData,
                product: productData,
                allProducts: allProductsData
            });
        } else {
            res.redirect('/shop');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const viewAllProducts = async (req, res) => {
    try {
        console.log(req.query);
        const selectedCategory = req.query.category;
        const sortOption = req.query.sort;
        var productData = await Product.find({ is_Deleted: false });

        if (selectedCategory) {
            if (selectedCategory == 'All') {

            } else {
                productData = await Product.find({ category: selectedCategory, is_Deleted: false });
            }
        }
        if (sortOption) {
            switch (sortOption) {
                case 'nameAsc': productData = await Product.find({ is_Deleted: false }).sort({ name: 1 });
                    break;
                case 'nameDesc': productData = await Product.find({ is_Deleted: false }).sort({ name: -1 });
                    break;
                case 'lowToHigh': productData = await Product.find({ is_Deleted: false }).sort({ price: 1 });
                    break;
                case 'highToLow': productData = await Product.find({ is_Deleted: false }).sort({ price: -1 });
                    break;
                case 'rating': productData = await Product.find({ is_Deleted: false }).sort({ rating: -1 });
                    break;
                case 'featured': productData = await Product.find({ is_Deleted: false, is_Featured: true }).sort({ name: 1 });
                    break;
                default: console.log("Something happened");
                    break;
            }
        }
        console.log(productData);
        const userId = req.session.user;
        const userData = await User.find({ _id: userId });
        const categoryData = await Category.find();

        if (req.xhr) {
            res.json(productData);
        } else {
            res.render('shop', {
                user: userId,
                category: categoryData,
                product: productData
            })
        }
    } catch (error) {
        console.log(error.message)
    }
}

const searchProduct = async (req, res) => {

    const userId = req.session.user;
    const userData = await User.find({ _id: userId });
    const categoryData = await Category.find();
    console.log(req.query);
    const search = req.query.name;
    const selectedCategory = req.query.category;
    try {
        const productData = await Product.find({
            $or: [{ category: selectedCategory }, {
                name: {
                    $regex: ".*" + search + ".*", $options: "i"
                }
            }]
        });

        if (productData) {
            console.log("found" + productData);
            res.render('shop', {
                user: userData,
                category: categoryData,
                product: productData
            })
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error searching for product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    viewProduct,
    viewAllProducts,
    searchProduct
}