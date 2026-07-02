const express = require("express");
const { idController, changeIdController } = require("../controllers/dbfetch.controller");

const router = express.Router();

router.post("/getbyid", idController);
router.post("/changebyid", changeIdController);



module.exports = router;
