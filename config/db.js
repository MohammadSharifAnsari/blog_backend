import mongoose from "mongoose"

mongoose.set('strictQuery',false);
//means strict mode me query nhi hogi agar koi extra parameter diya hai humne query karte waqt jo exist nhi karta to simply usko ignore kar jao mujhk error mat do

const connectedtodb=async()=>{

try{
    console.log("[blog_backend/config/db.js]:try to connect database...")

    const connection= await mongoose.connect(process.env.MONGO_URL);
      console.log(`[blog_backend/config/db.js]:server is connected to databse at ${connection.connection.host}`);

}
catch(err){
// yahan error me retry karne ki bhi koshish kar sakte hai in database ki ek baar me agar database connect na ho to retry karna hai
    // console.log(`ERRROR`,err);
    console.log("error in connecting database",err)
process.exit(1);//ab yahin se retturnkar jao ab aage jane ki zarurat nhi h poora project se abahar aa jao
}


}


export default connectedtodb;