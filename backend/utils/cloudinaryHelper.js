const cloudinary = require('../config/cloudinary');

/**
 * Uploads a base64 image string to Cloudinary
 * @param {string} base64Str - The base64 image string
 * @param {string} folder - The folder name in Cloudinary
 * @returns {Promise<string>} - The URL of the uploaded image
 */
const uploadToCloudinary = async (base64Str, folder) => {
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str; // Return as is if not a base64 image (could be an existing URL)
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: `college-events/${folder}`,
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error(`Cloudinary Upload Error [${folder}]:`, error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

module.exports = { uploadToCloudinary };
