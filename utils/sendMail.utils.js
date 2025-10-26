import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message){
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: process.env.SMTP_HOST,//jo mail bhej rha hai
    port: process.env.SMTP_PORT,//port jis se mail bheji ja rhi hai 465
    secure: false, // true for 465, false for other ports
    auth: {//humko mail send karna hai to humko kuch authentication chahiye because we use third party
      user: process.env.SMTP_USERNAME,//sender email
      pass: process.env.SMTP_PASSWORD,//password generate by sender yeh password sender ki gmail par jao>manage google account>seach app password> create app and get password
    },
  });

  // send mail with defined transport object
 const res=await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL, // sender address jahan se email bheji ja rhi hai
    to: email, // user email jisko email bhej rhe hai
    subject: subject, // Subject line
    html: message, // html body
    //email,subject and message hum function me le rhe hai
  });

  console.log("respnse in email==",res);
};
// drxe hioz vbmh xvlk

export default sendEmail;