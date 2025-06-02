export const iceServersConfig = [
  { urls: "stun:192.168.253.87:3478" },
  {
    urls: "turn:192.168.253.87:3478?transport=tcp",
    username: "frontend",
    credential: "c59b060b81f4d15042095ce7c5d1dc8ef51310d69ff17805f0a60ecd8839be20"
  },
  {
    urls: "turn:192.168.253.87:3478?transport=udp",
    username: "frontend",
    credential: "c59b060b81f4d15042095ce7c5d1dc8ef51310d69ff17805f0a60ecd8839be20"
  },
];