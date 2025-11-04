import usermodel from "../model/user.schema.js";
import postmodel from "../model/post.schema.js"
import AppError from "../utils/error.utils.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import fs from 'fs/promises';
import sendEmail from "../utils/sendMail.utils.js";
import crypto from "crypto"
import passwordUpdated from "../mail/passwordUpdate.js";
import TakePassword from '../mail/takePassword.js';


const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 100,//7 days ke liye cookie set hogi
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
}

const register = async (req, res, next) => {

    try {
        console.log("start in register")
        const { name, email, password } = req.body;
       
        if (!name || !email || !password) {
            //baar baar same error likhna is not a good practice
            //  res.status(400).json({
            //     success:false,
            //     message:"all feild required"
            // })
            return next(new AppError("All feild are required", 400));// yahan par humko ek error mil gyi hai ab is error ko responce me bhejne ke liye we use middleware and next keh rha hai ki error ko aage bhej do
        }

        //1st method to check duplicacy
        // duplicate entry daal rhe ho then 11000 error dega jisse pta lag jaega ki hum duplicate entry daal rhe hain ya nhi


        //2nd methos to check duplicacy

        const userexist = await usermodel.findOne({ email });                          

        if (userexist) {
            
            return next(new AppError("email already exists", 409));
        }
        //now if user not exists in database then first create it and then update client profile
        // password=bcrypt.hash('password',10); instead of this we also use schema level validation
        
        const user = await usermodel.create({//it create the document in mongodb dont need to run usermodel.save()
            name,
            email,
            password,
            avatar: {
                public_id: email,
                //secure_url me usne cloudinary service ka url diya hai jo image store kar rha tha
                secure_url: 'https://tse2.mm.bing.net/th?id=OIP.rBroxJeka0Jj81uw9g2PwAHaHa&pid=Api&P=0&h=220'
            }
        });
        console.log("create user succesfully")
        if (!user) {
            return next(new AppError("user not register,please try again", 500));
        }
        //agar userle uploaded create ho gya then profile updata (or file upload kar denge)
        //todo fi
        //ek general prpose bna de rhe hai ki jab bhi request aae uski body me jaker dekho ki form data aaya hai agar haan to first check karo ki avatar file aai hai ki nhi agar aai hai then multer ka use karke usko and change binary to image and store it into uploads folder
        if (req.file) {//req.file me humari image file ko middleware ne store kar diya hai

           

            //now we are going to upload our file to cloudinary
          
            try {
              
                //req.file.path=> give us the path to the file where image has been stored
                // cloudinary.v2.uploader.upload(file, options).then(callback);
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder:process.env.FOLDER_NAME,//cloudinary par jaker folder naam ka ek folder banega wahan yeh file store hogi and file ki public_id me bhi folder name (LMS) as a prefix append hoga
                    width: 250,//by default heigt and width is in pexel unit
                    height: 250,
                    gravity: 'faces',//focus image ke fase pe rakhna hai
                    crop: 'fill'//crop karke khali jagah nhi dikhni chahiye


                });
                //agar clodinary pe image store ho jae then user ki public_id ko cloudinary ki public_id se and user ki secure_url ko cloudinary ke secure url se change kar dena we set our clodinary credential in root means server.js
                if (result) {

                    user.avatar.public_id = result.public_id;//public id cloudinary par image ko pehchanne ke liye use hoti hai
                    user.avatar.secure_url = result.secure_url;//url of image
                    //remove file from server 
                    fs.rm(`uploads/${req.file.filename}`);

                }
                //but clodinary pe directly upload nhi hoga pehle hum log login karenge jisse humare credential set honge on cloudinary



            }
            catch (err) {

                return next(new AppError(err || "file not uploaded,please try again", 404));

            }

           
        }

        // if(user.isModified('password')){
        //     next();
        //   }
          
        //   user.password=await bcrypt.hash('password',10);
          

        await user.save();//we updated avatar so that we have to save  again
        console.log("save user succesfully")
        user.password = undefined;// hum user ka password responce me nhi bhejna chahte hain
        // ab user register ho gya hai ab hum yahin par usko login kara lete hain now we are going to generate token
        const token = await user.generateJWTToken();// we generate token at schema level


        res.cookie('token', token, cookieOptions);
        res.status(201).json({
            success: true,
            message: "user register succesfully",
            user
        })
        //ab sirf humara update profile baki hai woh kaise hot ahia woh seprate video me bataenge

    }
    catch (err) {
        return res.status(410).json({
            success: false,
            messgae: err.message

        })

    }


}
const login = async (req, res, next) => {
    try {

        let { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError("email and password both are required", 405));
        }

        const user = await usermodel.findOne({ email }).select('+password');
        
        
        
        
        if (!user) {
            return next(new AppError("email is not register first register your email and then login", 403));
        }
        
    
        if (!(await user.comparepassword(password))) {
            return next(new AppError("please enter right password", 404));
        }
        const token = await user.generateJWTToken();
        user.password = undefined;
        res.cookie("token", token, cookieOptions);
        console.log("token in user login>>",token);
        return res.status(200).json(
            {
                success: true,
                message: "now you are logged in",
                user
            }
        )
    }
    catch (err) {
        return next(new AppError(err.message, 500));



    }
}
const logout = async (req, res, next) => {


    res.cookie('token', null, {
        secure: true,
        httpOnly: true,
        sameSite: 'None',
        path: '/',
        maxAge: 0
    })
   
    res.status(200).json({
        success: true,
        message: "you are logged out successfully",

    })


}

