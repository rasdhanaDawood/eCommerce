const dotenv = require('dotenv');
const cloudinaryModule = require('cloudinary');

dotenv.config()
const cloudinary = cloudinaryModule.v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const image = './img/shop/product-1.jpg';

(async function run() {
    const result = await cloudinary.uploader.upload(image);
    console.log(result);
})();
module.exports = cloudinary;