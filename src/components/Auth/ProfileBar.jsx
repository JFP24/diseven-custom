import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { usePrefs } from "../../i18n/PrefsContext.jsx";
import styles from "./ProfileBar.module.css";

export default function ProfileBar({ onClickHome }) {
  const { user, logout } = useAuth();
  const { t } = usePrefs();
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
        <button onClick={onClickHome} className={styles.homeBtn} title={t("profile.home")}>🏠</button>

        <div onClick={() => setMenuOpen(!menuOpen)} className={styles.avatar}>
          {initials || "?"}
        </div>

        <div>
          <div className={styles.name}>{user.username || t("profile.user")}</div>
          <div className={styles.email}>{user.email}</div>
            </div>
            {user?.guest && (
              <span className={styles.guestBadge}>{t("profile.guestMode")}</span>
            )}

        {menuOpen && (
          <div className={styles.logoutMenu}>
            <button className={styles.logoutBtn} onClick={logout}>{t("common.logout")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
