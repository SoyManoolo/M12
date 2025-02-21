// src/pages/index.tsx
import React from "react";
import Navbar from "../components/Navbar";

const HomePage: React.FC = () => (
  <div>
    <Navbar />
    <h1>Bienvenido a FriendsGo</h1>
    <p>Conecta con personas de todo el mundo.</p>

    <input className="bg-amber-300" ></input>
    

  </div>
);

export default HomePage;
