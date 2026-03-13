import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleRegister = async () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.mobile_number)
      newErrors.mobile_number = "Mobile number is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await API.post("/user/register", formData);

      setSuccessMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account ✨</h2>

        {successMessage && (
          <p style={styles.success}>{successMessage}</p>
        )}

        {errors.general && (
          <p style={styles.errorCenter}>{errors.general}</p>
        )}

        <div style={styles.form}>
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            style={styles.input}
          />
          {errors.name && <span style={styles.error}>{errors.name}</span>}

          <input
            name="mobile_number"
            placeholder="Mobile Number"
            value={formData.mobile_number}
            onChange={handleChange}
            style={styles.input}
          />
          {errors.mobile_number && (
            <span style={styles.error}>{errors.mobile_number}</span>
          )}

          <input
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
          />
          {errors.email && <span style={styles.error}>{errors.email}</span>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
          />
          {errors.password && (
            <span style={styles.error}>{errors.password}</span>
          )}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={styles.input}
          />
          {errors.confirmPassword && (
            <span style={styles.error}>{errors.confirmPassword}</span>
          )}

          <button
            onClick={handleRegister}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

          <p style={styles.loginText}>
            Already have an account?{" "}
            <span
              style={styles.loginLink}
              onClick={() => navigate("/login")}
            >
              Login
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

  loginText: {
    marginTop: "15px",
    fontSize: "13px",
    textAlign: "center",
    opacity: 0.9,
  },

  loginLink: {
    cursor: "pointer",
    fontWeight: "600",
    color: "#ffffff",
  },
};

export default Register;