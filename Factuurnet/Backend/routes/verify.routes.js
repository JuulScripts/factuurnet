const express = require("express");
const { verifyRestriction } = require("../controllers/verify.controller");


const router = express.Router();

router.post("/verifyrestriction", verifyRestriction);

module.exports = router;
