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
        setFriends(friendsRes.data.friends || []);
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
        
        {/* Top Section */}
        <div style={styles.sidebarTop}>
          <div style={styles.loggedUserName}>
            {user?.name}
          </div>

          <button onClick={handleLogout} style={styles.logout}>
            Logout
          </button>
        </div>

        {/* Friends */}
        <div style={styles.friendsSection}>
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
            <div style={styles.chatHeader}>
              {selectedFriend.name}
            </div>

            <div style={styles.messagesArea}>
              {/* Messages will appear here */}
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
    height: "800px",
    
    fontFamily: "Segoe UI, sans-serif",
  },

  /* ================= SIDEBAR ================= */

  sidebar: {
    width: "300px",
    backgroundColor: "#111b21",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },

  sidebarTop: {
    padding: "15px",
    borderBottom: "1px solid #2a3942",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  loggedUserName: {
    fontSize: "14px",
    fontWeight: "500",
  },

  logout: {
    fontSize: "11px",
    padding: "4px 8px",
    backgroundColor: "#d93025",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
  },

  friendsSection: {
    flex: 1,
    overflowY: "auto",
  },

  friendItem: {
    padding: "12px 15px",
    cursor: "pointer",
    borderBottom: "1px solid #2a3942",
    fontSize: "14px",
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
    backgroundColor: "#528be1",
    color: "white",
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
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    fontSize: "13px",
    outline: "none",
  },

  sendButton: {
    marginLeft: "10px",
    padding: "8px 16px",
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