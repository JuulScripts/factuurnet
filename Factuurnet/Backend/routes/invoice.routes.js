const express = require("express");
const {
  createInvoiceController, fetchInvoiceData,
  updateSubscription
} = require("../controllers/invoice.controller");

const router = express.Router();

router.post("/createinvoice", createInvoiceController);
router.post("/fetchinvoicedata", fetchInvoiceData);
router.post("/update-subscription", updateSubscription);

module.exports = router;
