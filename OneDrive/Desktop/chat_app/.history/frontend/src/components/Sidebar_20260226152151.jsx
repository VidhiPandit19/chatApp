import "./sidebar.css";

export default function Sidebar({ friends, selectFriend }) {

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="sidebar">

      {/* Logged In User Section */}
      <div className="current-user">
        <div className="avatar big">
          {user?.email?.charAt(0).toUpperCase()}
        </div>

        <div className="user-info">
          <div className="username"
          <span className="username">{user?.email}</span>
          <div className="online-status">
            <span className="green-dot"></span>
            Online
          </div>
        </div>
      </div>

      <hr className="divider" />

      <h3 className="friends-title">Friends</h3>

      {friends.map((friend) => (
        <div
          key={friend.id}
          className="friend-item"
          onClick={() => selectFriend(friend.id)}
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