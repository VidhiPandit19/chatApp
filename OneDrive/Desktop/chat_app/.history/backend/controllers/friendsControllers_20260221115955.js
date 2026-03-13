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

        const friends = friendships.map(friendship => )
    }
}