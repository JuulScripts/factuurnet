const express = require("express");
const {
  createProduct, editProduct, saveProduct,
  fetchProductsController,
  fetchProductNamesController,   fetchProductsMonthlyController
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/createproduct", createProduct);
router.post("/data/editproduct", editProduct);
router.post("/data/saveproduct", saveProduct);
router.post("/fetchproducts", fetchProductsController);
router.post("/fetchproductnames", fetchProductNamesController);
router.post("/fetchproductsmonthly",  fetchProductsMonthlyController);

module.exports = router;
