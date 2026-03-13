import { useState, useRef } from "react";
import API from "../api";
import "./input.css";
import socket from "../socket";

export default function MessageInput({ receiver_Id, addMessage, myId }) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

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

    if (isTypingRef.current) {
      socket.emit("stopTyping", { senderId: myId, receiverId: receiver_Id });
      isTypingRef.current = false;
    }

    setText("");
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    if (!isTypingRef.current) {
      socket.emit("typing", { senderId: myId, receiverId: receiver_Id });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit("stopTyping", { senderId: myId, receiverId: receiver_Id });
        isTypingRef.current = false;
      }
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="message-input-container">
      <textarea
        value={text}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
      />
      <button onClick={send}>Send</button>
    </div>
  );
}