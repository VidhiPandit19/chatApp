const { request } = require("express");
const { friendRequest } = require("../models");

require("../models");

const sendRequest = async (req, res) => {
    try {
        const { receiver_Id } = req.body;

        //  Check required fields
        if (!receiver_Id ) {
            return res.status(400).json({
                message: "Receiver ID and message are required"
            });
        }

        // Prevent sending request to yourself
        if (receiver_Id == req.user.id) {
            return res.status(400).json({
                message: "You cannot send request to yourself"
            });
        }

        //  Check if receiver exists
        const existingRequest = await friendRequest.findOne({
            where: {
                sender_Id : req.user.id,
                receiver_Id : receiver_Id,
                status: "pending"
            }
        });

        if(existingRequest) {
            return res.status(400).json({
                message: "Request already sent"
            });
        }

        const newRequest = await friendRequest.create({
            sender_Id: req.user.id,
            receiver_Id
            
        });

        return res.status(201).json({
            message: "Request sent successfully",
            request: newRequest
        });


    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { sendRequest };