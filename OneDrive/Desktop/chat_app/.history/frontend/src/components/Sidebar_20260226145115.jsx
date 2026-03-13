import "./sidebar.css";

export default function Sidebar({ friends, selectFriend }) {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Friends</h2>

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