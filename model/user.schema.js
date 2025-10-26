import mongoose from "mongoose";
import bcrypt, { hash } from "bcrypt";
import JWT from "jsonwebtoken";

import crypto from "crypto";
import { type } from "os";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match:[/^(?:(?:[\w`~!#$%^&*\-=+;:{}'|,?\/]+(?:(?:\.(?:"(?:\\?[\w`~!#$%^&*\-=+;:{}'|,?\/\.()<>\[\] @]|\\"|\\\\)*"|[\w`~!#$%^&*\-=+;:{}'|,?\/]+))*\.[\w`~!#$%^&*\-=+;:{}'|,?\/]+)?)|(?:"(?:\\?[\w`~!#$%^&*\-=+;:{}'|,?\/\.()<>\[\] @]|\\"|\\\\)+"))@(?:[a-zA-Z\d\-]+(?:\.[a-zA-Z\d\-]+)*|\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])$/gim,'please set avalid email']
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["Admin", "Author"],
      default: "Author",
    },
    bio: { type: String, default: "" },
    avatar: {
        //is id ke though avatar ko uniquely identify kara jaega
      public_id:{
        type:String
      },
      //is url ke throuh avatar ko access kar ajaega yeh clodnary la url hai jahan image store hogi
      secure_url:{
        type:String
      },
      //below two string used for forget password
      
      
    }, // URL to profile image
      forgetPasswordToken:{type:String},
    forgetPasswordExpiry:{type:Date},
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // <-- new field
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], 
    newsletterSubscribed: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods={
  generateJWTToken: async function(){
return await JWT.sign(
  {id:this._id,name:this.name,email:this.email,subscription:this.subscription,role:this.role},
  process.env.SECRET,
  {expiresIn:process.env.EXPIRY}
)

  },
  comparepassword:async function(password){

// console.log("password in compare password>",password);
// console.log("this.passsword in compare password=",this.password);
// await bcrypt.compare(password, user.password)
   const match=await bcrypt.compare(password,this.password);
 console.log("match in compare password>",match);
return match;

  },
  generatepasswordresettoken:async function(){
    //yahan reset token hum crypto se banaenge jwt se nhi kyunki yahan token me humko apni information nhi deni sirf yeh validate karna hai ki jab hum yeh token user ko bejen aur user wapsi me humko new password ke sath token bheje to humo sirf validate karna hai ki kya yeh whi token hai
    const resetToken=crypto.randomBytes(20).toString('hex');//yeh 20 byte ka ek token bna dega and then us token ko hex string me badal dega
    //ab is token ko hume database me store karana hai
    // this.forgetPasswordToken=resetToken; is tarah se bhi token daal sakte hai but agar database me security se related koi cheez rakhen to use as it is na daalen
    this.forgetPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex');
//isko hum crypto se encrypt kar rhe hain;
//sha256=>is an encrypting algorithm
//update(resetToken) ko encrypt karna hai
//digest('hex') means hex me digest kar dena hai

    this.forgetPasswordExpiry=Date.now()+15*60*100;//jab humne token generate kiya tabse 15 minute tak valid hoga uske baad expire hojaega yahan hum miliseconds me dete hai\
//     import { Buffer } from 'node:buffer';

// // Creates a zero-filled Buffer of length 10.
// const buf1 = Buffer.alloc(10);

return resetToken

  }


}

//save karne se pehle callback execute kardo
userSchema.pre('save',async function(next){//yeh code asal me controller me likhna hai
//ismodified btata hai ki password ko modifird karne ki zarurat hai ya nhi true meana password need to be modified
console.log('password=',this.password,"this.isModified('password')=",this.isModified('password'));
if(this.isModified('password')){
  this.password=await bcrypt.hash(this.password,10);
  // this.password=await bcrypt.hash('password',10);
  console.log('password after hash =',this.password);
    next();  
}


})

export default mongoose.model("User", userSchema); // User become users
