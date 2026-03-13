const { friendRequest, Message } = require("../models");
const { Op } = require("sequelize");

const sendMessage = async (req, res) => {
  try {
    const sender_Id = req.user.id;   
    const { receiver_Id, message } = req.body;

    if (!receiver_Id || !message) {
      return res.status(400).json({
        message: "Receiver and message are required"
      });
    }

    // Check accepted request in either direction
    const existingRequest = await friendRequest.findOne({
      where: {
        status: "Accepted",
        [Op.or]: [
          { sender_Id, receiver_Id },
          { sender_Id: receiver_Id, receiver_Id: sender_Id }
        ]
      }
    });

    if (!existingRequest) {
      return res.status(403).json({
        message: "You can only message accepted users"
      });
    }

    const newMessage = await Message.create({
      sender_Id,
      receiver_Id,
      message
    });

    return res.status(201).json({
      message: "Message sent successfully",
      data: newMessage
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = { sendMessage };