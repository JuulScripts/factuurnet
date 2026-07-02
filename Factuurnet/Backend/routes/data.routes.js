const express = require("express");
const {
  dataFetchController,
  getUserDataController,
  invoiceDataController,
  userProfileController,
  debitorController,
  getInvoiceProducts,
  createConceptInvoice,
  updateInvoiceProducts,
  getPageLength,
  getRightProductTermein,
  changeDueDateStandard
} = require("../controllers/data.controller");

const router = express.Router();

router.post("/fetchusers", dataFetchController);
router.post("/getuserdata", getUserDataController);
router.post("/data/invoicedata", invoiceDataController);
router.post("/data/userprofile", userProfileController);
router.post("/data/debitor",debitorController);
router.post("/data/invoiceproducts", getInvoiceProducts);
router.post("/data/create-concept", createConceptInvoice);
router.post("/data/update-concept", updateInvoiceProducts);
router.post("/data/update-due-date", changeDueDateStandard);
router.get("/data/page-length", getPageLength);
router.get("/data/product-termein", getRightProductTermein);


module.exports = router;
