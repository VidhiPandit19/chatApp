import { useState } from "react";
import API from "../api/api";

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const submit = async () => {
  try {
    if (mode === "login") {
      // Step 1: Login and get token
      const loginRes = await API.post("/user/login", {
        email: form.email,
        password: form.password,
      });

      const token = loginRes.data.token;

      if (!token) {
        alert("Login failed: No token received");
        return;
      }

      // Step 2: Save token
      localStorage.setItem("token", token);

      // Step 3: Fetch logged-in user
      const profileRes = await API.get("/user/profile");

      // Step 4: Set user in App
      onAuth(profileRes.data.user);
    } else {
      await API.post("/user/register", {
        name: form.name,
        mobile_number: form.mobile_number,
        email: form.email,
        password: form.password,
      });

      alert("Account created successfully. Please login.");
      setMode("login");
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Something went wrong");
  }
};

  return (
    <div className="auth-container">
      <h2>{mode === "login" ? "Login" : "Register"}</h2>

      {mode === "register" && (
        <>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            placeholder="Mobile"
            value={form.mobile_number}
            onChange={(e) =>
              setForm({ ...form, mobile_number: e.target.value })
            }
          />
        </>
      )}

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      {mode === "register" && (
        <input
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
        />
      )}

      {/* VERY IMPORTANT: type="button" */}
      <button type="button" onClick={submit}>
        {mode === "login" ? "Login" : "Register"}
      </button>

      <p
        className="switch-text"
        onClick={() =>
          setMode(mode === "login" ? "register" : "login")
        }
      >
        Switch to {mode === "login" ? "Register" : "Login"}
      </p>
    </div>
  );
}

export default AuthPage;