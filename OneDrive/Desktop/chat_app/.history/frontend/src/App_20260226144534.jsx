import { useState } from "react";
import AuthPage from "./pages/Login";
import ChatPage from "./pages/Chat";

function App() {
  const [user, setUser] = useState(null);

  return user ? (
    <ChatPage user={user} />
  ) : (
    <AuthPage onAuth={setUser} />
  );
}

export default App;