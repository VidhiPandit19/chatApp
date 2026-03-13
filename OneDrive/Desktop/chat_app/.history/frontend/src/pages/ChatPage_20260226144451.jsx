import { useEffect, useState } from "react";
import API from "../api/api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatHeader";

function ChatPage({ user }) {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);

  // Register socket
  useEffect(() => {
    socket.emit("register", user.id);
  }, [user]);

  // Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      const { data } = await API.get("/friends");
      setFriends(data);
    };
    fetchFriends();
  }, []);

  // Fetch conversation
  useEffect(() => {
    if (!selected) return;

    const fetchMessages = async () => {
      const { data } = await API.get(`/messages/${selected.id}`);
      setMessages(data);
    };

    fetchMessages();
  }, [selected]);

  // Receive real-time messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      if (data.sender === selected?.id) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [selected]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar friends={friends} setSelected={setSelected} />
      <ChatWindow
        user={user}
        selected={selected}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}

export default ChatPage;