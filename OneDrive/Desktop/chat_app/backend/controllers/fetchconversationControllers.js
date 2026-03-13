const { Message, friendRequest } = require("../models");
const { Op } = require("sequelize");

const getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;

        // Check if they are accepted friends
        const isFriend = await friendRequest.findOne({
            where: {
                status: "Accepted",
                [Op.or]: [
                    { sender_Id: userId, receiver_Id: friendId },
                    { sender_Id: friendId, receiver_Id: userId }
                ]
            }
        });

        if (!isFriend) {
            return res.status(403).json({
                message: "You are not friends with this user"
            });
        }

        // Fetch conversation
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_Id: userId, receiver_Id: friendId },
                    { sender_Id: friendId, receiver_Id: userId }
                ]
            },
            order: [["createdAt", "ASC"]]
        });

        return res.status(200).json({ messages });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { getConversation };