const express = require("express");
const {
  fetchSubscriptionsController,
  addSubscriptionController,
  setAutoSend,
  unsetAutoSend,
  getAutoSend
} = require("../controllers/subscriptions.controller");

const router = express.Router();

router.post("/fetchsubscriptions", fetchSubscriptionsController);
router.post("/addsubscription", addSubscriptionController);
router.post("/auto-send-on", setAutoSend);
router.post("/auto-send-off", unsetAutoSend);
router.get("/get-auto-send", getAutoSend);

module.exports = router;