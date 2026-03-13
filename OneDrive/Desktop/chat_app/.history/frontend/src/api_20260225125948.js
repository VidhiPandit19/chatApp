import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000",
});


API.post("/user/login", data);
API.post("/user/register", data);
API.get("/user/profile");
API.get("/search");


API .interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if(token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;