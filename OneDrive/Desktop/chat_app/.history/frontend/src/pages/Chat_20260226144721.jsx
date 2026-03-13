import { useEffect, useState } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);

  const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;

  useEffect(() => {
    socket.emit("register", userId);
  }, []);

  useEffect(() => {
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
    <div style={{display:"flex", height:"100vh"}}>
      <Sidebar friends={friends} selectFriend={loadConversation}/>
      <div style={{flex:1}}>
        {messages.map((msg)=>(
          <MessageBubble key={msg.id} msg={msg} userId={userId}/>
        ))}
        {selectedFriend && 
          <MessageInput receiver_Id={selectedFriend} addMessage={setMessages}/>
        }
      </div>
    </div>
  );
}