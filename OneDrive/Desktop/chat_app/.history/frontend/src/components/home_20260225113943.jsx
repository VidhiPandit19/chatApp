import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome</h1>
        <p style={styles.subtitle}>Please choose an option</p>

        <div style={styles.buttonContainer}>
          <button style={styles.button} onClick={() => navigate("/login")}>
            Login
          </button>

          <button style={styles.button} onClick={() => navigate("/register")}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to right, #141e30, #243b55)",
  },
  card: {
    background: "#1f1f1f",
    padding: "40px",
    borderRadius: "10px",
    textAlign: "center",
    color: "white",
    width: "350px",
  },
  title: {
    marginBottom: "10px",
  },
  subtitle: {
    marginBottom: "30px",
    color: "#ccc",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    fontWeight: "bold",
  },
};

export default Home;