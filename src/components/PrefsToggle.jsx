import { Sun, Moon } from "lucide-react";
import { usePrefs } from "../i18n/PrefsContext.jsx";
import styles from "./prefsToggle.module.css";

export default function PrefsToggle({ className = "" }) {
  const { theme, toggleTheme, lang, toggleLang, t } = usePrefs();

  return (
    <div className={`${styles.wrap} ${className}`}>
      <button
        type="button"
        className={styles.btn}
        onClick={toggleTheme}
        title={t("prefs.theme")}
        aria-label={t("prefs.theme")}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <button
        type="button"
        className={styles.langBtn}
        onClick={toggleLang}
        title={t("prefs.language")}
        aria-label={t("prefs.language")}
      >
        <span className={lang === "es" ? styles.langActive : ""}>ES</span>
        <span className={styles.sep}>/</span>
        <span className={lang === "en" ? styles.langActive : ""}>EN</span>
      </button>
    </div>
  );
}
