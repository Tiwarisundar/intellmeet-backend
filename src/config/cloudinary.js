const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary configure karo
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage setup — avatars folder mein save hoga
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'intellmeet/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }]
  }
});

// Multer upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

module.exports = { cloudinary, upload };