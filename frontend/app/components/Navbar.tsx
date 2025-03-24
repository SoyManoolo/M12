// src/components/Navbar.tsx
import { Link } from "@remix-run/react";

export default function Navbar() {
  return (
    <nav>
      <h1>FriendsGo</h1>
      <ul>
        <li><Link to="/inicio">Inicio</Link></li>
        <li><Link to="/videollamadas">Videollamadas</Link></li>
        <li><Link to="/perfil">Perfil</Link></li>
      </ul>
    </nav>
  );
}
