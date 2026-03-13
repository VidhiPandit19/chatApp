import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await API.get("/user/profile");
        setUser(profileRes.data.user);

        const friendsRes = await API.get("/friends");
        setFriends(friendsRes.data.friends);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={styles.container}>
      
      {/* ================= SIDEBAR ================= */}
      <div style={styles.sidebar}>
        
        {/* Logged in User Section */}
        <div style={styles.userSection}>
          <div style={styles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div style={styles.username}>{user.name}</div>

          <button onClick={handleLogout} style={styles.logout}>
            Logout
          </button>
        </div>

        {/* Friends List */}
        <div style={styles.friendsList}>
          {friends.length === 0 ? (
            <p style={styles.noFriends}>No friends yet</p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                style={{
                  ...styles.friendItem,
                  backgroundColor:
                    selectedFriend?.id === friend.id
                      ? "#2a3942"
                      : "transparent",
                }}
                onClick={() => setSelectedFriend(friend)}
              >
                {friend.name}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div style={styles.chatArea}>
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              {selectedFriend.name}
            </div>

            {/* Messages Section */}
            <div style={styles.messagesArea}>
              {/* Messages will come here later */}
            </div>

            {/* Input Section */}
            <div style={styles.inputArea}>
              <input
                type="text"
                placeholder="Type a message"
                style={styles.messageInput}
              />
              <button style={styles.sendButton}>Send</button>
            </div>
          </>
        ) : (
          <div style={styles.emptyChat}>
            Select a friend to start chatting 💬
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Segoe UI, sans-serif",
    backgroundColor: "#efeae2",
  },

  /* ================= SIDEBAR ================= */

  sidebar: {
    width: "300px",
    backgroundColor: "#111b21",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },

  userSection: {
    padding: "15px",
    borderBottom: "1px solid #2a3942",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#00a884",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
  },

  username: {
    fontSize: "14px",
    fontWeight: "500",
  },

  logout: {
    marginLeft: "auto",
    fontSize: "12px",
    padding: "6px 10px",
    backgroundColor: "#d93025",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
  },

  friendsList: {
    flex: 1,
    overflowY: "auto",
  },

  friendItem: {
    padding: "12px 15px",
    cursor: "pointer",
    borderBottom: "1px solid #2a3942",
    fontSize: "14px",
    transition: "0.2s ease",
  },

  noFriends: {
    padding: "15px",
    fontSize: "13px",
    color: "#aaa",
  },

  /* ================= CHAT AREA ================= */

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#efeae2",
  },

  chatHeader: {
    padding: "15px",
    backgroundColor: "#f0f2f5",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
    fontWeight: "500",
  },

  messagesArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
  },

  inputArea: {
    display: "flex",
    padding: "10px",
    backgroundColor: "#f0f2f5",
  },

  messageInput: {
    flex: 1,
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    fontSize: "13px",
    outline: "none",
  },

  sendButton: {
    marginLeft: "10px",
    padding: "8px 18px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#00a884",
    color: "white",
    fontSize: "13px",
    cursor: "pointer",
  },

  emptyChat: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#555",
  },
};

export default Dashboard;