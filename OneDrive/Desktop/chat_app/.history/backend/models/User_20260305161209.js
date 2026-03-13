const { DataTypes } = require("sequelize");
const {db, connectDb} = require("../config/db");

const User = db.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobile_number: {
    type: DataTypes.STRING,
    allowNull: false 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profilePic: {
    type: String,
    default: ""
  }

  .request-buttons{
  display:flex;
  gap:8px;
}

.accept-btn{
  background:#25D366;
  color:white;
  border:none;
  padding:5px 10px;
  border-radius:6px;
  cursor:pointer;
}

.reject-btn{
  background:#ff4d4f;
  color:white;
  border:none;
  padding:5px 10px;
  border-radius:6px;
  cursor:pointer;
}


});



module.exports = User;
