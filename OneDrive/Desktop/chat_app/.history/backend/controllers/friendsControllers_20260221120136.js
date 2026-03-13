const { use } = require("react");
const { friendRequest, User } = require("../models");
const { Op } = require("sequelize");

const getFriends = async(req ,res) => {
    try{
        const userId = req.user.id;

        const friendships = await friendRequest.findAll({
            where: {
                status: "Accepted",
                [Op.or]: [
                    {sender_Id: userId},
                    {receiver_Id: userId}
                ]
            }
        });

        const friends = friendships.map(friendship => {
            if(friendship.sender_Id === userId) {
                return friendship.receiver_Id;
            } else {
                return friendship.sender_Id;
            }
        });

        const friendDetails = await User.findAll({
            where: {
                id: friends
            },
            attributes
        })
    }
}