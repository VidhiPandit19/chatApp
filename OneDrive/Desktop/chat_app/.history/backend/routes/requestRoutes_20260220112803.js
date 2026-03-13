const express = require("express");
const router = express.Router();
const { sendRequest } = require("../controllers/requestControllers");
th");
const protect = require("../middlewares/auth");

router.post("/send-request", protect, sendRequest)
