
const { friendRequest, User } = require("../models");
const { Op } = require("sequelize");


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
                ],
                status: {
                    [Op.in] : ["pending", "accepted"]
                }
            }

        });

        if(existingRequest) {
            return res.status(400).json({
                message: "Request already exists or user is already your friend"
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

        require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { User } = require("./models");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Database
const { db, connectDB } = require("./config/db");

// Import Models (must be before sync)
require("./models");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");

const path = require("path");

app.use("/uploads", express.static("uploads"));
app.use("/user", userRoutes);
app.use("/", requestRoutes);


//  Create HTTP server
const server = http.createServer(app);

//  Attach socket to server
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.set("io", io);

//  Socket connection
const onlineUsers = {};


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  //  when user tells server who they are
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log("Online Users:", onlineUsers);

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("privateMessage", (data) => {
  const receiverSocketId = onlineUsers[data.receiver];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receiveMessage", data);
  }
});


// CALL USER
socket.on("callUser", ({ userToCall, signalData, from }) => {
  const receiverSocketId = onlineUsers[userToCall];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("incomingCall", {
      signal: signalData,
      from
    });
  }
});

// ANSWER CALL
socket.on("answerCall", ({ to, signal }) => {
  const callerSocketId = onlineUsers[to];

  if (callerSocketId) {
    io.to(callerSocketId).emit("callAccepted", signal);
  }
});

// END CALL
socket.on("endCall", ({ to }) => {
  const receiverSocketId = onlineUsers[to];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("callEnded");
  }
});

socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });


  socket.on("disconnect", async () => {

  for (let userId in onlineUsers) {

    if (onlineUsers[userId] === socket.id) {

      const lastSeen = new Date();
      // update last seen
      await User.update(
        { last_seen: lastSeen },
        { where: { id: userId } }
      );

      delete onlineUsers[userId];
      io.emit("userLastSeen", { userId, lastSeen});
    }

  }

  io.emit("onlineUsers", Object.keys(onlineUsers));
  console.log("User disconnected:", socket.id);

});
});

// Connect Database + Sync Tables + Start Server
connectDB()
  .then(() => {
    return db.sync();
  })
  .then(() => {
    console.log("tables synced");
    server.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error starting server:", err);
  });


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


const getFriendRequests = async (req, res) => {
  try {

    const requests = await friendRequest.findAll({
      where: {
        receiver_Id: req.user.id,
        status: "pending"
      },
      include: [
        {
            model: User,
            as: "sender",
            attributes: ["id", "name", "profilePic"]
        }
      ]
    });

    return res.status(200).json(requests);

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

const getIncomingRequests = async (req, res) => {
  const requests = await Request.findAll({
    where: {
      receiver_id: req.user.id,
      status: "pending"
    }
  });

  res.json(requests);
};

module.exports = { sendRequest, acceptRequest, rejectRequest, getFriendRequests, getIncomingRequests };