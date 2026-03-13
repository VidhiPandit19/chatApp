import "./sidebar.css";
import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import socket from "../socket";
import API from "../api";

export default function Sidebar({ friends, selectFriend, selectedFriend }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [currentUser, setCurrentUser] = useState(storedUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [activeTab, setActiveTab] = useState("chats");
  const [searchTerm, setSearchTerm] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  // ================= SOCKET =================
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, []);

  // ================= FETCH USERS & REQUESTS =================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/user/allusers");
        setAllUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchRequests = async () => {
      try {
        const res = await API.get("/friend-requests");
        setIncomingRequests(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (activeTab === "users") {
      fetchUsers();
      fetchRequests();
    }
  }, [activeTab]);

  // ================= SEND REQUEST =================
  const sendRequest = async (receiverId) => {
    try {
      await API.post("/send-request/{ receiverId: userId });
      alert("Request sent!");
    } catch (err) {
      console.error(err);
    }
  };

  // ================= ACCEPT REQUEST =================
  const acceptRequest = async (requestId) => {
    try {
      await API.post("/accept-request", { requestId });
      const res = await API.get("/friend-requests");
      setIncomingRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= UPDATE PROFILE =================
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await API.put("/user/update", formData);

      const newToken = res.data.token;
      localStorage.setItem("token", newToken);

      const payload = JSON.parse(atob(newToken.split(".")[1]));
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

      {/* ===== Logged In User Section ===== */}
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

      {/* ===== Tabs ===== */}
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

        <div
          className="tab-indicator"
          style={{
            left: activeTab === "chats" ? "25%" : "75%",
            transform: "translateX(-50%)",
          }}
        ></div>
      </div>

      {/* ===== Search ===== */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder={
            activeTab === "users"
              ? "Search users..."
              : "Search chats..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ================= CHATS TAB ================= */}
      {activeTab === "chats" && (
        <>
          <h3 className="friends-title">Friends</h3>

          {friends
            .filter((friend) =>
              friend.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((friend) => (
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
                </div>
              </div>
            ))}
        </>
      )}

      {/* ================= USERS TAB ================= */}
      {activeTab === "users" && (
        <>
          <h3 className="friends-title">Friend Requests</h3>

          {incomingRequests.length === 0 && (
            <p className="empty-text">No requests</p>
          )}

          {incomingRequests.map((req) => (
            <div key={req.id} className="friend-item">
              <div className="avatar">
                {req.name.charAt(0).toUpperCase()}
              </div>

              <div className="username-row">
                <span className="username">{req.name}</span>

                <button
                  className="send-btn"
                  onClick={() => acceptRequest(req.id)}
                >
                  Accept
                </button>
              </div>
            </div>
          ))}

          <h3 className="friends-title">All Users</h3>

          { allUsers
           .filter(user => user.id !== currentUser.id)
           .filter(user => 
            !friends.some(friend => friend.id === user.id)
           )
           .filter(user =>
              user.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(user => (
              <div key={user.id} className="friend-item">
                <div className="avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="username-row">
                  <span className="username">{user.name}</span>

                  <button
                    className="send-btn"
                    onClick={() => sendRequest(user.id)}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
        </>
      )}

      {/* ================= MODAL ================= */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
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
              <input type="email" value={currentUser?.email} disabled />

              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}