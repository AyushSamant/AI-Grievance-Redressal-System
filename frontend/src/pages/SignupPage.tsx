import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", email: "", password: "",
    phone_number: "", role: "CITIZEN",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      await signup(form);
      navigate("/");          // redirect to home after signup
    } catch (err: any) {
      setError(err.response?.data?.username?.[0]
            || err.response?.data?.email?.[0]
            || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #DDE1E7", borderRadius: 8,
    fontSize: 14, outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F0F2F6",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "36px 32px",
        width: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, background: "#F5A623",
            borderRadius: 12, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 24, marginBottom: 10,
          }}>⚖️</div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif",
            fontSize: 22, fontWeight: 800, margin: 0 }}>
            Create Account
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Join NivaranAI — Smart Governance Platform
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, color: "#DC2626", marginBottom: 14,
          }}>{error}</div>
        )}

        {/* Form */}
        <input
          name="username" placeholder="Username"
          value={form.username} onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="email" placeholder="Email" type="email"
          value={form.email} onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="password" placeholder="Password" type="password"
          value={form.password} onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="phone_number" placeholder="Phone Number"
          value={form.phone_number} onChange={handleChange}
          style={inputStyle}
        />

        {/* Role dropdown */}
        <select
          name="role" value={form.role} onChange={handleChange}
          style={{ ...inputStyle, background: "#F9FAFB", cursor: "pointer" }}
        >
          <option value="CITIZEN">Citizen</option>
          <option value="OFFICER">Officer</option>
          <option value="ADMIN">Admin</option>
        </select>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: loading ? "#DDE1E7" : "#F5A623",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {loading ? "Creating account..." : "🚀 Sign Up"}
        </button>

        {/* Link to login */}
        <p style={{ textAlign: "center", fontSize: 13,
          color: "#6B7280", marginTop: 16 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#F5A623", fontWeight: 700 }}>
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}