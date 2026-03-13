import "./sidebar.css";
import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import socket from "../socket";
import API from "../api"; // Make sure you have your API axios instance

export default function Sidebar({ friends, selectFriend, selectedFriend }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [currentUser, setCurrentUser] = useState(storedUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [activeTab, setActiveTab] = useState("chats");
  const [searchTerm, setSearchTerm] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  // Listen for online users
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, []);

  // Handle form submission
  const handleProfileUpdate = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  try {
    const res = await API.put("/user/update", formData);

    const newToken = res.data.token;

    // Save new token
    localStorage.setItem("token", newToken);

    // Decode token
    const payload = JSON.parse(atob(newToken.split(".")[1]));

    // Save updated user
    localStorage.setItem("user", JSON.stringify(payload));

    setCurrentUser(payload);
    setIsModalOpen(false);

    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to update profile.");
  }
};

  return (
    <div className="sidebar">
      {/* Logged In User Section */}
      <div className="current-user">
        <div className="avatar big">
          {currentUser?.profilePic ? (
            <img
              src={`http://localhost:5000${currentUser.profilePic}`}
              alt="avatar"
              className="avatar-img"
            />
          ) : (
            currentUser?.name?.charAt(0).toUpperCase()
          )}
        </div>

        <div className="user-info">
          <div className="username-row">
            <span className="username">{currentUser?.name}</span>
            <FaEdit
              className="edit-icon"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
          
        </div>
      </div>

      <hr className="divider" />

      <div className="sidebar-tabs">
        <div
        className={`tab-item ${activeTab === "chats" ? "active" : ""}`}
        onClick={() => setActiveTab("chats")}
        > 
        💬
        
        </div>
        
        <div
        className={`tab-item ${activeTab === "users" ? "active" : ""}`}
        onClick={() => setActiveTab("users")}
        >
          👥
          
          </div>

          <div>
            className="tab-indicator"
            style={{
              transform:
              activeTab
            }}
          </div>
        </div>

        <div className="sidebar-search">
          <input
          type="text"
          placeholder={
            activeTab === "users" ? "Search users..." : "Search chats..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          />
          </div>



      <h3 className="friends-title">Friends</h3>

      {friends.map((friend) => (
        <div
          key={friend.id}
          className={`friend-item ${
            selectedFriend?.id === friend.id ? "active-friend" : ""
          }`}
          onClick={() => selectFriend(friend)}
        >
          <div className="avatar-container">
            <div className="avatar">
              {friend.name.charAt(0).toUpperCase()}
            </div>
            {onlineUsers.map(Number).includes(friend.id) && (
              <div className="green-dot"></div>
            )}
          </div>

          <div className="username-row">
            <span className="username">{friend.name}</span>
            {onlineUsers.map(Number).includes(friend.id) && (
              <div className="green-dot"></div>
            )}
          </div>
        </div>
      ))}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Update Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <label>Profile Picture</label>
              <input type="file" name="profilePic" />

              <label>Name</label>
              <input
                type="text"
                name="name"
                defaultValue={currentUser?.name}
                required
              />

              <label>Mobile Number</label>
              <input
                type="text"
                name="mobile_number"
                defaultValue={currentUser?.mobile_number || ""}
                required
              />

              <label>Email</label>
              <input
                type="email"
                value={currentUser?.email}
                disabled
              />

              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}