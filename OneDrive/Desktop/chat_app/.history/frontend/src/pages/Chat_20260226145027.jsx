import { useEffect, useState } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import "./chat.css";

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);

  const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;

  useEffect(() => {
    socket.emit("register", userId);
    fetchFriends();
  }, []);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });
  }, []);

  const fetchFriends = async () => {
    const res = await API.get("/friends");
    setFriends(res.data.friends);
  };

  const loadConversation = async (friendId) => {
    setSelectedFriend(friendId);
    const res = await API.get(`/messages/${friendId}`);
    setMessages(res.data.messages);
  };

  return (
    <div className="chat-container">
      <Sidebar friends={friends} selectFriend={loadConversation} />

      <div className="chat-main">
        {selectedFriend ? (
          <>
            <div className="chat-messages">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} userId={userId} />
              ))}
            </div>

            <MessageInput
              receiver_Id={selectedFriend}
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