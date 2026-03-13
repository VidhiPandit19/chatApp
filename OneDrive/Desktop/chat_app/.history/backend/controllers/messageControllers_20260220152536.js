const { friendRequest, Message } = require("../models");

const sendMessage = async (req, res) => {
  try {
    const { sender_Id, receiver_Id, message } = req.body;

    // 1️⃣ Basic validation
    if (!sender_Id || !receiver_Id || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    //  Check if they are connected (accepted request exists in either direction)
    const existingRequest = await friendRequest.findOne({
      where: {
        status: "accepted",
        [require("sequelize").Op.or]: [
          { sender_Id, receiver_Id },
          { sender_Id: receiver_Id, receiver_Id: sender_Id }
        ]
      }
    });

    if (!existingRequest) {
      return res.status(403).json({
        message: "You can only message users whose request is accepted"
      });
    }

    //  Create message
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