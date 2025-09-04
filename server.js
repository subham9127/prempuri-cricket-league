const express = require("express");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const ExcelJS = require("exceljs");
const dotenv = require("dotenv");
const crypto = require("crypto");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Prempuri Cricket League Backend is running 🏏");
});

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.rzp_test_RDepiRiOSzk7yy,
  key_secret: process.env.i9Qfd4buP2eD4Wpqse8zwerU,
});

// ✅ Create order (₹250)
app.post("/create-order", async (req, res) => {
  const options = {
    amount: 250 * 100, // in paise
    currency: "INR",
    receipt: "receipt_order_" + Date.now(),
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ Payment verification
app.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, playerData } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Save player details to Excel
    const workbook = new ExcelJS.Workbook();
    const filePath = "./players.xlsx";

    try {
      await workbook.xlsx.readFile(filePath);
    } catch (e) {
      workbook.addWorksheet("Players");
    }

    const worksheet = workbook.getWorksheet("Players") || workbook.addWorksheet("Players");

    if (worksheet.rowCount === 1) {
      worksheet.addRow(["Name", "Father Name", "Mobile", "T-Shirt Size", "Payment ID"]);
    }

    worksheet.addRow([
      playerData.name,
      playerData.fatherName,
      playerData.mobile,
      playerData.tshirt,
      razorpay_payment_id,
    ]);

    await workbook.xlsx.writeFile(filePath);

    res.json({ success: true, message: "Payment verified & data saved ✅" });
  } else {
    res.status(400).json({ success: false, message: "Payment verification failed ❌" });
  }
}); // ✅ closes app.post

// ✅ Start server
app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
