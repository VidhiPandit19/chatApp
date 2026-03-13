export default function MessageBubble({ msg, userId }) {
  const isMe = msg.sender_Id === userId;

  return (
    <div style={{
      textAlign: isMe ? "right" : "left",
      margin:"10px"
    }}>
      <span style={{
        background: isMe ? "#4cbae6" : "#d6dcf7",
        padding:"8px 12px",
        borderRadius:"10px",
        display:"inline-block"
      }}>
        {msg.message}
      </span>
    </div>
  );
}