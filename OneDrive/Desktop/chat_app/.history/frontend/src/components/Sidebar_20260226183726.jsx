import "./sidebar.css";
import { useNavigate } from "react-router-dom"; // import useNavigate

export default function Sidebar({ friends, selectFriend, selectedFriend }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate(); // initialize navigate

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
            <span className="green-dot"></span>
          </div>
          {/* Add My Profile button here */}
          <button 
            className="profile-btn" 
            onClick={() => navigate("/profile")}
          >
            My Profile
          </button>
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
    </div>
  );
}