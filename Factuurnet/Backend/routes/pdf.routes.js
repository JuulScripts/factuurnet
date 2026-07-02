const express = require("express");
const { downloadInvoice } = require("../controllers/pdf.controller");

const router = express.Router();

router.post("/data/invoice/pdf", downloadInvoice);

module.exports = router;
