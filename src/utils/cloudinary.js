import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) {
      console.log("Local file path is missing");
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
}

const deleteFromCloudinary = async (fileUrl) => {
  try {
    // Extract the public ID from the URL
    const publicId = extractPublicId(fileUrl);

    if (!publicId) {
      throw new Error('Invalid URL: Could not extract public ID');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deletion Result:', result);
  } catch (error) {
    console.error('Error deleting resource:', error.message);
  }
};


const extractPublicId = (url) => {
  // Match the part after the domain and folder structure, before file extension
  const regex = /\/(?:v\d+\/)?([^\/]+)\.[a-z]+$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export { uploadOnCloudinary, deleteFromCloudinary };
