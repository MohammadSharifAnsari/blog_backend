import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import errorMiddleware  from "./middleware/error.middleware.js";
import dotenv from 'dotenv/config';
import morgan from "morgan";
import AppError from "./utils/error.utils.js";
import fs from 'node:fs/promises';
import path from "node:path";
import userRoutes from "./routes/user.routes.js"
import postRoutes from "./routes/post.routes.js"
import commentRoutes from "./routes/comments.routes.js"
import categoryRoutes from "./routes/categories.routes.js"
import tagRoutes from "./routes/tags.routes.js"
import adminRoutes from "./routes/admin.routes.js"
// import { Buffer } from 'node:buffer';

// Creates a zero-filled Buffer of length 10.

const app=express();
// const buf1 = Buffer.alloc(10,"sharif");
// console.log("buf1=",buf1.toString('hex'));

// console.log('i am in app.js')
console.log("[blog_backend/app.js] start")
const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 100,//7 days ke liye cookie set hogi
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  path: '/',
}
// these are middelware
//morgan middleware basically console me woh url daalegi jis url se server par request jaegi
app.use(morgan('dev'));//dev nhi karte to puri information with day time and computer version deta dev use karne se sirf aadhi information de rha hai means only about request

app.use(express.json());

// app.use(express.json()) – What Does It Do?
// ✅ It allows Express to parse incoming JSON data in req.body.

// How It Works:
// When a client sends a request with JSON data in the body, express.json() parses it and makes it available in req.body.
// Without this middleware, req.body would be undefined for JSON requests.
// Does It Ensure Both Request & Response Are in JSON Format?
// ❌ No, it only ensures that the request body is parsed as JSON.
// ✅ It does NOT automatically send responses in JSON format—you still need to manually format responses.
// ____________________________________________________________________________________________________________
app.use(express.urlencoded({extended:true}));//work for post in html form
//encoded url se query params ko nikalne ke liye hum isko use kar sakte hai
// app.use(express.urlencoded({ extended: true })) – What Does It Do?
// ✅ It allows Express to parse incoming URL-encoded form data (application/x-www-form-urlencoded) and make it available in req.body.

// How It Works:
// When a client submits form data (like an HTML <form> with method="POST"), Express parses the data and stores it in req.body.
// This middleware is needed when handling form submissions without using JSON.
// What Does extended: true Mean?
// extended: true → Allows nested objects in form data (uses qs library).
// extended: false → Only allows simple key-value pairs (uses querystring library).
// ✅ Example: extended: true

// js
// Copy
// Edit
// app.use(express.urlencoded({ extended: true }));

// app.post('/submit', (req, res) => {
//   console.log(req.body);
//   res.send('Form data received');
// });
// 📌 Sending Form Data (extended: true)

// plaintext
// Copy
// Edit
// name=Sharif&address[city]=Delhi&address[country]=India
// 🔹 Parsed req.body:

// json
// Copy
// Edit
// {
//   "name": "Sharif",
//   "address": {
//     "city": "Delhi",
//     "country": "India"
//   }
// }
// ✅ Use extended: true when handling complex form data with nested objects.


app.use(cors({
origin:[process.env.FRONTEND_URL3,process.env.FRONTEND_URL1],
credentials:true//backend allow browser to send cookie

}));
// app.use(cookieParser());

app.use(cookieparser());
//allow req.cookies se cokkie mil jae parse req.body




//parse the cookie into object like this
// cookies: {
//     token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Y2FhNGIzMjllZjM1NDY2MzQzZjI2ZiIsIm5hbWUiOiJtb2hhbW1hZCBzaGFyaWYgYW5zYXJpIiwiZW1haWwiOiJtb2hhbW1hZHNoYXJpZmFuc2FyaTE1N0BnbWFpbC5jb20iLCJzdWJzY3JpcHRpb24iOnt9LCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MDk3NDc3MjEsImV4cCI6MTcwOTgzNDEyMX0.QlPDEsl3lWwRl4Hd45SJVRwynKHgNKE1cns-wJ7hNK4'    
//   }

//alluser related routes is route me run karenge
//humne controller me error ko next kar diya hai now if error come then line 27 ke aage error pass ho jaegi
// console.log("[blog_backend/app.js] before userRoutes")
app.use('/api/v1/user',userRoutes);
// console.log("[blog_backend/app.js] before postRoutes")
app.use('/api/v1/post',postRoutes);
app.use('/api/v1/comment',commentRoutes);
app.use('/api/v1/category',categoryRoutes);
app.use('/api/v1/tag',tagRoutes);
app.use('/api/v1/admin',adminRoutes);

// app.use('/api/v1/course',courseroutes);
// app.use('/api/v1/payment',paymentRoutes);
// app.use('/api/v1/miscellaneous',miscellaneous);
// app.use('/api/v1/admin',adminRoutes);
// Express Middleware Matching Rules:
// app.use(path, middleware) applies middleware to all routes that start with path.
// It does prefix matching, meaning it does not require an exact match—as long as the request starts with "api/v1", it will call func1.

//this is api we make for check that our serever is up or not

//app.all('*',callback)=> yeh keh rha hai kisi bhi route pe request jae jo upar define nhi hai then yeh walaa callback return kardo
// app.all('*',(req,res,next)=>{

//     // console.log("i am in *")
// res.status(400).send("404 -page not found");
// // throw new Error("experiment")
// // next("route");

// })

app.use('/ping',async (req,res)=>{
  // console.log("i am in ping")
  res.send('pong');
  // console.log("i am in ping pong ping")
  
})
app.get("/",(req,res,next)=>{
  console.log("server is still running ")
  next();
  console.log("server is still running 1")
  
  // res.send("Server runnnings dd");
})




app.get('/cookie', (req, res) => {
    // Access cookies
    // console.log(req)
    console.log("req.cookies>>",req.cookies); // This should now log your cookies
    res.send('Cookie received');
});

//yeh middle ware error object ko user ko pass karegi as a responce
// yeh last me likha hai means  agar humara yeh wala (52) code encounter hua hai then humne kuch gadbadi ki hai tabhi yahan tak code aaya hai warna pehle hi responce chala jata
app.use(errorMiddleware);

// app.use('/',router) ;

export default app;
