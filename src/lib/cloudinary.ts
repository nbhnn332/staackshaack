import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

/**
 * Uploads an image base64 data string to Cloudinary, falling back gracefully
 * to the raw data URI if credentials are not set.
 */
export async function uploadImage(fileDataUri: string): Promise<string> {
  const hasCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

  if (!hasCloudinary) {
    console.log("⚠️ Cloudinary Cloud Name not set. Storing raw data URI for local development.");
    return fileDataUri;
  }

  try {
    const res = await cloudinary.uploader.upload(fileDataUri, {
      folder: "stackshack",
    });
    return res.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failure:", error);
    // Fallback: return the raw data URI so the image still renders
    return fileDataUri;
  }
}
