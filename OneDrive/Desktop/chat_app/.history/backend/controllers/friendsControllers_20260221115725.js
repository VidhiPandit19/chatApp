const { friendRequest, User } = require("../models");
const { Op } = require("sequelize");

const getFriends = async(requestAnimationFrame,res)