import React, { useState } from "react";
import axios from "../api";

const Profile = () => {
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mobile, setMobile] = useState("");
  const token = localStorage.getItem("token");

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    if(name) {
      formData.append("name", name);
    }

    if(mobile) {
      formData.append("mobile_number", mobile);
    }

    if(selectedFile)

    if (selectedFile) {
      formData.append("profilePic", selectedFile);
      formData.append("mobile_number", mobile);
    }

    try {
      const res = await axios.put("/user/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem("token", res.data.token);
      window.location.reload();
      alert("Profile updated successfully");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Edit Profile</h2>

      <form onSubmit={handleUpdate}>
        <input
          type="text"
          placeholder="Enter new name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
        type="text"
        placeholder="Enter new mobile number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        />

        <br /><br />

        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <br /><br />

        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default Profile;