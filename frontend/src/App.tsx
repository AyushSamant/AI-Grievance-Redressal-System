import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { auth } from "./firebase";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const backendBase = "http://127.0.0.1:8000";

  const register = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Registered successfully. Now login.");
  };

  const login = async () => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();

    const res = await axios.post(`${backendBase}/api/users/firebase-login/`, {
      idToken
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    alert("Login successful! Role: " + res.data.role);
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h2>AI Grievance System</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={register} style={{ width: "100%", padding: 10, marginBottom: 10 }}>
        Register
      </button>

      <button onClick={login} style={{ width: "100%", padding: 10 }}>
        Login
      </button>
    </div>
  );
}
