import MessageInput from "./MessageInput";

function ChatWindow({ user, selected, messages, setMessages }) {
  if (!selected) return <div>Select a friend</div>;

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <h3>Chat with {selected.name}</h3>

      <div style={{ minHeight: "300px" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.sender_Id === user.id ? "right" : "left",
            }}
          >
            {m.message}
          </div>
        ))}
      </div>

      <button onClick={startAudioCall}>📞</button>
<button onClick={startVideoCall}>📹</button>

      <MessageInput
        user={user}
        selected={selected}
        setMessages={setMessages}
      />
    </div>
  );
}

export default ChatWindow;