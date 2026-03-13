import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome 👋</h1>
        <p style={styles.subtitle}>
          A modern messaging experience starts here.
        </p>

        <div style={styles.buttons}>
          <button
            style={{ ...styles.button, ...styles.primaryBtn }}
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            style={{ ...styles.button, ...styles.secondaryBtn }}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
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
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    fontFamily: "Inter, sans-serif",
  },

  card: {
    width: "420px",
    padding: "50px 40px",
    borderRadius: "20px",
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,0.1)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
    color: "white",
  },

  title: {
    fontSize: "28px",
    fontWeight: "600",
    marginBottom: "10px",
  },

  subtitle: {
    fontSize: "14px",
    opacity: 0.8,
    marginBottom: "40px",
  },

  buttons: {
    display: "flex",
    gap: "15px",
  },

  button: {
    flex: 1,
    padding: "12px",
    borderRadius: "25px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "0.2s ease",
  },

  primaryBtn: {
    background: "#4f46e5",
    color: "white",
  },

  secondaryBtn: {
    background: "rgba(255,255,255,0.2)",
    color: "white",
  },
};

export default Home;