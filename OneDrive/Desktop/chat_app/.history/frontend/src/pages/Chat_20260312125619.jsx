```javascript
import { useEffect, useState, useRef } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import TypingIndicator from "../components/TypingIndicator";
import "./chat.css";
import Peer from "simple-peer";

// Format last seen
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
  const [callActive, setCallActive] = useState(false);

  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const firstLoadRef = useRef(true);

  const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;

  // register user
  useEffect(() => {
    socket.emit("register", userId);
    fetchFriends();
  }, []);

  // camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // scroll messages
  useEffect(() => {
    if (!messagesEndRef.current) return;

    if (firstLoadRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      firstLoadRef.current = false;
    } else {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // receive message
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, { ...data, id: Date.now() }]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  // online users
  useEffect(() => {
    socket.on("onlineUsers", setOnlineUsers);
    return () => socket.off("onlineUsers");
  }, []);

  // typing
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

  // last seen
  useEffect(() => {
    socket.on("userLastSeen", ({ userId: uid, lastSeen }) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === uid ? { ...f, last_seen: lastSeen } : f))
      );

      if (selectedFriend?.id === uid) {
        setSelectedFriend((prev) => ({ ...prev, last_seen: lastSeen }));
      }
    });

    return () => socket.off("userLastSeen");
  }, [selectedFriend]);

  // incoming call
  useEffect(() => {
    socket.on("incomingCall", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    return () => socket.off("incomingCall");
  }, []);

  // call accepted
  useEffect(() => {
    socket.on("callAccepted", (signal) => {
      setCallActive(true);
      connectionRef.current?.signal(signal);
    });

    return () => socket.off("callAccepted");
  }, []);

  const fetchFriends = async () => {
    const res = await API.get("/friends");
    setFriends(res.data.friends);
  };

  const loadConversation = async (friend) => {
    firstLoadRef.current = true;
    setSelectedFriend(friend);
    const res = await API.get(`/messages/${friend.id}`);
    setMessages(res.data.messages);
  };

  // start call
  const startVideoCall = (receiverId) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: receiverId,
        signalData: data,
        from: userId,
      });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    connectionRef.current = peer;
  };

  // answer call
  const answerCall = () => {
    setCallActive(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", {
        signal: data,
        to: caller,
      });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    connectionRef.current?.destroy();
    setCallActive(false);
    socket.emit("endCall", { to: selectedFriend?.id });
  };

  return (
    <div className="chat-container">
      <Sidebar
        friends={friends}
        selectFriend={loadConversation}
        selectedFriend={selectedFriend}
        typingUsers={typingUsers}
      />

      <div className="chat-main">
        {selectedFriend ? (
          <>
            {/* HEADER */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                {selectedFriend.profilePic ? (
                  <img
                    src={`http://localhost:5000${selectedFriend.profilePic}`}
                    alt={selectedFriend.name}
                    className="chat-header-avatar-img"
                  />
                ) : (
                  selectedFriend.name.charAt(0).toUpperCase()
                )}
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

              <button
                className="video-call-btn"
                onClick={() => startVideoCall(selectedFriend.id)}
              >
                📹
              </button>

              {callActive && (
                <button className="end-call" onClick={leaveCall}>
                  End
                </button>
              )}
            </div>

            {/* VIDEO */}
            {callActive && (
              <div className="video-container">
                <video ref={myVideo} autoPlay muted />
                <video ref={userVideo} autoPlay />
              </div>
            )}

            {/* INCOMING CALL */}
            {receivingCall && !callActive && (
              <div className="incoming-call">
                <p>Incoming call...</p>
                <button onClick={answerCall}>Accept</button>
              </div>
            )}

            {/* MESSAGES */}
            <div className="chat-messages">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} userId={userId} />
              ))}

              {selectedFriend &&
                typingUsers.includes(selectedFriend.id) && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <MessageInput
              receiver_Id={selectedFriend.id}
              addMessage={setMessages}
              myId={userId}
            />
          </>
        ) : (
          <div className="no-chat">Select a friend to start chatting</div>
        )}
      </div>
    </div>
  );
}

