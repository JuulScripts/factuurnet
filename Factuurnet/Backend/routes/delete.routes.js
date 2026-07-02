const express = require("express");
const {
  deleteItem
} = require("../controllers/delete.controller");

const router = express.Router();

router.post("/delete", deleteItem);


module.exports = router;
