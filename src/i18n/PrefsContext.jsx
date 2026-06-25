import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { dict } from "./dict.js";

const PrefsCtx = createContext(null);

function getInitialLang() {
  const saved = localStorage.getItem("lang");
  if (saved === "es" || saved === "en") return saved;
  const nav = (navigator.language || "es").toLowerCase();
  return nav.startsWith("en") ? "en" : "es";
}

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  return saved === "light" || saved === "dark" ? saved : "light";
}

export function PrefsProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const t = useCallback(
    (key) => (dict[lang] && dict[lang][key]) || dict.es[key] || key,
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      theme,
      t,
      setLang,
      setTheme,
      toggleLang: () => setLang((l) => (l === "es" ? "en" : "es")),
      toggleTheme: () => setTheme((th) => (th === "dark" ? "light" : "dark")),
    }),
    [lang, theme, t]
  );

  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrefs() {
  return useContext(PrefsCtx);
}
