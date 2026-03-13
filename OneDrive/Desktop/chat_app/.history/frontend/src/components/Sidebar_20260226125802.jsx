function Sidebar({ friends, setSelected }) {
  return (
    <div style={{ width: "250px", borderRight: "1px solid gray" }}>
      <h3>Friends</h3>
      {friends.map((f) => (
        <div
          key={f.id}
          style={{ padding: "10px", cursor: "pointer" }}
          onClick={() => setSelected(f)}
        >
          {f.name}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;