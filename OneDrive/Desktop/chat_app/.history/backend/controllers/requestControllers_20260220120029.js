const { friendRequest } = require("../models");

require("../models");

const sendRequest = async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        //  Check required fields
        if (!receiverId || !message) {
            return res.status(400).json({
                message: "Receiver ID and message are required"
            });
        }

        // Prevent sending request to yourself
        if (receiverId == req.user.id) {
            return res.status(400).json({
                message: "You cannot send request to yourself"
            });
        }

        //  Check if receiver exists
        const existingRequest = await friendRequest.findOne({
            where: {
                senderId : req.user.id,
                receiverId : receiverId,
                status: "pending"
            }
        });

        if(existingRequest) {
            return res.status(400).json({
                message: "Request already sent"
            });
        }

        const newRequest = await friendRequest.create({
            senderId: req.user.id
        })





    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { sendRequest };