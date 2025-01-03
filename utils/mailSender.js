const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false // This disables SSL certificate verification
            }
        });
        let info = await transporter.sendMail({
            from: "rasdhana@gmail.com",
            to: email,
            subject: title,
            html: body
        });
        console.log("Email sent successfully. Email info: ", info);
        return info;
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = mailSender;