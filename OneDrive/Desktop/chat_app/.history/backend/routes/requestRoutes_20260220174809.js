const express = require("express");
const router = express.Router();
const { sendRequest, acceptRequest, rejectRequest } = require("../controllers/requestControllers");
const protect = require("../middlewares/auth");
const { sendMessage } = require("../controllers/messageControllers");

router.post("/send-request", protect, sendRequest);
router.post("/accept-request", protect, acceptRequest);
router.post("/send", protect, sendMessage);


module.exports = router;
