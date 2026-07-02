const express = require("express");
const {
  createNewCustomerController,
  updateUserProfileController,
  updatePass
} = require("../controllers/customer.controller");

const router = express.Router();

router.post("/updateuserprofile",updateUserProfileController);
router.post("/createnewcustomer", createNewCustomerController);
router.post("/update-password", updatePass);

module.exports = router;
  