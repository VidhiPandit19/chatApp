const { friendRequest } = require("../models");

require("../models");

const sendMessage = async(req, res) => {
    try{
        const {sender_Id, reciever_Id, messaage} = req.body;

        const existingRequest = await friendRequest.findOne({
            where: {
                sender_Id,
                reciever_Id,
                status: "Accepted"
            }
        })  || await friendRequest.findOne({
            where: {
                sender_Id: reciever_Id,
                reciever_Id: sender_Id,
                status: "Accepted"
            }

        });

        if(!existingRequest) {
            return res.status(403).json({
                message: "You can only message accepted users"
            });
        }

        const newMessage = await messaage.create({
            sender_Id,
            reciever_Id,
            messaage
        });
        
    }

}