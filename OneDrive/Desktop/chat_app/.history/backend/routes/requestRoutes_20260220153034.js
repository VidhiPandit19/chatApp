const express = require("express");
const router = express.Router();
const { sendRequest, acceptRequest } = require("../controllers/requestControllers");
const protect = require("../middlewares/auth");

router.post("/send-request", protect, sendRequest);
router.post("/accept-request", protect, acceptRequest);
router.post("/send", protect, sen)

module.exports = router;
