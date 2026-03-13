import { useState } from "react";
import API from "../api/api";

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
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

 
}

export default AuthPage;