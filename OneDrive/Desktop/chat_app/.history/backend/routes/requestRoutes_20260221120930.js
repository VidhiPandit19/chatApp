const express = require("express");
const router = express.Router();
const { sendRequest, acceptRequest, rejectRequest } = require("../controllers/requestControllers");
const protect = require("../middlewares/auth");
const { sendMessage } = require("../controllers/messageControllers");

router.post("/send-request/:receiver_Id", protect, sendRequest);
router.post("/accept-request/:request_id", protect, acceptRequest);
router.post("/reject-request/:request_id",protect, rejectRequest);
router.post("/send", protect, sendMessage);
router.get("/friends", protect, get)

module.exports = router;
