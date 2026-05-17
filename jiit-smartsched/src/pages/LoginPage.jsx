import { useState } from "react";
import Spinner from "../components/Spinner";
import { API_BASE } from "../utils/api";

const ROLES = [
  { id:"admin",   icon:"🛡️", label:"Admin",   desc:"Upload timetables & manage clashes" },
  { id:"student", icon:"🎓", label:"Student", desc:"View your weekly class schedule"    },
];

export default function LoginPage({ onLogin }) {
  const [role,    setRole]    = useState("admin");
  const [user,    setUser]    = useState("");
  const [pass,    setPass]    = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr("");
    if (!user.trim() || !pass.trim()) {
      setErr("Please enter your Employee ID and password.");
      return;
    }
    setLoading(true);

    try {
      if (role === "admin") {
        // ── Real MongoDB login ──────────────────────────
        const res  = await fetch(`${API_BASE}/auth/login`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ employeeId: user.trim(), password: pass }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErr(data.error || "Invalid credentials.");
          setLoading(false);
          return;
        }

        // Save token for later API calls
        localStorage.setItem("token", data.token);
        onLogin({ ...data.user, role: "admin" });

      } else {
        // ── Student login (simple check) ────────────────
        // Replace this with your own student auth if you add it later
        if (user.trim() === "student1" && pass === "student123") {
          onLogin({ username: user.trim(), role: "student" });
        } else {
          setErr("Invalid student credentials. Use student1 / student123");
          setLoading(false);
        }
      }
    } catch (e) {
      setErr("Cannot connect to server. Make sure backend is running on port 5000.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0a0a0a",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, position:"relative", overflow:"hidden",
    }}>
      {/* Background glows */}
      <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:700, height:400, background:"radial-gradient(ellipse,rgba(124,58,237,.14) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:60, right:100, width:300, height:300, background:"radial-gradient(ellipse,rgba(59,130,246,.07) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div className="fadein" style={{ width:"100%", maxWidth:440 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{
            width:58, height:58, background:"#1e1a3a",
            border:"1px solid rgba(124,58,237,.45)", borderRadius:18,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, margin:"0 auto 16px",
          }}>
            📅
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", marginBottom:6, letterSpacing:"-0.02em" }}>
            JIIT SmartSched AI
          </h1>
          <p style={{ fontSize:13, color:"#6b7280" }}>B.Tech II Semester — Even 2026</p>
        </div>

        {/* Card */}
        <div style={{
          background:"#111", border:"1px solid rgba(255,255,255,.07)",
          borderRadius:22, padding:28, boxShadow:"0 25px 60px rgba(0,0,0,.5)",
        }}>
          <p style={{ fontSize:11, color:"#6b7280", marginBottom:13, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>
            Select Role
          </p>

          {/* Role selector */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:22 }}>
            {ROLES.map(r => (
              <div key={r.id} className={`role-btn${role === r.id ? " sel" : ""}`} onClick={() => { setRole(r.id); setErr(""); setUser(""); setPass(""); }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{r.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color: role === r.id ? "#c4b5fd" : "#fff", marginBottom:4 }}>{r.label}</div>
                <div style={{ fontSize:11, color:"#6b7280", lineHeight:1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          {/* Fields */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:5, fontWeight:500 }}>
              {role === "admin" ? "Employee ID" : "Username"}
            </div>
            <input
              className="inp"
              placeholder={role === "admin" ? "e.g. JIIT001" : "student1"}
              value={user}
              onChange={e => setUser(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()}
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:5, fontWeight:500 }}>Password</div>
            <input
              className="inp" type="password" placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()}
            />
          </div>

          {err && (
            <div style={{
              background:"rgba(239,68,68,.09)", border:"1px solid rgba(239,68,68,.2)",
              borderRadius:10, padding:"10px 14px", fontSize:12, color:"#f87171", marginBottom:16,
            }}>
              {err}
            </div>
          )}

          <button
            className="btn btn-purple"
            style={{ width:"100%", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
            onClick={go}
            disabled={loading}
          >
            {loading ? <Spinner /> : `Sign in as ${ROLES.find(r => r.id === role)?.label} →`}
          </button>

          {/* Credentials hint */}
          <div style={{
            marginTop:16, padding:"12px 14px",
            background:"rgba(124,58,237,.06)", borderRadius:11,
            border:"1px solid rgba(124,58,237,.15)",
          }}>
            {role === "admin" ? (
              <>
                <div style={{ fontSize:11, color:"#a78bfa", fontWeight:700, marginBottom:5 }}>🔑 Admin Credentials</div>
                <div style={{ fontSize:11, color:"#6b7280", marginBottom:2 }}>
                  Employee ID → <span style={{ color:"#e5e7eb" }}>JIIT001 to JIIT100</span>
                </div>
                <div style={{ fontSize:11, color:"#6b7280" }}>
                  Password → <span style={{ color:"#e5e7eb" }}>Admin@2026</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:11, color:"#a78bfa", fontWeight:700, marginBottom:5 }}>🔑 Student Credentials</div>
                <div style={{ fontSize:11, color:"#6b7280" }}>
                  Username → <span style={{ color:"#e5e7eb" }}>student1</span> &nbsp;|&nbsp; Password → <span style={{ color:"#e5e7eb" }}>student123</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}