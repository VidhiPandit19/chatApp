import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/user/profile");
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3>{user.name}</h3>
        <button onClick={handleLogout} style={styles.logout}>
          Logout
        </button>

        <div style={styles.friends}>
          <p>Friends List (Coming Soon)</p>
        </div>
      </div>

      <div style={styles.chatArea}>
        <h2>Welcome to Chat App 💬</h2>
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
  logout: {
    marginTop: "10px",
    padding: "5px 10px",
    background: "red",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  friends: {
    marginTop: "30px",
  },
  chatArea: {
    width: "75%",
    backgroundColor: "#f4f4f4",
    padding: "20px",
  },
};

export default Dashboard;