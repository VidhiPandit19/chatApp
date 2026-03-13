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

  if (!user) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h3>{user.name}</h3>
          <button onClick={handleLogout} style={styles.logout}>
            Logout
          </button>
        </div>

        <h4 style={{ marginTop: "20px" }}>Friends</h4>

        {friends.length === 0 ? (
          <p style={{ color: "gray" }}>No friends yet</p>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              style={{
                ...styles.friendItem,
                backgroundColor:
                  selectedFriend?.id === friend.id
                    ? "#2563EB"
                    : "#2c2c2c",
              }}
              onClick={() => setSelectedFriend(friend)}
            >
              {friend.name}
            </div>
          ))
        )}
      </div>

      {/* ================= CHAT AREA ================= */}
      <div style={styles.chatArea}>
        {selectedFriend ? (
          <>
            <div style={styles.chatHeader}>
              Chat with {selectedFriend.name}
            </div>

            <div style={styles.messagesArea}>
              {/* Messages will come here later */}
            </div>

            <div style={styles.inputArea}>
              <input
                type="text"
                placeholder="Type a message..."
                style={styles.messageInput}
              />
              <button style={styles.sendButton}>
                Send
              </button>
            </div>
          </>
        ) : (
          <h2>Select a friend to start chatting 💬</h2>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Inter, sans-serif",
    backgroundColor: "#F9FAFB",
  },

  sidebar: {
    width: "260px",
    backgroundColor: "#111827",
    color: "#fff",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    marginBottom: "20px",
  },

  logout: {
    marginTop: "10px",
    padding: "6px 12px",
    backgroundColor: "#DC2626",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },

  friendItem: {
    padding: "12px",
    borderRadius: "8px",
    marginTop: "10px",
    cursor: "pointer",
    transition: "0.2s ease",
  },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F9FAFB",
  },

  chatHeader: {
    padding: "16px",
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    fontWeight: "600",
    fontSize: "16px",
  },

  messagesArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "#F3F4F6",
  },

  inputArea: {
    display: "flex",
    padding: "15px",
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #E5E7EB",
  },

  messageInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    outline: "none",
    fontSize: "14px",
  },

  sendButton: {
    marginLeft: "10px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563EB",
    color: "white",
    fontWeight: "500",
    cursor: "pointer",
  },
};
export default Dashboard;