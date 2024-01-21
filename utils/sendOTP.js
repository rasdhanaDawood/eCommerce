const otpGenerator = require('otp-generator');
const OTP = require('../models/otpModel');
const User = require('../models/userModel');

const sendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email });
        if (findUser && findUser.verified === true) {
            console.log('User exist');
        }
        else if (findUser) {
            let otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            let result = await OTP.findOne({ otp: otp });
            while (result) {
                otp = otpGenerator.generate(6, {
                    upperCaseAlphabets: false,
                });
                result = await OTP.findOne({ otp: otp });
            }
            const otpPayload = { email, otp };
            const otpBody = await OTP.create(otpPayload);
            console.log("OTP Body:" + otpBody);
            console.log('OTP sent successfully');
        }
        else {
            console.log("No User found")
        }
    } catch (error) {
        console.log(error.message);
    }
    next();
};

module.exports = sendOTP;

