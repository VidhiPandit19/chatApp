import { useEffect, useState, useRef } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import "./chat.css";
import TypingIndicator from "../components/TypingIndicator";


// Format "last seen" for display
const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "";

  const now = new Date();
  const last = new Date(lastSeen);
  const diff = Math.floor((now - last) / 1000);

  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)} hr ago`;
  return `Last seen ${Math.floor(diff / 86400)} day ago`;
};

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const firstLoadRef = useRef(true);

  // Get current user ID from token
  const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;

  // Register user and fetch friends on mount
  useEffect(() => {
    socket.emit("register", userId);
    fetchFriends();
  }, []);

  // Scroll messages to bottom
  useEffect(() => {
    if (!messagesEndRef.current) return;

    if (firstLoadRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      firstLoadRef.current = false;
    } else {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, { ...data, id: Date.now() }]);
    });
    return () => socket.off("receiveMessage");
  }, []);

  // Listen for online users
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });
    return () => socket.off("onlineUsers");
  }, []);

  // Listen for typing events
  useEffect(() => {
    socket.on("typing", ({ senderId }) => {
      setTypingUsers((prev) => [...new Set([...prev, senderId])]);
    });

    socket.on("stopTyping", ({ senderId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== senderId));
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, []);

  

  // Fetch friends from API
  const fetchFriends = async () => {
    const res = await API.get("/friends");
    setFriends(res.data.friends);
  };

  // Load conversation with a friend
  const loadConversation = async (friend) => {
    firstLoadRef.current = true;
    setSelectedFriend(friend);
    const res = await API.get(`/messages/${friend.id}`);
    setMessages(res.data.messages);
  };

  return (
    <div className="chat-container">
      <Sidebar
        friends={friends}
        selectFriend={loadConversation}
        selectedFriend={selectedFriend}
      />

      <div className="chat-main">
        {selectedFriend ? (
          <>
            {/* CHAT HEADER */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                {selectedFriend.name.charAt(0).toUpperCase()}
              </div>

              <div className="chat-header-user">
                <span className="chat-header-name">{selectedFriend.name}</span>

                {onlineUsers.includes(selectedFriend.id.toString()) ? (
                  <span className="online-status">Online</span>
                ) : (
                  <span className="last-seen">
                    {formatLastSeen(selectedFriend.last_seen) || "Offline"}
                  </span>
                )}
              </div>
            </div>

            {/* MESSAGES */}
            <div className="chat-messages">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} userId={userId} />
              ))}

              {/* TYPING INDICATOR */}
            {selectedFriend && typingUsers.includes(selectedFriend.id) && (
              <TypingIndicator />
            )}
              <div ref={messagesEndRef} />
            </div>

            {/* MESSAGE INPUT */}
            <MessageInput
              receiver_Id={selectedFriend.id}
              addMessage={setMessages}
              myId={userId} // <--- pass current user ID
            />
          </>
        ) : (
          <div className="no-chat">Select a friend to start chatting</div>
        )}
      </div>
    </div>
  );
}