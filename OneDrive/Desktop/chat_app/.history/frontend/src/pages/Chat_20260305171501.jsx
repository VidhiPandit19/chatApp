import { useEffect, useState } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import "./chat.css";
import { useRef } from "react";

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "";

  const now = new Date();
  const last = new Date(lastSeen);

  const diff = Math.floor((now - last) / 1000);

  if (diff < 60) return "Last seen just now";

  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `Last seen ${mins} min ago`;
  }

  if (diff < 86400) {
    const hrs = Math.floor(diff / 3600);
    return `Last seen ${hrs} hr ago`;
  }

  const days = Math.floor(diff / 86400);
  return `Last seen ${days} day ago`;
};

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const firstLoadRef = useRef(true);
  

  const userId = JSON.parse(
    atob(localStorage.getItem("token").split(".")[1])
  ).id;

  useEffect(() => {
    socket.emit("register", userId);
    fetchFriends();
  }, []);

 
  useEffect(() => {
  if (!messagesEndRef.current) return;

  if (firstLoadRef.current) {
    // instant scroll when opening chat
    messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    firstLoadRef.current = false;
  } else {
    // smooth scroll for new messages
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [
        ...prev,
        { ...data, id: Date.now() } 

      ]);
    });
    return () => socket.off("receiveMessage");
  }, []);

  useEffect(() => {
  socket.on("onlineUsers", (users) => {
    setOnlineUsers(users);
  });

  return () => socket.off("onlineUsers");
}, []);

  const fetchFriends = async () => {
    const res = await API.get("/friends");
    setFriends(res.data.friends);
  };

  // 🔥 UPDATED HERE
  const loadConversation = async (friend) => {
    firstLoadRef.current = true;
    setSelectedFriend(friend);   // store full friend object

    const res = await API.get(`/messages/${friend.id}`);
    setMessages(res.data.messages);
  };

  return (
    <div className="chat-container">
      <Sidebar friends={friends} selectFriend={loadConversation} selectedFriend={selectedFriend} />

      <div className="chat-main">
        {selectedFriend ? (
          <>
            {/* 🔥 CHAT HEADER */}
            <div className="chat-header">
  <div className="chat-header-avatar">
    {selectedFriend.name.charAt(0).toUpperCase()}
  </div>

  <div className="chat-header-user">
    <span className="chat-header-name">
      {selectedFriend.name}
    </span>

    {onlineUsers.includes(selectedFriend.id) ? (
      <span className="online-status">Online</span>
    ) : (
      <span className="last-seen">
        {formatLastSeen(selectedFriend.last_seen)}
      </span>
    )}
  </div>
</div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} userId={userId} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <MessageInput
              receiver_Id={selectedFriend.id}  // use id here
              addMessage={setMessages}
            />
          </>
        ) : (
          <div className="no-chat">
            Select a friend to start chatting
          </div>
        )}
      </div>
    </div>
  );
}