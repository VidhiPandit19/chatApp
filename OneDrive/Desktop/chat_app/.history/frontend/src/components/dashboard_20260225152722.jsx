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
                    ? "#444"
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
  },

  sidebar: {
    width: "25%",
    backgroundColor: "#1f1f1f",
    color: "white",
    padding: "20px",
  },

  header: {
    borderBottom: "1px solid gray",
    paddingBottom: "10px",
  },

  logout: {
    marginTop: "10px",
    padding: "5px 10px",
    background: "red",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  friendItem: {
    padding: "10px",
    marginTop: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },

  chatArea: {
    width: "75%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f5f5f5",
  },

  chatHeader: {
    padding: "15px",
    borderBottom: "1px solid #ccc",
    fontWeight: "bold",
    backgroundColor: "#fff",
  },

  messagesArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "#e5ddd5",
  },

  inputArea: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc",
    backgroundColor: "#fff",
  },

  messageInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },

  sendButton: {
    marginLeft: "10px",
    padding: "10px 15px",
    border: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    cursor: "pointer",
  },
};

export default Dashboard;