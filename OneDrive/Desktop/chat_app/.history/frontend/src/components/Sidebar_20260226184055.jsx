import "./sidebar.css";
import { useState } from "react";
import { FaEdit } from "react-icons/fa"; // profile edit icon from react-icons

export default function Sidebar({ friends, selectFriend, selectedFriend }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="sidebar">

      {/* Logged In User Section */}
      <div className="current-user">
        <div className="avatar big">
          {user?.email?.charAt(0).toUpperCase()}
        </div>

        <div className="user-info">
          <div className="username-row">
            <span className="username">{user?.name}</span>

            {/* Edit icon */}
            <FaEdit 
              className="edit-icon" 
              onClick={() => setIsModalOpen(true)} 
            />
          </div>
        </div>
      </div>

      <hr className="divider" />

      <h3 className="friends-title">Friends</h3>

      {friends.map((friend) => (
        <div
          key={friend.id}
          className={`friend-item ${
            selectedFriend?.id === friend.id ? "active-friend" : ""
          }`}
          onClick={() => selectFriend(friend)}
        >
          <div className="avatar">
            {friend.name.charAt(0).toUpperCase()}
          </div>
          <span>{friend.name}</span>
        </div>
      ))}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
          >
            <h2>Update Profile</h2>
            <form>
              <label>Name</label>
              <input type="text" defaultValue={user?.name} />

              <label>Email</label>
              <input type="email" defaultValue={user?.email} />

              <button type="submit">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}