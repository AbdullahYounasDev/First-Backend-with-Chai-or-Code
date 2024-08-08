import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECERET,
});

const removeFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    // For File Upload
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });

    //  file upload successfully
    fs.unlinkSync(localFilePath);
    console.log("Old Image is removed from cloudinary");
    return response;
  } catch (error) {
    // This catch will run when file is not removed from cloudinary from local server
    return null;
  }
};

export { removeFromCloudinary };
