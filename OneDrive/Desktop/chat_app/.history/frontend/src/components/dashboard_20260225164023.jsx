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
    <div style={styles.page}>
      <div style={styles.container}>
        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTop}>
            <span style={styles.userName}>{user.name}</span>
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
                    background:
                      selectedFriend?.id === friend.id
                        ? "rgba(255,255,255,0.15)"
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

        {/* CHAT AREA */}
        <div style={styles.chatArea}>
          {selectedFriend ? (
            <>
              <div style={styles.chatHeader}>
                {selectedFriend.name}
              </div>

              <div style={styles.messagesArea}>
                <div style={styles.demoMessageLeft}>
                  Hey 👋
                </div>
                <div style={styles.demoMessageRight}>
                  Hello! How are you?
                </div>
              </div>

              <div style={styles.inputArea}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  style={styles.input}
                />
                <button style={styles.sendBtn}>Send</button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              Select a friend to start chatting 💬
            </div>
          )}
        </div>
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
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    fontFamily: "Inter, sans-serif",
  },

  container: {
    width: "1100px",
    height: "90vh",
    display: "flex",
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },

  /* SIDEBAR */

  sidebar: {
    width: "300px",
    background: "rgba(0,0,0,0.4)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(10px)",
  },

  sidebarTop: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  userName: {
    fontSize: "15px",
    fontWeight: "600",
  },

  logoutBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    padding: "6px 10px",
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
    fontSize: "14px",
    transition: "0.2s",
  },

  noFriends: {
    padding: "20px",
    fontSize: "14px",
    opacity: 0.7,
  },

  /* CHAT AREA */

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(15px)",
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

  demoMessageLeft: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.6)",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "14px",
  },

  demoMessageRight: {
    alignSelf: "flex-end",
    background: "#4f46e5",
    color: "white",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "14px",
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