import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import styles from "./ProfileBar.module.css";

export default function ProfileBar({ onClickHome }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const initials = (user.username || user.email || "?")
    .split(" ")
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className={styles.wrap}>
      <div className={styles.left}>
        <button onClick={onClickHome} className={styles.homeBtn} title="Inicio">🏠</button>

        <div onClick={() => setMenuOpen(!menuOpen)} className={styles.avatar}>
          {initials || "?"}
        </div>

        <div>
          <div className={styles.name}>{user.username || "Usuario"}</div>
          <div className={styles.email}>{user.email}</div>
        </div>
{user?.guest && (
  <div style={{ fontSize: 12, color: "#facc15" }}>Modo Invitado</div>
)}

        {menuOpen && (
          <div className={styles.logoutMenu}>
            <button className={styles.logoutBtn} onClick={logout}>Cerrar sesión</button>
          </div>
        )}
      </div>
    </div>
  );
}
