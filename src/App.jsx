// App.jsx
import { Routes, Route, NavLink, Outlet } from 'react-router-dom'
import Home from './components/Home/home.jsx'
import DesignerCanvas from './components/diseñoCanvas.jsx'
import './App.css'


function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404</h2>
      <p>Página no encontrada.</p>
      <a href="/">Volver al inicio</a>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route >
        <Route path="/" element={<Home />} />
        <Route path="/designer" element={<DesignerCanvas />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
