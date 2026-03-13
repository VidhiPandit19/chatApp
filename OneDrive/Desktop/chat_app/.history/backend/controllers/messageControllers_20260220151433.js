const { friendRequest } = require("../models");

require("../models");

const sendMessage = async(req, res) => {
    try{
        const {sender_Id, reciever_Id, messaage} = req.body;

        const existingRequest = await friendRequest.findOne({
            where
        })
    }

}