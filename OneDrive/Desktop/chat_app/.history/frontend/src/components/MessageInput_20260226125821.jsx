import { useState } from "react";
import API from "../api/api";
import socket from "../socket";

function MessageInput({ user, selected, setMessages }) {
  const [text, setText] = useState("");

  const sendMessage = async () => {
    if (!text.trim()) return;

    const { data } = await API.post("/send", {
      receiver_Id: selected.id,
      message: text,
    });

    setMessages((prev) => [...prev, data]);

    socket.emit("privateMessage", {
      sender: user.id,
      receiver: selected.id,
      message: text,
    });

    setText("");
  };

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default MessageInput;