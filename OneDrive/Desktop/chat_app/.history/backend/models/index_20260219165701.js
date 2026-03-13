const User = require("./User");
const friendRequest = require("./friendrequest");

friendRequest.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender",
    onDelete: "CASCADE"
})