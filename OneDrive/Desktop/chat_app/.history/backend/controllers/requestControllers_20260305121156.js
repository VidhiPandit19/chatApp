
const { friendRequest } = require("../models");
const { Op }

require("../models");

//send request api
const sendRequest = async (req, res) => {
    try {
        const  receiver_Id  = req.params.receiver_Id;

        //  Check required fields
        if (!receiver_Id ) {
            return res.status(400).json({
                message: "Receiver ID and message are required"
            });
        }

        // Can't sending request to yourself
        if (receiver_Id == req.user.id) {
            return res.status(400).json({
                message: "You cannot send request to yourself"
            });
        }

        //  Check if receiver exists
        const existingRequest = await friendRequest.findOne({
            where: {
                [Op.or]: [
                    {
                        sender_Id: req.user.id,
                        receiver_Id: receiver_Id
                    },
                    {
                        sender_Id: receiver_Id,
                        receiver_Id: req.user.id
                    }
                ]
            }

        });

        if(existingRequest) {
            return res.status(400).json({
                message: "Request already sent or you are already friends"
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


//accept request api

const acceptRequest = async(req, res) => {
    try{
        const  request_id = req.params.request_id;

        if(!request_id) {
            return res.status(400).json({message: "Request Id is required"});

        }

        const request = await friendRequest.findOne({
            where: {
                id: request_id,
                receiver_Id: req.user.id,
                status: "pending"
            }
        });

        if(!request) {
            return res.status(404).json({message: "Request not found or already accepted"});

        }

        //status update
        request.status = "accepted";
        await request.save();

        return res.status(200).json({message: "Request accepted successfully", request});

    }
    catch(error) {
        return res.status(500).json({message: error.message});
    }
}


//reject request api


const rejectRequest = async (req, res) => {
    try {
        const  request_id  = req.params.request_id;

        if (!request_id) {
            return res.status(400).json({
                message: "Request Id is required"
            });
        }

        const request = await friendRequest.findOne({
            where: {
                id: request_id,
                receiver_Id: req.user.id,
                status: "pending"
            }
        });

        if (!request) {
            return res.status(404).json({
                message: "Request not found or already processed"
            });
        }

        // update status
        request.status = "rejected";
        await request.save();

        return res.status(200).json({
            message: "Request rejected successfully",
            request
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { sendRequest, acceptRequest, rejectRequest };