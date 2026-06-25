// src/components/Auth/LoginModal.jsx
import { useEffect, useState, useRef, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usePrefs } from "../../i18n/PrefsContext.jsx";
import styles from "./loginModal.module.css";
import Swal from 'sweetalert2';

export default function LoginModal({ open, onClose }) {
  const nav = useNavigate();
  const { user, login, register, loginAsGuest } = useAuth();
  const { t } = usePrefs();
  const [mode, setMode] = useState("login"); // login | register | invitado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const initialRef = useRef(null);

  useEffect(() => {
    // Solo reaccionamos a un inicio de sesión real (no al invitado automático).
    // Dependemos SOLO de `user` para no re-ejecutar en cada render.
    if (user && !user.guest) {
      onClose?.();
      nav("/designer"); // sin replace para poder volver al Home
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // foco inicial
    const tid = setTimeout(() => initialRef.current?.focus(), 50);
    // cerrar con ESC
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(tid);
      window.removeEventListener("keydown", onEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

async function handleSubmit(e) {
  e.preventDefault();
  try {
    setError("");
    setLoading(true);

    if (mode === "login") {
      await login(email, password);
    } else if (mode === "register") {
      await register(username, email, password);
    } else if (mode === "invitado") {
  loginAsGuest();
  onClose?.();
  Swal.fire({
    icon: 'info',
    title: 'Modo Invitado',
    text: 'Estás en modo visualización. Los cambios no se guardarán.',
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'Entendido'
  }).then(() => {
    nav("/designer");
  });
}

  } catch (err) {
    setError(err.message || "Error de autenticación");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className={styles.authOverlay} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={styles.authCard} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.authHeader}>
          <h3 className={styles.authTitle}>
            {mode === "login" ? t("login.signIn") : mode === "register" ? t("login.createAccount") : t("login.guestTab")}
          </h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            {/* ícono close */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.authBody}>
          {/* Tabs */}
          <div className={styles.tabRow}>
            <TabButton active={mode==="login"} onClick={()=>setMode("login")} label={t("login.signIn")} />
            <TabButton active={mode==="register"} onClick={()=>setMode("register")} label={t("login.createAccount")} />
            <TabButton active={mode==="invitado"} onClick={()=>setMode("invitado")} label={t("login.guest")} />
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <Field label={t("login.name")}>
                <Input
                  ref={initialRef}
                  placeholder={t("login.name")}
                  value={username}
                  onChange={setUsername}
                  icon="user"
                />
              </Field>
            )}

            {mode !== "invitado" && (
              <>
                <Field label={t("login.email")}>
                  <Input
                    ref={mode === "login" ? initialRef : undefined}
                    type="email"
                    placeholder="tucorreo@dominio.com"
                    value={email}
                    onChange={setEmail}
                    icon="mail"
                    required
                  />
                </Field>

                <Field label={t("login.password")}>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    icon="lock"
                    required
                  />
                </Field>
              </>
            )}

            {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
  <button
    type="submit"
    disabled={loading}
    className={styles.btnPrimaryAuth}
  >
    {loading ? t("login.loading") : mode === "login"
      ? t("login.enter")
      : mode === "register"
      ? t("login.register")
      : t("login.enterAsGuest")}
  </button>

  <button
    type="button"
    onClick={onClose}
    className={styles.btnGhostAuth}
  >
    {t("login.close")}
  </button>
</div>


   
          </form>
        </div>
      </div>
    </div>
  );
}


function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.tab} ${active ? styles.tabActive : ""}`}
    >
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

const icons = {
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

const Input = forwardRef(function Input(
  { value, onChange, placeholder, type = "text", icon, required, ...rest },
  ref
) {
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.55, display: "inline-flex" }}>
          {icons[icon]}
        </span>
      )}
      <input
        ref={ref}
        className={styles.input}
        style={{ paddingLeft: icon ? 40 : 14 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        {...rest}
      />
    </div>
  );
});
