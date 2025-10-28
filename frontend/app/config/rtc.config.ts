export const iceServersConfig = [
  // 1. STUN: Usamos el puerto estándar 3478
  { urls: "stun:coturn.top:3478" },

  // 2. TURNS (TURN cifrado, obligatorio con Let's Encrypt, usa puerto 5349)
  {
    urls: "turns:coturn.top:5349",
    username: "frontend",
    credential: "c59b060b81f4d15042095ce7c5d1dc8ef51310d69ff17805f0a60ecd8839be20"
  },

  // 3. TURN (sin cifrar, solo si falla el TURNS, usa puerto 3478)
  {
    urls: "turn:coturn.top:3478",
    username: "frontend",
    credential: "c59b060b81f4d15042095ce7c5d1dc8ef51310d69ff17805f0a60ecd8839be20"
  },
];