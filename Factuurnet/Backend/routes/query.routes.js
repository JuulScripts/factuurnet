const express = require("express");
const {
  sendController
} = require("../controllers/query.controller");

const router = express.Router();

router.post("/send",sendController );

module.exports = router;
