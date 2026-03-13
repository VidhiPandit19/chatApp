const express = require("express");
const router = express.Router();
const { sendRequest } = require("../controllers/requestControllers");
const protect = require("../middlewares/auth");

router.post("/send-request", protect, sendRequest);

module.exports = router
