// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home/home.jsx";
import DesignerCanvas from "./components/diseñoCanvas.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

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
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/designer"
          element={
            <ProtectedRoute>
              <DesignerCanvas />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
