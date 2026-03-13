import { useState } from "react";
import API from "../api";

export default function MessageInput({ receiver_Id, addMessage }) {
  const [text, setText] = useState("");

  const send = async () => {
    const res = await API.post("/send", {
      receiver_Id,
      message: text
    });

    addMessage(prev => [...prev, res.data.data]);
    setText("");
  };

  return (
    <div>
      <input value={text} onChange={(e)=>setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}