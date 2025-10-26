const takeNewPassword = (email, name,resetPasswordURL) => {
	return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Password Update Confirmation</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
         
                <a href=${process.env.FRONTEND_URL1}><img class="logo"
                    src="https://i2.wp.com/www.frebers.com/wp-content/uploads/2019/04/Learning-01-scaled.jpg?fit=2560%2C1920&ssl=1" alt="LMS Logo"></a>
            <div class="message">Reset Password</div>
            <div class="body">
                <p>Hey ${name},</p>
                <p>Someone wants to reset your password from this <span>${email}</span> if that is you please click on the link below <span class="highlight">${resetPasswordURL}</span>. if you are not then ignore this mail.
                </p>
              
            </div>
            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us
                at
                <a href="zulfiqarpharma777@gmail.com">LMS.com</a>. We are here to help!
            </div>
        </div>
    </body>
    
    </html>`;
};

export default takeNewPassword ;