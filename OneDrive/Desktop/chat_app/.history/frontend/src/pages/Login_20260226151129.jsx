import { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    return newErrors;
  };

  const login = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await API.post("/user/login", { email, password });
      const decoded = JSON.parse(atob(res.data.token.split(".")[1]));
      
      localStorage.setItem("token", res.data.token);
      
      navigate("/chat");
    } catch (err) {
      setServerError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={login}>
        <h2 className="auth-title">Login</h2>

        {serverError && <div className="error-text">{serverError}</div>}

        <input
          className={`auth-input ${errors.email ? "input-error" : ""}`}
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <div className="error-text">{errors.email}</div>}

        <input
          className={`auth-input ${errors.password ? "input-error" : ""}`}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && (
          <div className="error-text">{errors.password}</div>
        )}

        <button className="auth-button">Login</button>

        <div className="auth-link">
          Don't have an account?{" "}
          <Link to="/register">
            <span>Register</span>
          </Link>
        </div>
      </form>
    </div>
  );
}