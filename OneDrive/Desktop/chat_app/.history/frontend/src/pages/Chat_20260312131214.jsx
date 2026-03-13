```javascript
import { useEffect, useState, useRef } from "react";
import API from "../api";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import TypingIndicator from "../components/TypingIndicator";
import Peer from "simple-peer";
import "./chat.css";

/* -------- LAST SEEN FORMAT -------- */
const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "Offline";

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
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const firstLoadRef = useRef(true);

  const userId = JSON.parse(
    atob(localStorage.getItem("token").split(".")[1])
  ).id;

  /* -------- REGISTER USER -------- */

  useEffect(() => {
    socket.emit("register", userId);
    fetchFriends();
  }, []);

  /* -------- CAMERA ACCESS -------- */

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

  /* -------- AUTO SCROLL -------- */

  useEffect(() => {
    if (!messagesEndRef.current) return;

    if (firstLoadRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      firstLoadRef.current = false;
    } else {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* -------- RECEIVE MESSAGE -------- */

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, { ...data, id: Date.now() }]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  /* -------- ONLINE USERS -------- */

  useEffect(() => {
    socket.on("onlineUsers", setOnlineUsers);
    return () => socket.off("onlineUsers");
  }, []);

  /* -------- TYPING -------- */

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

  /* -------- LAST SEEN -------- */

  useEffect(() => {
    socket.on("userLastSeen", ({ userId: uid, lastSeen }) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === uid ? { ...f, last_seen: lastSeen } : f))
      );
    });

    return () => socket.off("userLastSeen");
  }, []);

  /* -------- INCOMING CALL -------- */

  useEffect(() => {
    socket.on("incomingCall", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    return () => socket.off("incomingCall");
  }, []);

  /* -------- CALL ACCEPTED -------- */

  useEffect(() => {
    socket.on("callAccepted", (signal) => {
      setCallActive(true);
      connectionRef.current?.signal(signal);
    });

    return () => socket.off("callAccepted");
  }, []);

  /* -------- FETCH FRIENDS -------- */

  const fetchFriends = async () => {
    const res = await API.get("/friends");
    setFriends(res.data.friends);
  };

  /* -------- LOAD CHAT -------- */

  const loadConversation = async (friend) => {
    firstLoadRef.current = true;
    setSelectedFriend(friend);

    const res = await API.get(`/messages/${friend.id}`);
    setMessages(res.data.messages);
  };

  /* -------- START VIDEO CALL -------- */

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

  /* -------- ANSWER CALL -------- */

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

  /* -------- END CALL -------- */

  const leaveCall = () => {
    connectionRef.current?.destroy();
    setCallActive(false);

    socket.emit("endCall", { to: selectedFriend?.id });
  };

  /* -------- UI -------- */

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

              <div className="chat-user">

                {selectedFriend.profilePic ? (
                  <img
                    src={`http://localhost:5000${selectedFriend.profilePic}`}
                    className="avatar"
                    alt="profile"
                  />
                ) : (
                  <div className="avatar">
                    {selectedFriend.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>

                  <div className="username">
                    {selectedFriend.name}
                  </div>

                  <div className="status">

                    {onlineUsers.includes(selectedFriend.id.toString())
                      ? "Online"
                      : formatLastSeen(selectedFriend.last_seen)}

                  </div>

                </div>

              </div>

              <div className="header-actions">

                <button
                  className="call-btn"
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

            </div>

            {/* VIDEO OVERLAY */}

            {callActive && (

              <div className="video-overlay">

                <video
                  ref={myVideo}
                  autoPlay
                  muted
                />

                <video
                  ref={userVideo}
                  autoPlay
                />

              </div>

            )}

            {/* INCOMING CALL */}

            {receivingCall && !callActive && (

              <div className="incoming-call">

                <p>Incoming Call...</p>

                <button onClick={answerCall}>
                  Accept
                </button>

              </div>

            )}

            {/* MESSAGES */}

            <div className="chat-messages">

              {messages.map((msg) => (

                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  userId={userId}
                />

              ))}

              {typingUsers.includes(selectedFriend.id) &&
                <TypingIndicator />}

              <div ref={messagesEndRef}></div>

            </div>

            {/* INPUT */}

            <MessageInput
              receiver_Id={selectedFriend.id}
              addMessage={setMessages}
              myId={userId}
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
```
