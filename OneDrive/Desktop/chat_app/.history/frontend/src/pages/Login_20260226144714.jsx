import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/user/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/chat");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <form onSubmit={login}>
      <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)}/>
      <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)}/>
      <button>Login</button>
    </form>
  );
}