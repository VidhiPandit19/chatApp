const User = require("../models/User");

const sendRequest = async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        // 1️⃣ Check required fields
        if (!receiverId || !message) {
            return res.status(400).json({
                message: "Receiver ID and message are required"
            });
        }

        // 2️⃣ Prevent sending request to yourself
        if (receiverId == req.user.id) {
            return res.status(400).json({
                message: "You cannot send request to yourself"
            });
        }

        // 3️⃣ Check if receiver exists
        const receiver = await User.findOne({
            where: { id: receiverId }
        });

        if (!receiver) {
            return res.status(404).json({
                message: "Receiver not found"
            });
        }

        // 4️⃣ For now just return success
        return res.status(200).json({
            message: "Request sent successfully",
            data: {
                sender: req.user.id,
                receiver: receiverId,
                message
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { sendRequest };