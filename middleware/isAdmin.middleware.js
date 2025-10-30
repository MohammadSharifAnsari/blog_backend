
import userModel from "../model/user.schema.js";
import AppError from "../utils/error.utils.js";
const isAdmin=(...roles)=>async(req,res,next)=>{
//yeh wali middleware isloggedin ke baad chalegi then req.body.user me sari user ki information aa chuki hogi

const id=req.body.user.id;
console.log("88")
const currentRole= await userModel.findById(id);
console.log("currentRole",currentRole);
const actualRole=currentRole.role
console.log("actualRole",actualRole);

if(!roles.includes(actualRole)){
    return next(new AppError('you are not authorized',403));
    //403 is authentication error
}

next();
}

export default isAdmin;
