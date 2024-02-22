const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/img/shop'))

    },
    filename: function (req, file, cb) {
        const name = file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage }).array('image', 3);

const editedStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/img/shop'))

    },
    filename: (req, file, cb) => {
        const name = file.originalname;
        cb(null, name);
    }
});

const editedUploads = multer({ storage: editedStorage }).fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
]);

module.exports = {
    upload,
    editedUploads
}