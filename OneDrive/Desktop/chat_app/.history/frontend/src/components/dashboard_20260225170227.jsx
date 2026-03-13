import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: profileData } = await API.get("/user/profile");
        setUser(profileData.user);

        const { data: friendsData } = await API.get("/friends");
        setFriends(friendsData.friends || []);
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    console.log("Message:", message);
    setMessage("");
  };

  if (!user) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ================= SIDEBAR ================= */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span style={styles.userName}>{user.name}</span>
            </div>

            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div style={styles.friendsList}>
            {friends.length === 0 ? (
              <p style={styles.noFriends}>No friends yet</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    ...styles.friendItem,
                    ...(selectedFriend?.id === friend.id &&
                      styles.activeFriend),
                  }}
                  onClick={() => setSelectedFriend(friend)}
                >
                  {friend.name}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ================= CHAT AREA ================= */}
        <main style={styles.chatArea}>
          {selectedFriend ? (
            <>
              <div style={styles.chatHeader}>
                {selectedFriend.name}
              </div>

              <div style={styles.messagesArea}>
                {/* Messages will render dynamically here */}
              </div>

              <div style={styles.inputArea}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={styles.input}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSendMessage()
                  }
                />
                <button
                  style={styles.sendBtn}
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              Select a friend to start chatting 💬
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    fontFamily: "Inter, sans-serif",
  },

  container: {
    width: "1100px",
    height: "90vh",
    display: "flex",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },

  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
  },

  /* ===== SIDEBAR ===== */

  sidebar: {
    width: "300px",
    background:"linear-gradient(180deg, #1e1b4b, #312e81)",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },

  sidebarHeader: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "600",
    fontSize: "14px",
  },

  userName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "0.5px",
  },

  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  friendsList: {
    flex: 1,
    overflowY: "auto",
  },

  friendItem: {
    padding: "15px 20px",
    cursor: "pointer",
    transition: "0.2s ease",
  },

  activeFriend: {
    background: "rgba(255,255,255,0.15)",
  },

  noFriends: {
    padding: "20px",
    opacity: 0.7,
  },

  /* ===== CHAT AREA ===== */

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.2)",
  },

  chatHeader: {
    padding: "20px",
    fontSize: "16px",
    fontWeight: "600",
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },

  messagesArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  inputArea: {
    display: "flex",
    padding: "15px",
    gap: "10px",
    borderTop: "1px solid rgba(0,0,0,0.1)",
  },

  input: {
    flex: 1,
    padding: "10px 15px",
    borderRadius: "20px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },

  sendBtn: {
    padding: "10px 18px",
    borderRadius: "20px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },

  emptyState: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "15px",
    opacity: 0.7,
  },
};

export default Dashboard;