const getprofile = async (req, res, next) => {

    try {

        const userid = req.body.user.id;
        
        const user = await usermodel.findById(userid);
        
        return res.status(200).json({
            success: true,
            message: "user detail",
            user

        })
    }
    catch (err) {
        return next(new AppError("failed to fetch user detail", 405));


    }

}
const forgot = async (req, res, next) => {

 

    const { email } = req.body;


    const user = await usermodel.findOne({ email });
    if (!email) {

        return next(new AppError("please enter user email", 400));

    }

    if (!user) {
        return next(new AppError("user not register", 406));
    }

    // generatepasswordresettoken() ek function userSchema me banaenge jo ek token banaenge password reset hone par
    const resettoken = await user.generatepasswordresettoken();

    //user ko mail bhejne se pehle token ko database me store bhi karna hai
    await user.save();//token se user ki do feild  forgetPasswordToken:String, forgetPasswordExpiry:Date ko bhar diya hai ab user ko save karenge
    //client me jo url bhejenge woh client jaisa hoga 
    const resetPasswordURL = `${process.env.FRONTEND_URL1}/reset-password/${resettoken}`;
    // process.env.FRONTEND_URL  frontend se backend pe isi url ke through request kar rha hai basically backend(server) is url pe exists kar rha hai and reset-password wale path par jab hum jaenge to reset-password wala function call ho jaega ab yeh url hume user ko mail karna hai so uske liye ek function banaenege

    try {
        const subject = "reset-password";
        const message = TakePassword(email,user?.name,resetPasswordURL);
{/* <a>${resetPasswordURL}</a> */}

        await sendEmail(email, subject, message);//this function sent the email to user
      
        res.status(200).json({
            success: true,
            message: `reset password token has been sent to ${email}`
        })
    }
    catch (err) {
        //agar humara email send nhi ho pae by any reason then forgotpasswordtoken, forgotpasswordexpiry
        //ko undefined set kar denge for security pupose
        user.forgetPasswordToken = undefined;
        user.forgetPasswordExpiry = undefined;

        return next(new AppError(err.message, 400));

    }



}

const reset = async (req, res, next) => {
    try {

        //jab reset-password forget0password ke baad call hoga then req url ke parama me whi token denge jo forget-password karte waqt humne database me store kara tha
        const { resetToken } = req.params;
        //now validate that token and then change the passwpord
        const { password } = req.body;
       

        // console.log("password==",password);
        // console.log("resetPasswordtoken=",resetToken);
        //kyunki forgetpassword token database me encrypted form me store hai then first hum resetToken ko encrypt karenge then find karenge token in database
        
        const forgetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
       console.log("forgetPasswordToken=",forgetPasswordToken);
        const user = await usermodel.findOne({
            forgetPasswordToken,
             forgetPasswordExpiry:{$gt:Date.now()}//isme check kar rhe hain ki passwordki expiry current time se greater hai ki nhi if hai then return true
        });
        if (!user) {
            console.log("invalid user!!")
            return next(new AppError("invalid or expire token,please try again", 400))
        }
        user.password = password;
        user.forgetPasswordToken = undefined;
        user.forgetPasswordExpiry = undefined;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "your passsord has been updated"
        })


    }
    catch (err) {
        return next(new AppError(err.message, 400));

    }

}

