import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get logged in user
        const profileRes = await API.get("/user/profile");
        setUser(profileRes.data.user);

        // Get all users
        const usersRes = await API.get("/user/search");
        setUsers(usersRes.data);

      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/user/login");
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

        <div style={styles.userList}>
          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            users
              .filter((u) => u.id !== user.id)
              .map((u) => (
                <div key={u.id} style={styles.userItem}>
                  {u.name}
                </div>
              ))
          )}
        </div>
      </div>

      <div style={styles.chatArea}>
        <h2>Select a user to start chatting 💬</h2>
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
    overflowY: "auto",
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
  userList: {
    marginTop: "20px",
  },
  userItem: {
    padding: "10px",
    backgroundColor: "#2c2c2c",
    marginBottom: "10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  chatArea: {
    width: "75%",
    backgroundColor: "#f4f4f4",
    padding: "20px",
  },
};

export default Dashboard;