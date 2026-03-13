const { friendRequest, User } = require("../models");
const { Op } = require("sequelize");

const getFriends = async(req ,res)