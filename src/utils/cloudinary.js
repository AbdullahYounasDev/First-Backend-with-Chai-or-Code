import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECERET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // For File Upload
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //  file upload successfully
    console.log("File Uploaded Successfully : ", response.url);
    return response;
  } catch (error) {
    // This catch will run when file is not successfully uploaded on cloudinary from local server
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
