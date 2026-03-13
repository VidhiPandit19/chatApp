import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    const newErrors = {};

    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/user/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      setErrors({});
      setSuccessMessage("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back 👋</h2>

        {successMessage && (
          <p style={styles.success}>{successMessage}</p>
        )}

        {errors.general && (
          <p style={styles.errorCenter}>{errors.general}</p>
        )}

        <div style={styles.form}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
            style={styles.input}
          />
          {errors.email && (
            <span style={styles.error}>{errors.email}</span>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({});
            }}
            style={styles.input}
          />
          {errors.password && (
            <span style={styles.error}>{errors.password}</span>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing In..." : "Login"}
          </button>

          <p style={styles.registerText}>
            Don’t have an account?{" "}
            <span
              style={styles.registerLink}
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>
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
    padding: "45px 40px",
    borderRadius: "20px",
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,0.1)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    color: "white",
  },

  title: {
    textAlign: "center",
    marginBottom: "25px",
    fontSize: "22px",
    fontWeight: "600",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px 15px",
    borderRadius: "25px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "25px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.2s ease",
  },

  error: {
    color: "#ffb4b4",
    fontSize: "12px",
    marginTop: "-6px",
  },

  errorCenter: {
    color: "#ffb4b4",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "10px",
  },

  success: {
    color: "#b4ffcb",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "10px",
  },

  registerText: {
    marginTop: "15px",
    fontSize: "13px",
    textAlign: "center",
    opacity: 0.9,
  },

  registerLink: {
    cursor: "pointer",
    fontWeight: "600",
    color: "#ffffff",
  },
};

export default Login;