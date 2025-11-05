// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  // Revalida el perfil según el token actual
  async function refreshMe() {
    const t = localStorage.getItem("token");
    if (!t) { setUser(null); return; }
    try {
      const u = await apiGet("/auth/me");
      setUser(u);
    } catch (err) {
      // si /auth/me falla (token inválido/expirado), limpiamos
      localStorage.removeItem("token");
      setUser(null);
      throw err; // por si el caller quiere reaccionar
    }
  }

  // Carga inicial de sesión + escucha cambios de token en otras pestañas
  useEffect(() => {
    refreshMe()
      .catch(() => {}) // ya limpiamos arriba
      .finally(() => setReady(true));

    const onStorage = (e) => {
      if (e.key !== "token") return;
      if (!e.newValue) {
        // logout en otra pestaña
        setUser(null);
      } else {
        // login/refresh en otra pestaña
        refreshMe().catch(() => {});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(email, password) {
    // eslint-disable-next-line no-useless-catch
    try {
      const { token, user } = await apiPost("api/v1/auth/login", { email, password });
      localStorage.setItem("token", token);
      setUser(user);
      return user;
    } catch (err) {
      // opcional: mapear mensajes de backend a mensajes de UI
      throw err;
    }
  }

  async function register(username, email, password) {
    // eslint-disable-next-line no-useless-catch
    try {
      const { token, user } = await apiPost("api/v1/auth/register", { username, email, password });
      localStorage.setItem("token", token);
      setUser(user);
      return user;
    } catch (err) {
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    ready,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshMe,
  }), [user, ready]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthCtx);
}
