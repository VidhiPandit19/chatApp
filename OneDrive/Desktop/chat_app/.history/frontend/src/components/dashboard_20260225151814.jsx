import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
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
            <div key={friend.id} style={styles.friendItem}>
              {friend.name}
            </div>
          ))
        )}
      </div>

      <div style={styles.chatArea}>
        <h2>Select a friend to start chatting 💬</h2>
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
    backgroundColor: "#2c2c2c",
    marginTop: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  chatArea: {
    width: "75%",
    backgroundColor: "#924343",
    padding: "20px",
  },
};

export default Dashboard;