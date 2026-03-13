import { useState } from "react";
import API from "../api/api";

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirmPassword
  });

  const submit = async () => {
    try {
      if (mode === "login") {
        const { data } = await API.post("/user/login", {
          email: form.email,
          password: form.password,
        });

        localStorage.setItem("token", data.token);
        onAuth(data.user);
      } else {
        await API.post("/user/register", form);
        alert("Account created! Please login.");
        setMode("login");
      }
    } catch (err) {
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
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Mobile"
          onChange={(e) =>
            setForm({ ...form, mobile_number: e.target.value })
          }
        />
      </>
    )}

    <input
      placeholder="Email"
      onChange={(e) => setForm({ ...form, email: e.target.value })}
    />

    <input
      type="password"
      placeholder="Password"
      onChange={(e) => setForm({ ...form, password: e.target.value })}
    />

    <button onClick={submit}>
      {mode === "login" ? "Login" : "Register"}
    </button>

    <p
      className="switch-text"
      onClick={() => setMode(mode === "login" ? "register" : "login")}
    >
      Switch to {mode === "login" ? "Register" : "Login"}
    </p>
  </div>
);
}

export default AuthPage;