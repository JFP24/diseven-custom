import { usePrefs } from "../i18n/PrefsContext.jsx";
import styles from "./whatsappFab.module.css";

// 👉 Número de DISEVEN en formato internacional, SIN "+", espacios ni guiones.
//    Ej. Colombia: 57 + número  ->  "573001234567"
const WHATSAPP_NUMBER = "573148601531"; // DISEVEN · +57 314 860 1531

export default function WhatsAppFab() {
  const { lang } = usePrefs();

  const text =
    lang === "en"
      ? "Hi DISEVEN! I'd like more info about the custom switch plates."
      : "¡Hola DISEVEN! Quiero más información sobre las placas de suiche personalizadas.";

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  const label = lang === "en" ? "Chat on WhatsApp" : "Escríbenos por WhatsApp";

  return (
    <a
      className={styles.fab}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
    >
      <span className={styles.pulse} aria-hidden />
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M16.04 4C9.4 4 4 9.4 4 16.04c0 2.12.55 4.18 1.6 6L4 28l6.13-1.6a12.02 12.02 0 0 0 5.9 1.5h.01c6.64 0 12.04-5.4 12.04-12.04C28.08 9.4 22.68 4 16.04 4Zm0 21.9h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.64.95.97-3.55-.24-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.46 4.45-9.9 9.9-9.9 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z"
        />
      </svg>
    </a>
  );
}
