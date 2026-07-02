const express = require("express");
const { sendInvoice } = require("../controllers/email.controller");

const router = express.Router();

router.post("/send-invoice", sendInvoice);


module.exports = router;
