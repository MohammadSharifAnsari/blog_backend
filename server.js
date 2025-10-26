
import app from "./app.js";
import connectedtodb from "./config/db.js";
// import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import {v2 as cloudinary} from 'cloudinary';
const PORT=process.env.PORT||5500;
//CLOUDINARY PE HUMKO ACCOUNT CREATE KARNA PADEGA
//clodinary configiration

// cloudinary.v2.config({
// cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
// api_key:process.env.CLOUDINARY_API_KEY,
// api_secret:process.env.CLOUDINARY_API_SECRET

// });
cloudinary.config({
cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
api_key:process.env.CLOUDINARY_API_KEY,
api_secret:process.env.CLOUDINARY_API_SECRET

});
//razor pay ka configraturation set karna hai
//this is a instance of razor pay
export const razorpay=new Razorpay({
key_id:process.env.RAZORPAY_KEY_ID,
key_secret:process.env.RAZORPAY_SECRET
})



app.listen(PORT, async ()=>{
    await connectedtodb();
    console.log(`[blog_backend/server.js]:your server is running http://localhost:${PORT}`);
})



