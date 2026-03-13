import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";


function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()

}