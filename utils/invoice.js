const PDFDocument = require("pdfkit");
const fs = require("fs");
const Order = require("../models/ordersModel");
var subtotalPosition = 0;
function createInvoice(orderData, total, discount, stream) {
  let doc = new PDFDocument({ margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, orderData);
  generateInvoiceTable(doc, total, discount, orderData);
  generateFooter(doc);

  doc.end();
  doc.pipe(stream);
}

function generateHeader(doc) {
  doc
    .image("./public/img/logo.png", 50, 45, { width: 90 })
    .fillColor("#444444")
    .fontSize(10)
    .text("CupCake Shop", 200, 50, { align: "right" })
    .text("New Lane Road", 200, 65, { align: "right" })
    .text("Menaka, EKM, 678545", 200, 80, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, orderData) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  const customerInformationTop = 200;

  doc
    .fillColor("#444444")
    .fontSize(10)
    .text(`Customer Name:`, 50, customerInformationTop)
    .text(
      `${orderData.user.firstName} ${orderData.user.lastName} `,
      150,
      customerInformationTop
    )
    .moveDown()
    .text(`Shipping Address:`, 50, customerInformationTop + 15)
    .text(`${orderData.address.address}`, 150, customerInformationTop + 15)
    .text(
      `${orderData.address.city}, ${orderData.address.state}, ${orderData.address.zip} `,
      150,
      customerInformationTop + 30
    )
    .moveDown();
}

function generateInvoiceTable(doc, total, discount, orderData) {
  let i;
  const invoiceTableTop = 330;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Sl No",
    "Products",
    "Unit Cost",
    "Quantity",
    "Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  orderData.products.forEach((product, i) => {
    if (product.productStatus == true) {
      const position = invoiceTableTop + (i + 1) * 30;
      generateTableRow(
        doc,
        position,
        i + 1,
        product.product.name,
        formatCurrency(product.product.price),
        product.quantity,
        formatCurrency(product.product.price * product.quantity)
      );

      generateHr(doc, position + 20);
    }
  });

  const totalPosition = invoiceTableTop + (orderData.products.length + 1) * 30;

  generateTableRow(
    doc,
    totalPosition,
    "",
    "",
    "Sub Total",
    "",
    formatCurrency(total)
  );

  const discountPosition =
    invoiceTableTop + (orderData.products.length + 2) * 30;

  generateTableRow(
    doc,
    discountPosition,
    "",
    "",
    "Discount",
    "",
    formatCurrency(discount)
  );

  subtotalPosition = invoiceTableTop + (orderData.products.length + 3) * 30;

  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Grand Total",
    "",
    formatCurrency(orderData.totalPrice)
  );

  generateHr(doc, subtotalPosition + 20);
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      subtotalPosition + 40,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(amount) {
  return amount.toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month + "/" + day + "/" + year;
}

const invoice = async (req, res, next) => {
  try {
    const orderId = req.query.order;
    console.log(orderId);
    var total = 0;
    const orderData = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate("address")
      .populate("products.product");
    for (const product of orderData.products) {
      if (product.productStatus == true) {
        total += product.product.price * product.quantity;
      }
    }
    console.log(total);
    var discount = total - orderData.totalPrice;
    console.log(discount);
    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.setHeader("Content-Type", "application/pdf");

    createInvoice(orderData, total, discount, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

module.exports = invoice;
