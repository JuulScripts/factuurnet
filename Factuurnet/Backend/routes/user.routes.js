const express = require("express");
const {
  registerController, getUsers
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/createuser", registerController);
router.post("/getusers", getUsers);

module.exports = router;
