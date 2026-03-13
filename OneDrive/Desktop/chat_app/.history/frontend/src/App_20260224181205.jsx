// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register"; // adjust path if needed
import Home from "./components/Home"; // optional, if you have a home page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Landing/Home page */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;