import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showLoginLink, setShowLoginLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleRegister = async () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.mobile_number) newErrors.mobile_number = "Mobile number is required";
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
      await API.post("/register", formData);

      setSuccessMessage("Registration successful! Redirecting...");
      setErrors({});

      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (err) {
        const message = err.response?.data?.message || "Registration failed";
        setErrors({ general: message });
        if (message.toLowerCase().includes("already")) {
            setShowLoginLink(true);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Register</h2>

        {successMessage && (
          <p style={styles.success}>{successMessage}</p>
        )}

        {errors.general && (
          <p style={styles.error}>{errors.general}</p>
        )}

        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          style={styles.input}
        />
        {errors.name && <p style={styles.error}>{errors.name}</p>}

        <input
          name="mobile_number"
          placeholder="Mobile Number"
          value={formData.mobile_number}
          onChange={handleChange}
          style={styles.input}
        />
        {errors.mobile_number && (
          <p style={styles.error}>{errors.mobile_number}</p>
        )}

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          style={styles.input}
        />
        {errors.email && <p style={styles.error}>{errors.email}</p>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={styles.input}
        />
        {errors.password && <p style={styles.error}>{errors.password}</p>}

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          style={styles.input}
        />
        {errors.confirmPassword && (
          <p style={styles.error}>{errors.confirmPassword}</p>
        )}

        <button onClick={handleRegister} style={styles.button}>
          Register
        </button>

        {showLoginLink && (
  <p style={styles.loginRedirect}>
    Already have an account?{" "}
    <span
      style={styles.loginLink}
      onClick={() => navigate("/login")}
    >
      Login here
    </span>
  </p>
)}
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
    width: "350px",
    textAlign: "center",
    color: "white",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "5px",
    border: "none",
  },
  button: {
    width: "100%",
    padding: "10px",
    marginTop: "20px",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "5px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: "14px",
    margin: "5px 0 0 0",
    textAlign: "left",
  },
  success: {
    color: "lightgreen",
    fontSize: "14px",
    marginBottom: "10px",
  },

  loginRedirect: {
  marginTop: "10px",
  fontSize: "14px",
  color: "white",
},

loginLink: {
  color: "#4CAF50",
  cursor: "pointer",
  fontWeight: "bold",
},
};

export default Register;