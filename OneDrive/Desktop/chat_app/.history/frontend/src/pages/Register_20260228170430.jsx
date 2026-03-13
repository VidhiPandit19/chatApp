import { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import "."

export default function Register() {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!form.name) newErrors.name = "Name is required";
    if (!form.mobile_number) newErrors.mobile_number = "Mobile number is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    if (!form.confirmPassword)
      newErrors.confirmPassword = "Confirm your password";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    socket.on("register", (userId) => {
      onlineUsers[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(onlineUsers));
    });

    try {
      await API.post("/user/register", form);
      navigate("/");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2 className="auth-title">Register</h2>

        {serverError && <div className="error-text">{serverError}</div>}

        <input
          className={`auth-input ${errors.name ? "input-error" : ""}`}
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && <div className="error-text">{errors.name}</div>}

        <input
          className={`auth-input ${errors.mobile_number ? "input-error" : ""}`}
          placeholder="Mobile Number"
          onChange={(e) =>
            setForm({ ...form, mobile_number: e.target.value })
          }
        />
        {errors.mobile_number && (
          <div className="error-text">{errors.mobile_number}</div>
        )}

        <input
          className={`auth-input ${errors.email ? "input-error" : ""}`}
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {errors.email && <div className="error-text">{errors.email}</div>}

        <input
          className={`auth-input ${errors.password ? "input-error" : ""}`}
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {errors.password && (
          <div className="error-text">{errors.password}</div>
        )}

        <input
          className={`auth-input ${
            errors.confirmPassword ? "input-error" : ""
          }`}
          type="password"
          placeholder="Confirm Password"
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
        />
        {errors.confirmPassword && (
          <div className="error-text">{errors.confirmPassword}</div>
        )}

        <button className="auth-button">Register</button>

        <div className="auth-link">
          Already have an account?{" "}
          <Link to="/">
            <span>Login</span>
          </Link>
        </div>
      </form>
    </div>
  );
}