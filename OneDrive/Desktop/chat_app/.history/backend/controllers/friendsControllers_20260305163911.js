
const { friendRequest, User } = require("../models");
const { Op } = require("sequelize");

const getFriends = async(req ,res) => {
    try{
        const userId = req.user.id;

        //find accepted friendships
        const friendships = await friendRequest.findAll({
            where: {
                status: "accepted",
                [Op.or]: [
                    {sender_Id: userId},
                    {receiver_Id: userId}
                ]
            } 
        });

        //extract opposite user-Ids
        const friends = friendships.map(friendship => {
            if(friendship.sender_Id === userId) {
                return friendship.receiver_Id;
            } else {
                return friendship.sender_Id;
            }
        });

        //fetch those users with id, name and email
        const friendDetails = await User.findAll({
            where: {
                id: friends
            },
            attributes: ["id", "name", ""]
         });

        //return friend list
        return res.status(200).json({friends: friendDetails});

    } catch(error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { getFriends };