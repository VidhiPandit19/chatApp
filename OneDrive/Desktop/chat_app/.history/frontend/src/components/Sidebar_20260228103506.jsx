import "./sidebar.css";
import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import socket from "../socket"; // ✅ import socket

export default function Sidebar({ friends, selectFriend, selectedFriend }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]); // ✅ state

  // ✅ Listen for online users
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      console.log("ONLINE USERS:", users);
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, []);

  return (
    <div className="sidebar">

      {/* Logged In User Section */}
      <div className="current-user">
        <div className="avatar big">
          {user?.email?.charAt(0).toUpperCase()}
        </div>

        <div className="user-info">
          <div className="username-row">
            <span className="username">{user?.name}</span>

            <FaEdit 
              className="edit-icon" 
              onClick={() => setIsModalOpen(true)} 
            />a
          </div>
        </div>
      </div>

      <hr className="divider" />

      <h3 className="friends-title">Friends</h3>

      {friends.map((friend) => (
        <div
          key={friend.id}
          className={`friend-item ${
            selectedFriend?.id === friend.id ? "active-friend" : ""
          }`}
          onClick={() => selectFriend(friend)}
        >
          <div className="avatar">
            {friend.name.charAt(0).toUpperCase()}
          </div>

          {/* ✅ Wrap name + green dot */}
          <div className="username-row">
            <span className="username">{friend.name}</span>

            {onlineUsers.includes(String(friend.id)) && (
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
            <form>
              <label>Name</label>
              <input type="text" defaultValue={user?.name} />

              <label>Email</label>
              <input type="email" defaultValue={user?.email} />

              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}