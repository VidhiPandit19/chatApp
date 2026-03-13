export default function Sidebar({ friends, selectFriend }) {
  return (
    <div style={{width:"250px", borderRight:"1px solid gray"}}>
      <h3>Friends</h3>
      {friends.map((friend)=>(
        <div key={friend.id} onClick={()=>selectFriend(friend.id)}>
          {friend.name}
        </div>
      ))}
    </div>
  );
}