const express = require("express");
const {
  loginController,
  sessionCheckController,
  deleteSessionToken
} = require("../controllers/auth.controller");

const router = express.Router();

// Attach your controller logic to the POST URL
router.post("/adminlogin", loginController);
router.post("/dashboardverify", sessionCheckController);
router.post("/log-out", deleteSessionToken);


module.exports = router;