const changepassword = async (req, res, next) => {

    try{

        const { oldpassword, newpassword } = req.body;
        
    
        
        const { id } = req.body.user;
        
        
        if (!oldpassword || !newpassword) {
            return next(new AppError("all feilds are mandatory", 400));
        }
        
        const user = await usermodel.findById(id).select('+password');
        
        if (!user) {
            return next(new AppError("user does not exist", 400));
        }
        
        const isoldpassword = await user.comparepassword(oldpassword);
        console.log("isoldpassword in change password=",isoldpassword);
    //we use await here because comparepassword internally database se contact me hai
    if (!isoldpassword) {
        return next(new AppError("User enter wrong password,please try again", 400));
    }
    user.password = newpassword;
    await user.save();
    user.password = undefined;
    
    res.status(200).json({
        success: true,
        message: "password changed successfully"
    })
}
catch(err){
    console.log("i am in catch of change password")
    return next(new AppError(err.message, 400));
}

}
const updateuser = async (req, res, next) => {
    //is update me profile picture update kara rhe hai and name update kara rhe hai

    const { fullName } = req.body;
  
    const { id } = req.params;
    

    const user = await usermodel.findById(id);
    if (!user) {
        return next(new AppError("user do not exist", 400));
    }


    if (fullName) {
        user.name = fullName;
        await user.save();
    }
    if (req.file) {
        //agar koi profile bhi di gyi hai then first hum user ke avatar ko jo cloudinary pe save hai usko destry karenge

        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        //now we can upload new image to cloudinary
        try {
      
            //req.file.path=> give us the path to the file where image has been stored
            // cloudinary.v2.uploader.upload(file, options).then(callback);
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder:process.env.FOLDER_NAME,//kaun se folder se upload karna hai humara project LMS me hai taki cvlient bhi access kar sake
                width: 250,//by default heigt and width is in pexel unit
                height: 250,
                gravity: 'faces',//focus image ke fase pe rakhna hai
                crop: 'fill'//crop karke khali jagah nhi dikhni chahiye


            });
            //agar clodinary pe image store ho jae then user ki public_id ko cloudinary ki public_id se and user ki secure_url ko cloudinary ke secure url se change kar dena we set our clodinary credential in root means server.js
            if (result) {

                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
                //remove file from server 
                fs.rm(`uploads/${req.file.filename}`);

            }
            //but clodinary pe directly upload nhi hoga pehle hum log login karenge jisse humare credential set honge on cloudinary



        }
        catch (err) {

            return next(new AppError(err || "file not uploaded,please try again", 404));

        }

    }
    await user.save();

    res.status(200).json(
        {
            success: true,
            message: "user update successfully"

        }
    )

}
 const bookmarkpost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    console.log(`[blog_backend/controller/user.controller.js] user>> ${req.user}`);
    const userId = req.body.user.id; 
    console.log(`[blog_backend/controller/user.controller.js] bookmarkpost called with postId: ${postId} by userId: ${userId}`);

    // 1. Check if the post exists
    const post = await postmodel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 2. Get the user
    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Check if post is already bookmarked
    const isAlreadyBookmarked = user.bookmarks.includes(postId);

    if (isAlreadyBookmarked) {
      // Unbookmark
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== postId.toString()
      );
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Post removed from bookmarks",
        bookmarks: user.bookmarks,
      });
    } else {
      // Add bookmark
      user.bookmarks.push(postId);
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Post bookmarked successfully",
        bookmarks: user.bookmarks,
      });
    }
  } catch (err) {
    console.error("Error in bookmarkPost:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
 const getBookmarkedPosts = async (req, res, next) => {
  try {
    const userId = req.body.user.id; // assuming authentication middleware adds this

    // 1️⃣ Fetch user and populate bookmarks
    const user = await usermodel.findById(userId).populate({
      path: "bookmarks",
      select: "title content author createdAt updatedAt avatar", // choose fields you want to show
      populate: {
        path: "author",
        select: "name avatar",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Return bookmarks (could be empty array)
    return res.status(200).json({
      success: true,
      count: user.bookmarks.length,
      bookmarks: user.bookmarks,
    });
  } catch (err) {
    console.error("Error in getBookmarkedPosts:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export {
    register,
    login,
    logout,
    getprofile,
    forgot,
    reset,
    changepassword,
    updateuser,
    bookmarkpost,
    getBookmarkedPosts
}