const express = require("express");
const router = express.Router();
const { sendRequest, acceptRequest, rejectRequest } = require("../controllers/requestControllers");
const protect = require("../middlewares/auth");
const { sendMessage } = require("../controllers/messageControllers");
const { getFriends } = require("../controllers/friendsControllers");

router.post("/send-request/:receiver_Id", protect, sendRequest);
router.post("/accept-request/:request_id", protect, acceptRequest);
router.post("/reject-request/:request_id",protect, rejectRequest);
router.post("/send", protect, sendMessage);
router.get("/friends", protect, getFriends);
router.get("/messages/:friend")

module.exports = router;
