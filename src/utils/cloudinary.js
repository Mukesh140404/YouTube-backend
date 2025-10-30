import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localPath) =>{
    try {
        if (!localPath) return null;
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type:'auto'
        })
        console.log(response);
        
        // console.log("\n\nCloudinary upload response:", response);
        // console.log("Image uploaded to Cloudinary successfully",response.url);
        fs.unlinkSync(localPath);
        return response;
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        fs.unlinkSync(localPath);
        return null;
    }
}

const deleteFromCloudinary = async (publicId,type="image") =>{
    try {
        if (!publicId){
            console.log("No publicId provided for deletion.");
            return false;
        };
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: type 
        });
        console.log("Cloudinary deletion response:", response);
        return response.result === 'ok';
    }
    catch (error) {
        log("Error deleting image from Cloudinary:", error);
        return false;
    }
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary
};