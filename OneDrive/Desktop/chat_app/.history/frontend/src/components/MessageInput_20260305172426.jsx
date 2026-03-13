import { useState } from "react";
import API from "../api";
import "./input.css";
import socket from "../socket";

export default function MessageInput({ receiver_Id, addMessage, myId }) {
  const [text, setText] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

  const send = async () => {
    if (!text.trim()) return;

    const res = await API.post("/send", {
      receiver_Id,
      message: text,
    });

    addMessage((prev) => [...prev, res.data.data]);
    socket.emit("privateMessage", {
      sender: res.data.data.sender_Id,
      receiver: receiver_Id,
      message: text,
    });
    
    setText("");
  };

  return (
    <div className="message-input-container">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={send}>Send</button>
    </div>
  );
}