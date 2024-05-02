const mongoose=require('mongoose');

const PaymentSchema = new mongoose.Schema({
    razorpay_order_id: {
        type:String
    },
    amount: {
        type:Number
    },
    status: {
        type:String
    }
  });
  
  // Define the Payment model
  const Payment = mongoose.model('Payment', PaymentSchema);
  module.exports=Payment;