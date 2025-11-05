// src/components/Auth/ProfileBar.jsx
import { useAuth } from "../../auth/AuthContext.jsx";

export default function ProfileBar({ onClickHome }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = (user.username || user.email || "?")
    .split(" ")
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div style={wrap}>
      <div style={left}>
        <button onClick={onClickHome} style={homeBtn} title="Inicio">🏠</button>
        <div style={avatar}>{initials || "?"}</div>
        <div>
          <div style={name}>{user.username || "Usuario"}</div>
          <div style={email}>{user.email}</div>
        </div>
      <button onClick={logout} style={logoutBtn}>Cerrar sesión</button>
      </div>
    </div>
  );
}

const wrap = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 12, padding: "10px 14px", 
  background: "#414040", color: "#eee", position: "sticky", top: 0, zIndex: 20
};
const left = { display: "flex", alignItems: "center", gap: 10 };
const avatar = {
  width: 46, height: 46, borderRadius: 999, background: "#1f1f1f",fontSize: 24,
  display: "grid", placeItems: "center", fontWeight: 700, color: "#ddd", border: "1px solid #2b2b2b"
};
const name = { fontWeight: 700, fontSize: 14, lineHeight: 1.1 };
const email = { fontSize: 12, opacity: 0.7, lineHeight: 1.1 };
const logoutBtn = {
  position: "absolute", right: 14,
  padding: "8px 12px", borderRadius: 10, border: "1px solid #2b2b2b",
  background: "red", color: "#ddd", cursor: "pointer"
};
const homeBtn = {
  fontSize: 28,
  padding: "6px 10px", borderRadius: 8, border: "1px solid #2b2b2b",
  background: "transparent", color: "#ddd", cursor: "pointer"
};
