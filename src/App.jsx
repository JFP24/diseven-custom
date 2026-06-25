// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home/home.jsx";
import DesignerCanvas from "./components/diseñoCanvas.jsx";
import WhatsAppFab from "./components/WhatsAppFab.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { PrefsProvider } from "./i18n/PrefsContext.jsx";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404</h2>
      <a href="/">Volver al inicio</a>
    </div>
  );
}

export default function App() {
  return (
    <PrefsProvider>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Acceso libre: cualquiera puede diseñar como invitado.
            El inicio de sesión se solicita al guardar. */}
        <Route path="/designer" element={<DesignerCanvas />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WhatsAppFab />
    </AuthProvider>
    </PrefsProvider>
  );
}
